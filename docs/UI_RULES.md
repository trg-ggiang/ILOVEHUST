# UI Rules

The frontend is a Vite React app with centralized CSS in `frontend/src/styles.css`.

## Architecture

- Route definitions live in `frontend/src/App.tsx`.
- Page components live under `frontend/src/pages/`.
- Shared layout/components live under `frontend/src/components/`.
- API calls should use `frontend/src/api.ts`.
- Realtime hooks should use `frontend/src/realtime/`.
- Translatable strings are supported through `frontend/src/i18n/`.

## Styling Conventions

- Keep styles in `frontend/src/styles.css` unless there is a clear reason to split files.
- Group page-specific styles together and prefix class names by page or feature.
- Preserve the existing student layout structure: `student-layout`, `student-main`, shared panels, cards, and taskbar/header components.
- Use existing font stack based on Noto Sans and Noto Sans JP.
- Keep `letter-spacing: 0` for new UI; do not use viewport-scaled font sizes.
- Prefer lucide-react icons for recognizable actions.
- Keep charts in Recharts when extending analytics/statistics UI.
- Avoid nested cards and decorative blobs/orbs. Use restrained panels, tables, grids, and controls.

## Interaction Rules

- Preserve auth token behavior in `localStorage.token` unless a task is explicitly about auth storage.
- Keep protected flows consistent with backend response contracts.
- Use real controls for interaction: buttons for commands, inputs/selects for form values, toggles/checkboxes for binary settings.
- Make loading, empty, error, and success states explicit for user-facing async flows.
- Do not add visible instructional copy that explains obvious UI mechanics.
- Check mobile widths when touching layout; the app should remain usable from 320px wide.

## Visual QA

For frontend changes, run:

```bash
cd frontend
npm run lint
npm run build
```

For meaningful UI edits, open the app locally and smoke-test the changed route at desktop and mobile widths. Verify text does not overlap controls, panels do not overflow horizontally, and dynamic data cannot resize fixed controls unexpectedly.

