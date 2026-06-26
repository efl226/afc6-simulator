// Inline SVG glyphs for the panel. Each uses currentColor so CSS controls
// lit / dim / disabled states. Stroke geometry matches the Figma frame 415:6576.
export const Ic = {
  power: (
    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13.5" r="8" stroke="currentColor" strokeWidth="2" /><rect x="11" y="3" width="2" height="9.2" rx="1" fill="currentColor" /></svg>
  ),
  volume: (
    <svg viewBox="0 0 24 24" fill="none"><path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M16 9 Q19 12 16 15" stroke="currentColor" strokeWidth="1.7" /></svg>
  ),
  dual: (
    <svg viewBox="0 0 34 28" fill="none"><path d="M6 8 V19 Q6 23 10 23 H24 Q28 23 28 19 V8" stroke="currentColor" strokeWidth="2" /><path d="M6 8 L3 5 M28 8 L31 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><rect x="9" y="4" width="16" height="3" rx="1.5" fill="currentColor" /><rect x="10.5" y="17" width="13" height="2.4" rx="1.2" fill="currentColor" /></svg>
  ),
  last: (
    <svg viewBox="0 0 24 24" fill="none"><path d="M19 12.5 A7 7 0 1 1 12 5.5 H16.5" stroke="currentColor" strokeWidth="2" /><path d="M13.5 2.5 L16.8 5.5 L13.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  fav: (
    <svg viewBox="0 0 24 24" fill="none"><path d="M12 3 L14.6 9.1 L21 9.6 L16.1 13.9 L17.7 20.3 L12 16.8 L6.3 20.3 L7.9 13.9 L3 9.6 L9.4 9.1 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
  ),
  pause: (
    <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.6" /><rect x="12" y="10.5" width="3" height="11" rx="1.2" fill="currentColor" /><rect x="17" y="10.5" width="3" height="11" rx="1.2" fill="currentColor" /></svg>
  ),
  light: (
    <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.6" /><path d="M16 8.5 a5 5 0 0 1 3 9 v1.6 h-6 v-1.6 a5 5 0 0 1 3 -9 Z" stroke="currentColor" strokeWidth="1.5" /><path d="M13.6 21.5 h4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
  ),
  up: (
    <svg viewBox="0 0 24 15" fill="none"><path d="M3 12 L12 3.5 L21 12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  down: (
    <svg viewBox="0 0 24 15" fill="none"><path d="M3 3.5 L12 12 L21 3.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
};
