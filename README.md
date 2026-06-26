# AFC-6 Console — Panel Simulator

An interactive prototype of the AFC-6 dual-heat air fryer control panel, paired
with a **live state-flow visualizer**. The panel behaves like the real
appliance (driven by a state machine); the right rail shows the machine state,
the flow diagram following the current state, and the events available at each
step.

Built with **React + Vite**. Demo cook times are shortened (seconds, not
minutes) so a full cycle runs in ~30s.

## Run it locally

```bash
npm install        # first time only
npm run dev        # start dev server with hot reload → http://localhost:5173
```

## Share it as a web link

The app builds to plain static files — no backend needed. Anyone can use it in a
browser.

```bash
npm run build      # outputs the dist/ folder
npm run preview    # preview the production build locally
```

Then host `dist/` anywhere static:

- **Vercel / Netlify / Cloudflare Pages** — connect the repo (or drag the
  `dist/` folder), they build and give you a URL. Updates redeploy on push.
- **GitHub Pages** — serve the built `dist/` from a repo.

`vite.config.js` sets `base: './'` so the build works on any host path.

## Layout

- **Left** — the live panel (exact Figma backdrop + icons), a status line, and
  a terminal streaming every event.
- **Right** — State Flow (active node glows, fired transition flashes), Machine
  State (live context), Available Now (valid events).

## Controls

- Click presets and icons directly.
- Keyboard: **B** = basket in/out · **A** = +30s.
- **Hold** power = turn off · **Hold** favorite = save current settings.

## Project structure

```
src/
  main.jsx              entry point
  App.jsx               wiring + timers (tick / auto-off / keep-warm)
  machine.js            pure state machine: constants, transition(), reducer()
  icons.jsx             inline SVG panel glyphs
  styles.css            all styling + fonts (Bricolage Grotesque, JetBrains Mono, DSEG7)
  components/
    Panel.jsx           the appliance face
    Terminal.jsx        live event log
    Flow.jsx            state-flow diagram
    Telemetry.jsx       machine state + available events
```

`afc6_simulator.html` (single-file CDN version) and `afc6flow.ts` are kept
alongside as reference / quick-preview artifacts; the Vite app in `src/` is the
source of truth.
