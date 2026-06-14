import { useEffect, useRef, useState, type RefObject } from 'react';
import { FluidSim } from './engine/FluidSim';
import type { InkMode, Palette, Tool } from './engine/config';

interface FluidSimInputs {
  tool: Tool;
  inkMode: InkMode;
  autoFlow: boolean;
  palette: Palette;
}

// Owns the FluidSim instance: creation, disposal, the one-shot intro hint, and
// keeping the engine in sync with the reactive controls. Returns the sim ref
// for imperative actions (wash, save, record, publish) plus lifecycle state.
export function useFluidSim(stageRef: RefObject<HTMLDivElement>, { tool, inkMode, autoFlow, palette }: FluidSimInputs) {
  const simRef = useRef<FluidSim | null>(null);
  const [webglError, setWebglError] = useState(false);
  const [hintGone, setHintGone] = useState(false);

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
  }, [stageRef]);

  useEffect(() => { simRef.current?.setTool(tool); }, [tool]);
  useEffect(() => { simRef.current?.setInkMode(inkMode); }, [inkMode]);
  useEffect(() => { simRef.current?.setAutoFlow(autoFlow); }, [autoFlow]);
  useEffect(() => { simRef.current?.setPalette(palette.colors.map(c => c.hex)); }, [palette]);

  return { simRef, webglError, hintGone };
}
