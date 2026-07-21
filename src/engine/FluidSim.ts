import * as THREE from 'three';
import { simConfig, DEFAULT_PARAMS, PALETTES, PAPER, type InkMode, type TuneParams, type Tool } from './config';
import { inkAbsorption, computeSimSizes } from './math';
import {
  VERT, ADVECT, SPLAT, RADIAL_PUSH, CURL, VORTICITY,
  DIVERGENCE, PRESSURE, GRADIENT_SUBTRACT, CLEAR, DISPLAY,
} from './shaders';

/* Stable Fluids solver (Jos Stam) on ping-pong half-float FBOs.
   The dye field stores absorbance, not color: overlapping inks darken
   like real pigment because display composites paper × exp(-A). */

interface DoubleFBO {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  texel: THREE.Vector2;
  swap(): void;
  resize(w: number, h: number): void;
  resizePreserving(w: number, h: number, copy: (src: THREE.Texture, dst: THREE.WebGLRenderTarget) => void): void;
  dispose(): void;
}

const RING_INTERVAL = 0.28; // seconds
const COMB_TINES = 9;
const COMB_SPACING = 0.05;  // screen-height units

interface ActivePointer {
  down: boolean;
  moved: boolean;
  x: number; y: number;
  px: number; py: number;
  color: THREE.Color;
  ringTimer: number;
  ringPhase: number;
  isMouse: boolean;
}

// WebM first (Chrome, Edge, Firefox), MP4 as the Safari 17+ fallback.
const VIDEO_MIME_CANDIDATES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4;codecs=avc1', 'video/mp4'];
function pickVideoMime(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  return VIDEO_MIME_CANDIDATES.find(m => MediaRecorder.isTypeSupported(m)) ?? null;
}

export class FluidSim {
  onInteract?: () => void;
  onUndoAvailable?: (available: boolean) => void;

  private tool: Tool = 'brush';
  private inkMode: InkMode = 'cycle';
  private inkCycleIdx = 0;
  private autoFlow = false;
  private params: TuneParams = { ...DEFAULT_PARAMS };

  private renderer: THREE.WebGLRenderer;
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private scene = new THREE.Scene();
  private quad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

  private velocity: DoubleFBO;
  private dye: DoubleFBO;
  private pressure: DoubleFBO;
  private curlRT: THREE.WebGLRenderTarget;
  private divergeRT: THREE.WebGLRenderTarget;
  private undoDye: THREE.WebGLRenderTarget | null = null;
  private undoVel: THREE.WebGLRenderTarget | null = null;
  private hasUndo = false;

  private advectMat: THREE.ShaderMaterial;
  private splatMat: THREE.ShaderMaterial;
  private radialMat: THREE.ShaderMaterial;
  private curlMat: THREE.ShaderMaterial;
  private vorticityMat: THREE.ShaderMaterial;
  private divergeMat: THREE.ShaderMaterial;
  private pressureMat: THREE.ShaderMaterial;
  private gradientMat: THREE.ShaderMaterial;
  private clearMat: THREE.ShaderMaterial;
  private displayMat: THREE.ShaderMaterial;

  private inks: THREE.Color[];
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  private pointers = new Map<number, ActivePointer>();
  private lastInteraction = 0;
  private washing = 0;
  private recording: { frames: string[]; remaining: number; interval: number; sinceLast: number; resolve: (frames: string[]) => void } | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private videoChunks: Blob[] = [];
  private nextDrop = 1200;
  private nextStir = 2600;
  private lastT = performance.now();
  private rafId = 0;
  private resizeTimer = 0;
  private disposed = false;
  private pendingTimeouts: number[] = [];

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, depth: false, stencil: false });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.autoClear = false;
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute('aria-label', 'Ink-on-water canvas — draw with the pointer to make marbling patterns');
    container.appendChild(this.renderer.domElement);

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.scene.add(this.quad);

    const S = this.simSizes();
    this.velocity = this.makeDoubleFBO(S.sw, S.sh);
    this.dye = this.makeDoubleFBO(S.dw, S.dh);
    this.pressure = this.makeDoubleFBO(S.sw, S.sh);
    this.curlRT = this.makeRT(S.sw, S.sh);
    this.divergeRT = this.makeRT(S.sw, S.sh);

    const v2 = () => ({ value: new THREE.Vector2() });
    this.advectMat = this.prog(ADVECT, { uVelocity: { value: null }, uSource: { value: null }, uTexel: v2(), uDt: { value: 0 }, uDissipation: { value: 0 } });
    this.splatMat = this.prog(SPLAT, { uTarget: { value: null }, uAspect: { value: 1 }, uRadius: { value: 0.001 }, uPoint: v2(), uColor: { value: new THREE.Vector3() } });
    this.radialMat = this.prog(RADIAL_PUSH, { uTarget: { value: null }, uAspect: { value: 1 }, uRadius: { value: 0.001 }, uStrength: { value: 0 }, uPoint: v2() });
    this.curlMat = this.prog(CURL, { uVelocity: { value: null }, uTexel: v2() });
    this.vorticityMat = this.prog(VORTICITY, { uVelocity: { value: null }, uCurl: { value: null }, uTexel: v2(), uCurlStrength: { value: 0 }, uDt: { value: 0 } });
    this.divergeMat = this.prog(DIVERGENCE, { uVelocity: { value: null }, uTexel: v2() });
    this.pressureMat = this.prog(PRESSURE, { uPressure: { value: null }, uDivergence: { value: null }, uTexel: v2() });
    this.gradientMat = this.prog(GRADIENT_SUBTRACT, { uPressure: { value: null }, uVelocity: { value: null }, uTexel: v2() });
    this.clearMat = this.prog(CLEAR, { uTexture: { value: null }, uValue: { value: 0.8 } });
    const paper = new THREE.Color(PAPER);
    this.displayMat = this.prog(DISPLAY, { uDye: { value: null }, uTexel: v2(), uPaper: { value: new THREE.Vector3(paper.r, paper.g, paper.b) } });

    this.inks = PALETTES[0].colors.map(c => new THREE.Color(c.hex));

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    addEventListener('pointerup', this.onPointerUp);
    addEventListener('pointercancel', this.onPointerUp);
    addEventListener('keydown', this.onKeyDown);
    addEventListener('resize', this.onResize);

    this.seed();
    this.rafId = requestAnimationFrame(this.frame);
  }

  setTool(tool: Tool) { this.tool = tool; }
  setInkMode(mode: InkMode) { this.inkMode = mode; }
  setAutoFlow(on: boolean) { this.autoFlow = on; }
  wash() {
    this.saveUndo();
    this.washing = 1.6;
  }

  undo() {
    if (!this.hasUndo || !this.undoDye || !this.undoVel) return;
    this.copyInto(this.undoDye.texture, this.dye.write);
    this.dye.swap();
    this.copyInto(this.undoVel.texture, this.velocity.write);
    this.velocity.swap();
    this.hasUndo = false;
    this.onUndoAvailable?.(false);
  }

  setPalette(hexes: string[]) {
    this.inks = hexes.map(h => new THREE.Color(h));
    this.inkCycleIdx = 0;
  }

  setParam<K extends keyof TuneParams>(key: K, value: TuneParams[K]) {
    this.params[key] = value;
  }

  // toDataURL needs a freshly drawn buffer: without preserveDrawingBuffer
  // the canvas is only readable in the same task as the render
  saveImage() {
    this.drawDisplay();
    this.download(this.renderer.domElement.toDataURL('image/png'), 'png');
  }

  get recordingSupported(): boolean {
    return pickVideoMime() !== null && typeof this.renderer.domElement.captureStream === 'function';
  }

  startRecording() {
    if (this.mediaRecorder) return;
    const mime = pickVideoMime();
    if (!mime || typeof this.renderer.domElement.captureStream !== 'function') {
      throw new Error("This browser can't record video. Try Chrome, Edge or Firefox.");
    }
    const stream = this.renderer.domElement.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    this.videoChunks = [];
    rec.ondataavailable = e => { if (e.data.size > 0) this.videoChunks.push(e.data); };
    rec.onstop = () => {
      const url = URL.createObjectURL(new Blob(this.videoChunks, { type: mime }));
      this.videoChunks = [];
      this.download(url, ext);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    };
    rec.start();
    this.mediaRecorder = rec;
  }

  stopRecording() {
    this.mediaRecorder?.stop();
    this.mediaRecorder = null;
  }

  private stamp() {
    return new Date().toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '');
  }

  private download(href: string, ext: string) {
    const a = document.createElement('a');
    a.href = href;
    a.download = `suminagashi-${this.stamp()}.${ext}`;
    a.click();
  }

  // Frames are grabbed inside frame(), where the canvas buffer is still valid.
  recordClip(durationMs = 3000, fps = 10): Promise<string[]> {
    const interval = 1000 / fps;
    return new Promise(resolve => {
      this.recording?.resolve(this.recording.frames);
      this.recording = {
        frames: [],
        remaining: Math.max(1, Math.round(durationMs / interval)),
        interval,
        sinceLast: interval,
        resolve,
      };
    });
  }

  // Small enough for one Firestore document (1 MiB limit) — no Cloud Storage.
  private snapshot(maxWidth = 1000, quality = 0.82): string {
    const src = this.renderer.domElement;
    const scale = Math.min(1, maxWidth / src.width);
    const off = document.createElement('canvas');
    off.width = Math.round(src.width * scale);
    off.height = Math.round(src.height * scale);
    off.getContext('2d')!.drawImage(src, 0, 0, off.width, off.height);
    return off.toDataURL('image/jpeg', quality);
  }

  private drawDisplay() {
    const d = this.displayMat.uniforms;
    d.uDye.value = this.dye.read.texture;
    d.uTexel.value.copy(this.dye.texel);
    this.blit(this.displayMat, null);
  }

  dispose() {
    this.disposed = true;
    this.recording?.resolve(this.recording.frames);
    this.recording = null;
    if (this.mediaRecorder) {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.resizeTimer);
    this.pendingTimeouts.forEach(clearTimeout);
    this.pointers.clear();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    removeEventListener('pointerup', this.onPointerUp);
    removeEventListener('pointercancel', this.onPointerUp);
    removeEventListener('keydown', this.onKeyDown);
    removeEventListener('resize', this.onResize);

    [this.velocity, this.dye, this.pressure].forEach(f => f.dispose());
    [this.curlRT, this.divergeRT].forEach(rt => rt.dispose());
    this.undoDye?.dispose();
    this.undoVel?.dispose();
    [this.advectMat, this.splatMat, this.radialMat, this.curlMat, this.vorticityMat,
     this.divergeMat, this.pressureMat, this.gradientMat, this.clearMat, this.displayMat]
      .forEach(m => m.dispose());
    this.quad.geometry.dispose();
    this.renderer.dispose();
    canvas.remove();
  }

  private prog(frag: string, uniforms: Record<string, THREE.IUniform>) {
    return new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
  }

  private makeRT(w: number, h: number) {
    return new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      depthBuffer: false,
    });
  }

  private makeDoubleFBO(w: number, h: number): DoubleFBO {
    const makeRT = (rw: number, rh: number) => this.makeRT(rw, rh);
    let read = this.makeRT(w, h);
    let write = this.makeRT(w, h);
    const texel = new THREE.Vector2(1 / w, 1 / h);
    return {
      get read() { return read; },
      get write() { return write; },
      texel,
      swap() { const t = read; read = write; write = t; },
      resize(nw: number, nh: number) {
        read.setSize(nw, nh); write.setSize(nw, nh);
        texel.set(1 / nw, 1 / nh);
      },
      // setSize wipes contents: allocate fresh targets, blit the old picture across.
      resizePreserving(nw: number, nh: number, copy: (src: THREE.Texture, dst: THREE.WebGLRenderTarget) => void) {
        const newRead = makeRT(nw, nh);
        const newWrite = makeRT(nw, nh);
        copy(read.texture, newRead);
        read.dispose(); write.dispose();
        read = newRead; write = newWrite;
        texel.set(1 / nw, 1 / nh);
      },
      dispose() { read.dispose(); write.dispose(); },
    };
  }

  private simSizes() {
    return computeSimSizes(innerWidth, innerHeight, simConfig.SIM_RES, simConfig.DYE_RES);
  }

  private blit(mat: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  // The CLEAR shader with uValue=1 doubles as a texture copy (and rescale).
  private copyInto(src: THREE.Texture, dst: THREE.WebGLRenderTarget) {
    this.clearMat.uniforms.uTexture.value = src;
    this.clearMat.uniforms.uValue.value = 1;
    this.blit(this.clearMat, dst);
  }

  // Auto-flow drops never snapshot — they'd overwrite the user's undo point.
  private saveUndo() {
    const S = this.simSizes();
    if (!this.undoDye) this.undoDye = this.makeRT(S.dw, S.dh);
    if (!this.undoVel) this.undoVel = this.makeRT(S.sw, S.sh);
    this.copyInto(this.dye.read.texture, this.undoDye);
    this.copyInto(this.velocity.read.texture, this.undoVel);
    this.hasUndo = true;
    this.onUndoAvailable?.(true);
  }

  private currentInkColor(advance: boolean) {
    if (this.inkMode === 'cycle') {
      const c = this.inks[this.inkCycleIdx % this.inks.length];
      if (advance) this.inkCycleIdx++;
      return c;
    }
    return this.inks[this.inkMode] ?? this.inks[0];
  }

  private splatVelocity(x: number, y: number, fx: number, fy: number, radiusMul = 1) {
    const u = this.splatMat.uniforms;
    u.uTarget.value = this.velocity.read.texture;
    u.uAspect.value = innerWidth / innerHeight;
    u.uPoint.value.set(x, y);
    u.uRadius.value = simConfig.SPLAT_RADIUS * radiusMul;
    u.uColor.value.set(fx, fy, 0);
    this.blit(this.splatMat, this.velocity.write);
    this.velocity.swap();
  }

  private splatDye(x: number, y: number, absorption: THREE.Vector3, radiusMul = 1) {
    const u = this.splatMat.uniforms;
    u.uTarget.value = this.dye.read.texture;
    u.uAspect.value = innerWidth / innerHeight;
    u.uPoint.value.set(x, y);
    u.uRadius.value = simConfig.SPLAT_RADIUS * radiusMul;
    u.uColor.value.copy(absorption);
    this.blit(this.splatMat, this.dye.write);
    this.dye.swap();
  }

  private radialPush(x: number, y: number, radiusMul: number, strength: number) {
    const u = this.radialMat.uniforms;
    u.uTarget.value = this.velocity.read.texture;
    u.uAspect.value = innerWidth / innerHeight;
    u.uPoint.value.set(x, y);
    u.uRadius.value = simConfig.SPLAT_RADIUS * radiusMul;
    u.uStrength.value = strength;
    this.blit(this.radialMat, this.velocity.write);
    this.velocity.swap();
  }

  private dropInk(x: number, y: number, color: THREE.Color, strength: number) {
    this.splatDye(x, y, inkAbsorption(color, strength * 0.22), 1.0);
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 80;
    this.splatVelocity(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 1.2);
  }

  // Alternating ink drops and water pushes grow concentric rings.
  private ringTick(pt: ActivePointer) {
    if (pt.ringPhase % 2 === 0) {
      const c = this.currentInkColor(true);
      this.splatDye(pt.x, pt.y, inkAbsorption(c, 0.3), 1.8);
      this.radialPush(pt.x, pt.y, 5.0, 95);
    } else {
      this.radialPush(pt.x, pt.y, 6.0, 150);
    }
    pt.ringPhase++;
  }

  private comb(x: number, y: number, dx: number, dy: number) {
    const aspect = innerWidth / innerHeight;
    const vx = dx * aspect, vy = dy;
    const len = Math.hypot(vx, vy);
    if (len < 1e-5) return;
    const px = -vy / len, py = vx / len;
    const fx = dx * this.params.force * 1.1;
    const fy = dy * this.params.force * 1.1;
    for (let i = 0; i < COMB_TINES; i++) {
      const o = (i - (COMB_TINES - 1) / 2) * COMB_SPACING;
      this.splatVelocity(x + (px * o) / aspect, y + py * o, fx, fy, 0.55);
    }
  }

  private toUV(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
  }

  private onPointerDown = (e: PointerEvent) => {
    // Only the first finger down snapshots undo — the whole gesture is one action.
    const gestureStart = ![...this.pointers.values()].some(p => p.down);
    if (gestureStart) this.saveUndo();

    const p = this.toUV(e);
    const pt: ActivePointer = {
      down: true,
      moved: false,
      x: p.x, y: p.y, px: p.x, py: p.y,
      color: this.currentInkColor(this.tool !== 'ring'),
      ringTimer: RING_INTERVAL,
      ringPhase: 0,
      isMouse: e.pointerType === 'mouse',
    };
    this.pointers.set(e.pointerId, pt);

    if (this.tool === 'brush') {
      this.dropInk(p.x, p.y, pt.color, 0.6 + Math.random() * 0.3);
    } else if (this.tool === 'ring') {
      this.ringTick(pt);
    }
    // comb deliberately drops no ink on touch — it only moves water

    this.lastInteraction = performance.now();
    this.onInteract?.();
  };

  private onPointerMove = (e: PointerEvent) => {
    const p = this.toUV(e);
    let pt = this.pointers.get(e.pointerId);
    if (!pt) {
      // move without a down = mouse/pen hover
      pt = {
        down: false, moved: false,
        x: p.x, y: p.y, px: p.x, py: p.y,
        color: this.inks[0],
        ringTimer: 0, ringPhase: 0,
        isMouse: true,
      };
      this.pointers.set(e.pointerId, pt);
    }
    pt.px = pt.x;
    pt.py = pt.y;
    pt.x = p.x;
    pt.y = p.y;
    pt.moved = true;
    this.lastInteraction = performance.now();
  };

  private onPointerUp = (e: PointerEvent) => {
    const pt = this.pointers.get(e.pointerId);
    if (!pt) return;
    // Fingers vanish on lift; the mouse stays so hovering keeps stirring.
    if (pt.isMouse) pt.down = false;
    else this.pointers.delete(e.pointerId);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    // Never fire on focused controls or behind modals — Space must keep activating buttons.
    const t = e.target instanceof HTMLElement ? e.target : null;
    if (t?.closest('button, input, select, textarea, [contenteditable], [tabindex]')) return;
    if (document.querySelector('[aria-modal="true"]')) return;

    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      this.undo();
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      this.saveUndo();
      this.dropInk(0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.6, this.currentInkColor(true), 0.8 + Math.random() * 0.6);
      this.onInteract?.();
    }
    if (e.key === 'x' || e.key === 'X') this.wash();
    if (e.key === 's' || e.key === 'S') this.saveImage();
  };

  private applyPointer() {
    for (const pt of this.pointers.values()) {
      if (!pt.moved) continue;
      pt.moved = false;
      const dx = pt.x - pt.px;
      const dy = pt.y - pt.py;
      if (Math.abs(dx) + Math.abs(dy) < 1e-6) continue;
      const fx = dx * this.params.force;
      const fy = dy * this.params.force;

      if (pt.down && this.tool === 'comb') {
        this.comb(pt.x, pt.y, dx, dy);
        continue;
      }
      const hoverBoost = pt.down ? 1 : 1.7;
      this.splatVelocity(pt.x, pt.y, fx * hoverBoost, fy * hoverBoost, pt.down ? 2.0 : 2.6);
      if (pt.down && this.tool === 'brush') {
        // ink feeds with stroke speed so slow strokes stay watery, not saturated
        const speed = Math.min(Math.hypot(dx, dy) * 26, 1);
        if (speed > 0.04) {
          this.splatDye(pt.x, pt.y, inkAbsorption(pt.color, speed * this.params.flow), 1.5);
        }
      }
    }
  }

  private autoUpdate(now: number, dt: number) {
    if (!this.autoFlow) return;
    const idle = now - this.lastInteraction > 3000;

    this.nextDrop -= dt * 1000;
    if (idle && this.nextDrop <= 0) {
      const x = 0.14 + Math.random() * 0.72;
      const y = 0.16 + Math.random() * 0.68;
      const c = this.inks[Math.floor(Math.random() * this.inks.length)];
      this.dropInk(x, y, c, 0.8 + Math.random() * 0.7);

      if (Math.random() < 0.3) {
        const c2 = this.inks[Math.floor(Math.random() * this.inks.length)];
        const x2 = Math.min(Math.max(x + (Math.random() - 0.5) * 0.16, 0.08), 0.92);
        const y2 = Math.min(Math.max(y + (Math.random() - 0.5) * 0.16, 0.08), 0.92);
        const id = window.setTimeout(() => { if (!this.disposed) this.dropInk(x2, y2, c2, 0.5 + Math.random() * 0.4); }, 220 + Math.random() * 300);
        this.pendingTimeouts.push(id);
      }
      this.nextDrop = (this.reducedMotion ? 6500 : 2600) + Math.random() * 2600;
    }

    this.nextStir -= dt * 1000;
    if (!this.reducedMotion && this.nextStir <= 0) {
      const t = now * 0.00012;
      const cx = 0.5 + Math.sin(t * 1.7) * 0.3;
      const cy = 0.5 + Math.cos(t * 1.1) * 0.3;
      const a = t * 6.0 + Math.random() * 1.5;
      this.splatVelocity(cx, cy, Math.cos(a) * 130, Math.sin(a) * 130, 14);
      this.nextStir = 700 + Math.random() * 900;
    }
  }

  private step(dt: number) {
    const vel = this.velocity;

    this.curlMat.uniforms.uVelocity.value = vel.read.texture;
    this.curlMat.uniforms.uTexel.value.copy(vel.texel);
    this.blit(this.curlMat, this.curlRT);

    const vo = this.vorticityMat.uniforms;
    vo.uVelocity.value = vel.read.texture;
    vo.uCurl.value = this.curlRT.texture;
    vo.uTexel.value.copy(vel.texel);
    vo.uCurlStrength.value = this.params.curl;
    vo.uDt.value = dt;
    this.blit(this.vorticityMat, vel.write);
    vel.swap();

    this.divergeMat.uniforms.uVelocity.value = vel.read.texture;
    this.divergeMat.uniforms.uTexel.value.copy(vel.texel);
    this.blit(this.divergeMat, this.divergeRT);

    // pressure from the previous frame is decayed, not discarded — it
    // pre-seeds the Jacobi iterations so 28 passes are enough
    this.clearMat.uniforms.uTexture.value = this.pressure.read.texture;
    this.clearMat.uniforms.uValue.value = 0.8;
    this.blit(this.clearMat, this.pressure.write);
    this.pressure.swap();

    this.pressureMat.uniforms.uDivergence.value = this.divergeRT.texture;
    this.pressureMat.uniforms.uTexel.value.copy(vel.texel);
    for (let i = 0; i < simConfig.PRESSURE_ITER; i++) {
      this.pressureMat.uniforms.uPressure.value = this.pressure.read.texture;
      this.blit(this.pressureMat, this.pressure.write);
      this.pressure.swap();
    }

    const gr = this.gradientMat.uniforms;
    gr.uPressure.value = this.pressure.read.texture;
    gr.uVelocity.value = vel.read.texture;
    gr.uTexel.value.copy(vel.texel);
    this.blit(this.gradientMat, vel.write);
    vel.swap();

    const ad = this.advectMat.uniforms;
    ad.uVelocity.value = vel.read.texture;
    ad.uSource.value = vel.read.texture;
    ad.uTexel.value.copy(vel.texel);
    ad.uDt.value = dt;
    ad.uDissipation.value = simConfig.VEL_DISSIPATION;
    this.blit(this.advectMat, vel.write);
    vel.swap();

    ad.uVelocity.value = vel.read.texture;
    ad.uSource.value = this.dye.read.texture;
    ad.uTexel.value.copy(this.dye.texel);
    ad.uDissipation.value = this.params.fade + (this.washing > 0 ? 2.4 : 0);
    this.blit(this.advectMat, this.dye.write);
    this.dye.swap();

    if (this.washing > 0) this.washing -= dt;
  }

  private frame = (now: number) => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.frame);
    let dt = (now - this.lastT) / 1000;
    this.lastT = now;
    dt = Math.min(dt, 1 / 30);
    if (dt <= 0) return;

    this.applyPointer();

    if (this.tool === 'ring') {
      for (const pt of this.pointers.values()) {
        if (!pt.down) continue;
        pt.ringTimer -= dt;
        if (pt.ringTimer <= 0) {
          this.ringTick(pt);
          pt.ringTimer = RING_INTERVAL;
        }
      }
    }

    this.autoUpdate(now, dt);
    this.step(dt);

    const d = this.displayMat.uniforms;
    d.uDye.value = this.dye.read.texture;
    d.uTexel.value.copy(this.dye.texel);
    this.blit(this.displayMat, null);

    if (this.recording) {
      this.recording.sinceLast += dt * 1000;
      if (this.recording.sinceLast >= this.recording.interval) {
        this.recording.sinceLast = 0;
        this.recording.frames.push(this.snapshot());
        if (--this.recording.remaining <= 0) {
          this.recording.resolve(this.recording.frames);
          this.recording = null;
        }
      }
    }
  };

  private seed() {
    const n = this.inks.length;
    this.dropInk(0.38, 0.58, this.inks[0], 0.75);
    const t1 = window.setTimeout(() => { if (!this.disposed) this.dropInk(0.62, 0.42, this.inks[1 % n], 0.6); }, 450);
    const t2 = window.setTimeout(() => { if (!this.disposed) this.dropInk(0.5, 0.62, this.inks[2 % n], 0.5); }, 950);
    this.pendingTimeouts.push(t1, t2);
  }

  private onResize = () => {
    // Debounced — drags and mobile URL-bar changes fire bursts; CSS stretch bridges the gap.
    clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      if (this.disposed) return;
      this.renderer.setSize(innerWidth, innerHeight);
      const S = this.simSizes();
      const copy = (src: THREE.Texture, dst: THREE.WebGLRenderTarget) => this.copyInto(src, dst);
      // dye + velocity survive the resize; pressure/curl/divergence are transient
      this.velocity.resizePreserving(S.sw, S.sh, copy);
      this.dye.resizePreserving(S.dw, S.dh, copy);
      this.pressure.resize(S.sw, S.sh);
      this.curlRT.setSize(S.sw, S.sh);
      this.divergeRT.setSize(S.sw, S.sh);
      // undo snapshots are at the old resolution — drop them
      this.undoDye?.dispose(); this.undoDye = null;
      this.undoVel?.dispose(); this.undoVel = null;
      this.hasUndo = false;
      this.onUndoAvailable?.(false);
    }, 150);
  };
}
