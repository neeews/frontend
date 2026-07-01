# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

No test framework is configured.

## Stack

- **React 19** + **Vite 8**, plain JavaScript (no TypeScript)
- ESLint configured for browser globals, JSX, react-hooks, and react-refresh rules
- Entry: `src/main.jsx` → `src/App.jsx`
- Static assets served from `public/` (e.g. `icons.svg` referenced via `<use href="/icons.svg#...">` in JSX)

## Notes

- The project uses ES modules (`"type": "module"` in package.json); avoid CommonJS patterns.
- To add TypeScript, the README references the `template-react-ts` Vite template and `typescript-eslint`.
- The React Compiler is intentionally not enabled due to dev/build performance impact.

## Response

- 모든 응답은 한국어로 한다.