import { useEffect, useRef, useState } from 'react';
import { FluidSim } from './engine/FluidSim';
import { DEFAULT_PARAMS, PALETTES, type InkMode, type TuneParams, type Tool } from './engine/config';
import { galleryEnabled, publishMarble } from './gallery';
import Dock from './components/Dock';
import TunePanel from './components/TunePanel';
import Gallery from './components/Gallery';

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<FluidSim | null>(null);
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [inkMode, setInkMode] = useState<InkMode>('cycle');
  const [tool, setTool] = useState<Tool>('brush');
  const [autoFlow, setAutoFlow] = useState(false);
  const [hintGone, setHintGone] = useState(false);
  const [params, setParams] = useState<TuneParams>({ ...DEFAULT_PARAMS });
  const [tuneOpen, setTuneOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const palette = PALETTES[paletteIdx];

  const flash = (text: string) => setStatus(text);

  const updateParam = (key: keyof TuneParams, value: number) => {
    setParams(p => ({ ...p, [key]: value }));
    simRef.current?.setParam(key, value);
  };

  const resetParams = () => {
    setParams({ ...DEFAULT_PARAMS });
    (Object.keys(DEFAULT_PARAMS) as (keyof TuneParams)[]).forEach(k =>
      simRef.current?.setParam(k, DEFAULT_PARAMS[k]));
  };

  const openGallery = () => {
    setPreview(simRef.current?.capturePreview() ?? null);
    setGalleryOpen(true);
  };

  const publish = async () => {
    if (!preview) return false;
    try {
      await publishMarble(preview, palette.label);
      flash('Published to the gallery');
      return true;
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not publish');
      return false;
    }
  };

  useEffect(() => {
    const sim = new FluidSim(stageRef.current!);
    sim.onInteract = () => setHintGone(true);
    simRef.current = sim;
    const timer = setTimeout(() => setHintGone(true), 9000);
    return () => {
      clearTimeout(timer);
      sim.dispose();
      simRef.current = null;
    };
  }, []);

  useEffect(() => {
    simRef.current?.setPalette(PALETTES[paletteIdx].colors.map(c => c.hex));
    setInkMode('cycle');
  }, [paletteIdx]);
  useEffect(() => { simRef.current?.setInkMode(inkMode); }, [inkMode]);
  useEffect(() => { simRef.current?.setTool(tool); }, [tool]);
  useEffect(() => { simRef.current?.setAutoFlow(autoFlow); }, [autoFlow]);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 2800);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <>
      <div className="stage" ref={stageRef} />

      <div className="title">
        <h1>墨流し</h1>
        <div className="sub">SUMINAGASHI — INK DISSOLUTION</div>
      </div>

      <div className={hintGone ? 'hint gone' : 'hint'}>TRACE THE SURFACE — LET THE INK FLOW</div>

      {tuneOpen && (
        <TunePanel
          params={params}
          onChange={updateParam}
          onReset={resetParams}
          onClose={() => setTuneOpen(false)}
        />
      )}

      {status && <div className="toast" role="status">{status}</div>}

      {galleryOpen && (
        <Gallery preview={preview} onPublish={publish} onClose={() => setGalleryOpen(false)} />
      )}

      <Dock
        palette={palette}
        inkMode={inkMode}
        tool={tool}
        autoFlow={autoFlow}
        tuneOpen={tuneOpen}
        onPalette={() => setPaletteIdx(i => (i + 1) % PALETTES.length)}
        onInk={setInkMode}
        onTool={setTool}
        onAuto={() => setAutoFlow(v => !v)}
        onTune={() => setTuneOpen(v => !v)}
        onWash={() => simRef.current?.wash()}
        onSave={() => simRef.current?.saveImage()}
        onGallery={openGallery}
      />
    </>
  );
}
