import { useEffect, useRef, useState } from 'react';
import { FluidSim } from './engine/FluidSim';
import { DEFAULT_PARAMS, PALETTES, type InkMode, type TuneParams, type Tool } from './engine/config';
import { galleryEnabled, publishMarble } from './gallery';
import Dock from './components/Dock';
import TunePanel from './components/TunePanel';
import Gallery from './components/Gallery';
import PublishDialog from './components/PublishDialog';

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
  const [publishOpen, setPublishOpen] = useState(false);
  const [clip, setClip] = useState<string[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [webglError, setWebglError] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const palette = PALETTES[paletteIdx];

  const flash = (text: string) => setStatus(text);

  const toggleRecord = () => {
    const sim = simRef.current;
    if (!sim) return;
    if (recording) {
      sim.stopRecording();
      setRecording(false);
      flash('Video saved');
    } else {
      try {
        sim.startRecording();
        setRecording(true);
      } catch (e) {
        flash(e instanceof Error ? e.message : 'Recording is not supported here');
      }
    }
  };

  const updateParam = (key: keyof TuneParams, value: number) => {
    setParams(p => ({ ...p, [key]: value }));
    simRef.current?.setParam(key, value);
  };

  const resetParams = () => {
    setParams({ ...DEFAULT_PARAMS });
    (Object.keys(DEFAULT_PARAMS) as (keyof TuneParams)[]).forEach(k =>
      simRef.current?.setParam(k, DEFAULT_PARAMS[k]));
  };

  const startPublish = async () => {
    if (!galleryEnabled) {
      flash('Connect Firebase to publish — see README');
      return;
    }
    setClip(null);
    setPublishOpen(true);
    const frames = await simRef.current!.recordClip();
    setClip(frames);
  };

  const publishImage = async (image: string) => {
    try {
      await publishMarble(image, palette.label);
      flash('Published to the gallery');
      return true;
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not publish');
      return false;
    }
  };

  useEffect(() => {
    let sim: FluidSim;
    try {
      sim = new FluidSim(stageRef.current!);
    } catch {
      setWebglError(true);
      return;
    }
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

  useEffect(() => {
    if (!recording) return;
    setRecordSecs(0);
    const start = Date.now();
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000);
      setRecordSecs(secs);
      if (secs >= 30) {
        simRef.current?.stopRecording();
        setRecording(false);
        setStatus('Video saved');
      }
    }, 250);
    return () => clearInterval(id);
  }, [recording]);

  return (
    <>
      <div className="stage" ref={stageRef} />

      <div className="title">
        <h1>墨流し</h1>
        <div className="sub">SUMINAGASHI — INK DISSOLUTION</div>
      </div>

      {webglError ? (
        <div className="webgl-error" role="alert">
          This canvas needs WebGL, which your browser or device couldn't start.
          Try another browser, or enable hardware acceleration, and reload.
        </div>
      ) : (
        <>
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

          {recording && (
            <div className="rec-badge" role="status">
              <span className="rec-dot" />Recording {Math.floor(recordSecs / 60)}:{String(recordSecs % 60).padStart(2, '0')}
            </div>
          )}

          {publishOpen && (
            <PublishDialog clip={clip} onPublish={publishImage} onClose={() => setPublishOpen(false)} />
          )}

          {galleryOpen && <Gallery onClose={() => setGalleryOpen(false)} />}

          <Dock
            palette={palette}
            inkMode={inkMode}
            tool={tool}
            autoFlow={autoFlow}
            tuneOpen={tuneOpen}
            recording={recording}
            onPalette={() => setPaletteIdx(i => (i + 1) % PALETTES.length)}
            onInk={setInkMode}
            onTool={setTool}
            onAuto={() => setAutoFlow(v => !v)}
            onTune={() => setTuneOpen(v => !v)}
            onWash={() => simRef.current?.wash()}
            onSave={() => simRef.current?.saveImage()}
            onRecord={toggleRecord}
            onPublish={startPublish}
            onGallery={() => setGalleryOpen(true)}
          />
        </>
      )}
    </>
  );
}
