import { useEffect, useRef, useState, type RefObject } from 'react';
import { FluidSim } from './engine/FluidSim';
import type { InkMode, Palette, Tool } from './engine/config';

interface FluidSimInputs {
  tool: Tool;
  inkMode: InkMode;
  autoFlow: boolean;
  palette: Palette;
}

export function useFluidSim(stageRef: RefObject<HTMLDivElement>, { tool, inkMode, autoFlow, palette }: FluidSimInputs) {
  const simRef = useRef<FluidSim | null>(null);
  const [webglError, setWebglError] = useState(false);
  const [hintGone, setHintGone] = useState(false);
  const [recordingSupported, setRecordingSupported] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

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
    setRecordingSupported(sim.recordingSupported);
    simRef.current = sim;
    const timer = setTimeout(() => setHintGone(true), 9000);
    return () => {
      clearTimeout(timer);
      sim.dispose();
      simRef.current = null;
    };
  }, [stageRef]);

  useEffect(() => { simRef.current?.setTool(tool); }, [tool]);
  useEffect(() => { simRef.current?.setInkMode(inkMode); }, [inkMode]);
  useEffect(() => { simRef.current?.setAutoFlow(autoFlow); }, [autoFlow]);
  useEffect(() => { simRef.current?.setPalette(palette.colors.map(c => c.hex)); }, [palette]);

  return { simRef, webglError, hintGone, recordingSupported, canUndo };
}
