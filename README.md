# Smart Escape

An interactive, frontend-only evacuation route simulator for the AI DevFest practice challenge.

## Identity and deployment

- Full name: Add your full name before submission.
- Registration number: Add your registration number before submission.
- Live website: Add the public HTTPS deployment URL before submission.
- Repository: Publish this source as the required `devfest-<registration-number>` repository.

## Run locally

Requirements: Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Create a production build with `npm run build`; preview it with `npm run preview`.

## Implemented features

- Import and validate local `building.json` files against the challenge schema and limits.
- Display supplied coordinates, readable node labels, corridor costs, node types, and hazard states.
- Calculate minimum-cost routes using corridor weights, excluding blocked nodes, blocked corridors, and closed exits.
- Resolve equal-cost routes by case-sensitive lexical exit ID, then lexical full node-ID sequence.
- Select a starting room or junction, toggle location/corridor/exit hazards, and reset to the imported initial state.
- Recalculate route results immediately, including blocked-start and no-route states.
- English and Bangla interface modes, keyboard-operable graph controls, reduced-motion support, and responsive layout.
- Brief route and state transitions; no external routing API, backend, or persistent remote storage.

## Sample checks

With the included `public/building.json`:

- Start at R1: `R1 → C1 → C2 → E1`, cost 7.
- Block C2: `R1 → C1 → C3 → C4 → E2`, cost 11.
- Start at R2: `R2 → C3 → C4 → E2`, cost 7.
- Close both exits: no route available.
- Block the selected start: starting location blocked.

## Screenshots

Add screenshots showing the baseline R1 route and the R1 reroute after C2 is blocked to `screenshots/` before submission.

## Known issues

- No screenshots or public deployment URL are included; add these when preparing a competition submission.
- The interface simulates manually entered hazards only. It does not detect fires, predict hazard spread, or certify a real evacuation plan.

## AI tools

- AI tool: GitHub Copilot.
- Most useful prompt: “Build a frontend-only evacuation route simulator from this problem statement. Validate uploaded graph JSON, calculate deterministic lowest-cost routes from corridor weights, and recalculate immediately when hazards change.”

## Safety

Smart Escape is an educational simulation, not a certified real-world evacuation planning tool. Follow official emergency instructions and approved building plans.