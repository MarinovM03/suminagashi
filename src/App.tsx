import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_PARAMS, PALETTES, type InkMode, type TuneParams, type Tool } from './engine/config';
import { galleryEnabled, publishMarble } from './gallery';
import { useFluidSim } from './useFluidSim';
import Dock from './components/Dock';
import TunePanel from './components/TunePanel';
import Gallery from './components/Gallery';
import PublishDialog from './components/PublishDialog';

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [inkMode, setInkMode] = useState<InkMode>('cycle');
  const [tool, setTool] = useState<Tool>('brush');
  const [autoFlow, setAutoFlow] = useState(false);
  const [params, setParams] = useState<TuneParams>({ ...DEFAULT_PARAMS });
  const [tuneOpen, setTuneOpen] = useState(false);
  // ?m=<id> share links open the gallery straight onto that marble.
  const [deepLinkId] = useState(() => new URLSearchParams(location.search).get('m'));
  const [galleryOpen, setGalleryOpen] = useState(() => Boolean(deepLinkId) && galleryEnabled);
  const [publishOpen, setPublishOpen] = useState(false);
  const [clip, setClip] = useState<string[] | null>(null);
  const [status, setStatus] = useState<{ text: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [uiHidden, setUiHidden] = useState(false);
  const palette = PALETTES[paletteIdx];

  const { simRef, webglError, hintGone, recordingSupported, canUndo } = useFluidSim(stageRef, { tool, inkMode, autoFlow, palette });

  // A fresh object each call so an identical repeated message still resets the timer.
  const flash = useCallback((text: string) => setStatus({ text }), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'h' && e.key !== 'H') return;
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (t?.closest('button, input, select, textarea, [contenteditable], [tabindex]')) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      const next = !uiHidden;
      setUiHidden(next);
      if (next) flash('Controls hidden — press H to show them');
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [uiHidden, flash]);

  const cyclePalette = () => {
    setPaletteIdx(i => (i + 1) % PALETTES.length);
    setInkMode('cycle');
  };

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

  const closeGallery = () => {
    setGalleryOpen(false);
    if (location.search) history.replaceState(null, '', location.pathname);
  };

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
        setStatus({ text: 'Video saved' });
      }
    }, 250);
    return () => clearInterval(id);
  }, [recording, simRef]);

  return (
    <>
      <div className="stage" ref={stageRef} />

      {!uiHidden && (
        <div className="title">
          <h1 aria-label="Suminagashi" lang="ja">墨流し</h1>
          <div className="sub">SUMINAGASHI — INK DISSOLUTION</div>
        </div>
      )}

      {webglError ? (
        <div className="webgl-error" role="alert">
          This canvas needs WebGL, which your browser or device couldn't start.
          Try another browser, or enable hardware acceleration, and reload.
        </div>
      ) : (
        <>
          {!uiHidden && <div className={hintGone ? 'hint gone' : 'hint'}>TRACE THE SURFACE — LET THE INK FLOW</div>}

          {tuneOpen && !uiHidden && (
            <TunePanel
              params={params}
              onChange={updateParam}
              onReset={resetParams}
              onClose={() => setTuneOpen(false)}
            />
          )}

          {status && <div className="toast" role="status">{status.text}</div>}

          {recording && (
            <div className="rec-badge" role="status">
              <span className="rec-dot" />Recording {Math.floor(recordSecs / 60)}:{String(recordSecs % 60).padStart(2, '0')}
            </div>
          )}

          {publishOpen && (
            <PublishDialog clip={clip} onPublish={publishImage} onClose={() => setPublishOpen(false)} />
          )}

          {galleryOpen && <Gallery initialId={deepLinkId ?? undefined} notify={flash} onClose={closeGallery} />}

          {!uiHidden && (
            <Dock
              palette={palette}
              inkMode={inkMode}
              tool={tool}
              autoFlow={autoFlow}
              tuneOpen={tuneOpen}
              recording={recording}
              canRecord={recordingSupported}
              canUndo={canUndo}
              onPalette={cyclePalette}
              onInk={setInkMode}
              onTool={setTool}
              onAuto={() => setAutoFlow(v => !v)}
              onTune={() => setTuneOpen(v => !v)}
              onWash={() => simRef.current?.wash()}
              onUndo={() => simRef.current?.undo()}
              onSave={() => simRef.current?.saveImage()}
              onRecord={toggleRecord}
              onPublish={startPublish}
              onGallery={() => setGalleryOpen(true)}
            />
          )}
        </>
      )}
    </>
  );
}
