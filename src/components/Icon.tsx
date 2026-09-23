import type { ReactNode, SVGProps } from 'react';

const WAVE = 'c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5';

const SHAPES = {
  brush: (
    <>
      <path d="M19.2 4.8 13 11" />
      <path d="M13.6 10.4c1.2 1.2 1.1 3.1-.3 4.4-2 1.9-4.7 3.2-8.3 4 .8-3.6 2.1-6.3 4-8.3 1.3-1.4 3.2-1.5 4.6-.1z" fill="currentColor" stroke="none" />
    </>
  ),
  rings: (
    <>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="5.6" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  comb: <path d="M4 5.5h16M6 5.5V18M10 5.5V18M14 5.5V18M18 5.5V18" />,
  undo: (
    <>
      <path d="M9 14.5 4 9.5l5-5" />
      <path d="M4 9.5h10.5a5.25 5.25 0 0 1 0 10.5H11" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  save: <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14" />,
  share: (
    <>
      <path d="M12 3.5v11M8 7.5l4-4 4 4" />
      <path d="M8.5 10.5H7a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1.5" />
    </>
  ),
  record: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </>
  ),
  stop: <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />,
  drop: (
    <>
      <path d="M12 3.5c3.2 3.8 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.3-6.2 5.5-10z" />
      <path d="M9.4 14a2.7 2.7 0 0 0 2.3 2.6" />
    </>
  ),
  tune: (
    <>
      <path d="M4 7h8m4 0h4M4 12h3m4 0h9M4 17h10m4 0h2" />
      <circle cx="14" cy="7" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="16" cy="17" r="2" />
    </>
  ),
  wash: <path d={`M3 9.5${WAVE}M3 15.5${WAVE}`} />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.75" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  close: <path d="m6.5 6.5 11 11m0-11-11 11" />,
  chevron: <path d="m9.5 6 6 6-6 6" />,
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="12.8" r="3.3" />
    </>
  ),
  fullscreen: <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9m6 0h3.5A1.5 1.5 0 0 1 20 5.5V9m0 6v3.5a1.5 1.5 0 0 1-1.5 1.5H15m-6 0H5.5A1.5 1.5 0 0 1 4 18.5V15" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof SHAPES;

export default function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}
    >
      {SHAPES[name]}
    </svg>
  );
}
