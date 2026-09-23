import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_PARAMS, PALETTES, type InkMode, type TuneParams, type Tool } from './engine/config';
import { useFluidSim } from './useFluidSim';
import { useHotkeys } from './hotkeys';
import { COMPACT_QUERY, useMediaQuery } from './useMediaQuery';
import { useFullscreen } from './fullscreen';
import { downloadBlob, stampedName } from './files';
import { shareFile } from './share';
import { firstTime } from './storage';
import DockWide from './components/DockWide';
import DockCompact from './components/DockCompact';
import CaptureButtons from './components/CaptureButtons';
import CaptureSheet, { type Capture } from './components/CaptureSheet';
import InkTray from './components/InkTray';
import TunePanel from './components/TunePanel';
import MenuSheet from './components/MenuSheet';
import AboutSheet from './components/AboutSheet';
import RecordingPill from './components/RecordingPill';
import Toast, { type ToastMessage } from './components/Toast';

type Panel = 'none' | 'tune' | 'inks';
type SheetName = 'none' | 'menu' | 'about';

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const compact = useMediaQuery(COMPACT_QUERY);
  const fullscreen = useFullscreen();
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [inkMode, setInkMode] = useState<InkMode>('cycle');
  const [tool, setTool] = useState<Tool>('brush');
  const [autoFlow, setAutoFlow] = useState(false);
  const [params, setParams] = useState<TuneParams>({ ...DEFAULT_PARAMS });
  const [panel, setPanel] = useState<Panel>('none');
  const [sheet, setSheet] = useState<SheetName>('none');
  const [capture, setCapture] = useState<Capture | null>(null);
  const [shutter, setShutter] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [recordSecs, setRecordSecs] = useState(0);
  const [uiHidden, setUiHidden] = useState(false);
  const toastId = useRef(0);
  const palette = PALETTES[paletteIdx];

  const flash = useCallback((text: string) => setToast({ id: ++toastId.current, text }), []);

  const { simRef, webglError, hintGone, recordingSupported, recording, canUndo } = useFluidSim(
    stageRef,
    { tool, inkMode, autoFlow, palette },
    {
      onRecorded: (blob, ext) => {
        if (!blob) {
          flash('Nothing was recorded — keep this tab open while recording');
          return;
        }
        if (compact) {
          setCapture({ blob, kind: 'video', ext });
          return;
        }
        downloadBlob(blob, stampedName(ext));
        flash('Video saved');
      },
      onGraphicsReset: () => flash('The graphics restarted, so the canvas was cleared'),
    },
  );

  const paused = (sheet !== 'none' || capture !== null) && !recording;
  useEffect(() => { simRef.current?.setPaused(paused); }, [paused, simRef]);

  useEffect(() => {
    document.documentElement.dataset.layout = compact ? 'compact' : 'wide';
    if (compact) return;
    setPanel(p => (p === 'inks' ? 'none' : p));
    setSheet(s => (s === 'menu' ? 'none' : s));
  }, [compact]);

  useEffect(() => {
    if (!hintGone || !matchMedia('(pointer: coarse) and (orientation: portrait)').matches) return;
    const timer = setTimeout(() => {
      if (firstTime('tip-rotate')) flash('Turn your phone sideways for a wider canvas');
    }, 1500);
    return () => clearTimeout(timer);
  }, [hintGone, flash]);

  const saveImage = async () => {
    const sim = simRef.current;
    if (!sim) return;
    try {
      downloadBlob(await sim.exportImage(), stampedName('png'));
      flash('Image saved');
    } catch {
      flash('Could not save the image');
    }
  };

  const takePhoto = async () => {
    const sim = simRef.current;
    if (!sim) return;
    setShutter(n => n + 1);
    navigator.vibrate?.(8);
    try {
      setCapture({ blob: await sim.exportImage(), kind: 'image', ext: 'png' });
    } catch {
      flash('Could not take the picture');
    }
  };

  const toggleRecord = () => {
    const sim = simRef.current;
    if (!sim) return;
    navigator.vibrate?.(8);
    if (recording) {
      sim.stopRecording();
      return;
    }
    try {
      sim.startRecording();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Recording is not supported here');
    }
  };

  const shareCapture = async () => {
    if (!capture) return;
    try {
      const file = new File([capture.blob], stampedName(capture.ext), { type: capture.blob.type });
      if (await shareFile(file)) setCapture(null);
    } catch {
      flash('Sharing didn’t work — try Save to device instead');
    }
  };

  const saveCapture = () => {
    if (!capture) return;
    downloadBlob(capture.blob, stampedName(capture.ext));
    setCapture(null);
    flash(capture.kind === 'video' ? 'Video saved' : 'Image saved');
  };

  const toggleUi = () => {
    setUiHidden(!uiHidden);
    setPanel('none');
    if (!uiHidden) flash('Controls hidden — press H to show them');
  };

  useHotkeys({
    drop: () => simRef.current?.dropRandom(),
    wash: () => simRef.current?.wash(),
    save: saveImage,
    undo: () => simRef.current?.undo(),
    toggleUi,
  });

  const choosePalette = (i: number) => {
    setPaletteIdx(i);
    setInkMode('cycle');
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

  const togglePanel = (p: Panel) => setPanel(current => (current === p ? 'none' : p));

  const openMenu = () => {
    setPanel('none');
    setSheet('menu');
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!recording) return;
    setRecordSecs(0);
    const start = Date.now();
    const id = setInterval(() => setRecordSecs(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(id);
  }, [recording]);

  const showUi = !uiHidden;

  return (
    <>
      <div className="stage" ref={stageRef} />

      {showUi && (compact ? (
        <h1 className="wordmark">
          <button aria-label="Suminagashi — about this site" onClick={() => setSheet('about')}>
            <span className="wordmark-ja" lang="ja">墨流し</span>
            <span className="wordmark-en">SUMINAGASHI</span>
          </button>
        </h1>
      ) : (
        <div className="title">
          <h1 aria-label="Suminagashi" lang="ja">墨流し</h1>
          <div className="sub">SUMINAGASHI — FLOATING INK</div>
        </div>
      ))}

      {webglError ? (
        <div className="notice" role="alert">
          <p>Your browser or device couldn't start the graphics this canvas needs (WebGL 2).</p>
          <p>Try an up-to-date Chrome, Safari, Edge or Firefox, or turn on hardware acceleration, and reload.</p>
        </div>
      ) : (
        <>
          {showUi && <div className={hintGone ? 'hint gone' : 'hint'}>TRACE THE SURFACE — LET THE INK FLOW</div>}

          {shutter > 0 && <div key={shutter} className="shutter" aria-hidden="true" />}

          {showUi && panel === 'tune' && (
            <TunePanel params={params} compact={compact} onChange={updateParam} onReset={resetParams} onClose={() => setPanel('none')} />
          )}

          {showUi && compact && panel === 'inks' && (
            <InkTray paletteIdx={paletteIdx} inkMode={inkMode} onPalette={choosePalette} onInk={setInkMode} onClose={() => setPanel('none')} />
          )}

          {showUi && compact && (
            <CaptureButtons canRecord={recordingSupported} recording={recording} seconds={recordSecs} onPhoto={takePhoto} onRecord={toggleRecord} />
          )}

          {showUi && !compact && recording && <RecordingPill seconds={recordSecs} onStop={toggleRecord} />}

          {showUi && (compact ? (
            <DockCompact
              palette={palette}
              inkMode={inkMode}
              tool={tool}
              inksOpen={panel === 'inks'}
              menuOpen={sheet === 'menu'}
              canUndo={canUndo}
              onTool={setTool}
              onInks={() => togglePanel('inks')}
              onUndo={() => simRef.current?.undo()}
              onMenu={openMenu}
            />
          ) : (
            <DockWide
              palette={palette}
              inkMode={inkMode}
              tool={tool}
              autoFlow={autoFlow}
              tuneOpen={panel === 'tune'}
              recording={recording}
              canRecord={recordingSupported}
              canUndo={canUndo}
              onPalette={() => choosePalette((paletteIdx + 1) % PALETTES.length)}
              onInk={setInkMode}
              onTool={setTool}
              onAuto={() => setAutoFlow(v => !v)}
              onTune={() => togglePanel('tune')}
              onWash={() => simRef.current?.wash()}
              onUndo={() => simRef.current?.undo()}
              onSave={saveImage}
              onRecord={toggleRecord}
              onAbout={() => setSheet('about')}
            />
          ))}

          <MenuSheet
            open={sheet === 'menu'}
            autoFlow={autoFlow}
            fullscreen={fullscreen}
            onClose={() => setSheet('none')}
            onToggleAuto={() => setAutoFlow(v => !v)}
            onTune={() => { setSheet('none'); setPanel('tune'); }}
            onWash={() => { setSheet('none'); simRef.current?.wash(); }}
            onToggleFullscreen={() => { setSheet('none'); fullscreen.toggle(); }}
            onAbout={() => setSheet('about')}
          />
          <AboutSheet open={sheet === 'about'} variant={compact ? 'bottom' : 'center'} onClose={() => setSheet('none')} />
          <CaptureSheet capture={capture} onShare={shareCapture} onSave={saveCapture} onDiscard={() => setCapture(null)} />
        </>
      )}

      <Toast message={toast} />
    </>
  );
}
