import { useEffect, useRef, useState, type RefObject } from 'react';
import { FluidSim, type VideoExt } from './engine/FluidSim';
import type { InkMode, Palette, Tool } from './engine/config';

interface FluidSimInputs {
  tool: Tool;
  inkMode: InkMode;
  autoFlow: boolean;
  palette: Palette;
}

interface FluidSimEvents {
  onRecorded: (video: Blob | null, ext: VideoExt) => void;
  onGraphicsReset: () => void;
}

export function useFluidSim(
  stageRef: RefObject<HTMLDivElement>,
  { tool, inkMode, autoFlow, palette }: FluidSimInputs,
  events: FluidSimEvents,
) {
  const simRef = useRef<FluidSim | null>(null);
  const eventsRef = useRef(events);
  const [webglError, setWebglError] = useState(false);
  const [hintGone, setHintGone] = useState(false);
  const [recordingSupported, setRecordingSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => { eventsRef.current = events; });

  useEffect(() => {
    let sim: FluidSim;
    try {
      sim = new FluidSim(stageRef.current!);
    } catch {
      setWebglError(true);
      return;
    }
    sim.onInteract = () => setHintGone(true);
    sim.onUndoAvailable = setCanUndo;
    sim.onRecordingChange = setRecording;
    sim.onRecorded = (video, ext) => eventsRef.current.onRecorded(video, ext);
    sim.onGraphicsReset = () => eventsRef.current.onGraphicsReset();
    setRecordingSupported(sim.recordingSupported);
    simRef.current = sim;
    const timer = setTimeout(() => setHintGone(true), 9000);
    return () => {
      clearTimeout(timer);
      sim.dispose();
      simRef.current = null;
      setRecording(false);
    };
  }, [stageRef]);

  useEffect(() => { simRef.current?.setTool(tool); }, [tool]);
  useEffect(() => { simRef.current?.setInkMode(inkMode); }, [inkMode]);
  useEffect(() => { simRef.current?.setAutoFlow(autoFlow); }, [autoFlow]);
  useEffect(() => { simRef.current?.setPalette(palette.colors.map(c => c.hex)); }, [palette]);

  return { simRef, webglError, hintGone, recordingSupported, recording, canUndo };
}
