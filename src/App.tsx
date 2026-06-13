import { useEffect, useRef, useState } from 'react';
import { FluidSim } from './engine/FluidSim';
import type { InkMode, Tool } from './engine/config';
import Dock from './components/Dock';

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<FluidSim | null>(null);
  const [inkMode, setInkMode] = useState<InkMode>('cycle');
  const [tool, setTool] = useState<Tool>('brush');
  const [autoFlow, setAutoFlow] = useState(true);
  const [hintGone, setHintGone] = useState(false);

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

  useEffect(() => { simRef.current?.setInkMode(inkMode); }, [inkMode]);
  useEffect(() => { simRef.current?.setTool(tool); }, [tool]);
  useEffect(() => { simRef.current?.setAutoFlow(autoFlow); }, [autoFlow]);

  return (
    <>
      <div className="stage" ref={stageRef} />

      <div className="title">
        <h1>墨流し</h1>
        <div className="sub">SUMINAGASHI — INK DISSOLUTION</div>
      </div>

      <div className={hintGone ? 'hint gone' : 'hint'}>TRACE THE SURFACE — LET THE INK FLOW</div>

      <Dock
        inkMode={inkMode}
        tool={tool}
        autoFlow={autoFlow}
        onInk={setInkMode}
        onTool={setTool}
        onAuto={() => setAutoFlow(v => !v)}
        onWash={() => simRef.current?.wash()}
      />
    </>
  );
}
