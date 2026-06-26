# AFC-6 Console — Panel Simulator

An interactive prototype of the AFC-6 dual-heat air fryer control panel, paired
with a **live state-flow visualizer**. The panel behaves like the real
appliance (driven by a state machine); the right rail shows the machine state,
the flow diagram following the current state, and the events available at each
step.

Built with **React + Vite**. Demo cook times are shortened (seconds, not
minutes) so a full cycle runs in ~30s.

## Project context (for collaborators & AI agents)

**What this is.** A proof-of-concept built on the Advanced Concept Design team
at Cuisinart. The author is a software-engineering intern scoping a tool with
**lasting impact** — something the whole design team can keep using after the
internship ends. This simulator is the first concrete build toward that.

**The problem it addresses.** When the team designs an appliance control panel,
the only ways to "feel" how it behaves before hardware exists are (a) static
mockups, (b) paper cutouts mounted on the 3D product model — which are mute and
can't react — or (c) buying into tools like ProtoPie / Maze. None give the team
a reactive prototype *and* their own data. Intuition for how a panel actually
behaves comes from **interacting** with it, not reading a spec or a diagram.

**The idea / the moat.** A reactive, touch-instrumented prototype of a control
panel that runs in any browser (eventually on a tablet for focus-group tests).
The long-term differentiator is **owned, tailored touch analytics** — tap
heatmaps, event sequences, time-to-task, error/rage taps, hesitation — captured
for near-zero cost, instead of renting a generic usability tool. The genuine
white space vs. off-the-shelf products is: free owned analytics, appliance-
specific legibility/ergonomics checks, a path to the print/manufacturing
pipeline, and glue tailored to the team's Figma/Illustrator workflow.

**Where this repo fits.** This is the *simulator* half — the reactive prototype
proving the concept works and feels right. It models the **AFC-6 dual-heat air
fryer** panel. The same state machine that drives the UI is also intended to
double as the engineering spec / state diagram (one source of truth for design
*and* engineering). Natural next steps an agent might help with:

1. An **analytics layer** — instrument taps/events, store sessions, visualize.
2. **Fidelity passes** on the panel art and control positions vs. Figma frame
   `415:6576`.
3. **Deploy** to a static host so it's a shareable link for testing sessions.
4. Generalizing beyond AFC-6 so other appliances/panels can be defined as data.

**Design intent.** Aesthetic direction is a *refined industrial instrument
console*: the true-black appliance panel as the hero on a warm paper "studio,"
distinctive type (Bricolage Grotesque + JetBrains Mono), an authentic 7-segment
display (DSEG7), and an orange product accent used sparingly. Keep changes
cohesive with that direction — avoid generic/defaulty UI.

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
