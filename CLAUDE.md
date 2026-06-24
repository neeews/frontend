# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

No test framework is configured.

## Stack

- **React 19** + **Vite 8**, plain JavaScript (no TypeScript)
- ESLint configured for browser globals, JSX, react-hooks, and react-refresh rules
- Entry: `src/main.jsx` → `src/App.jsx`
- Static assets served from `public/` (e.g. `icons.svg` referenced via `<use href="/icons.svg#...">` in JSX)

## Git

- 커밋은 기능 단위로 한다. 여러 파일을 수정했더라도 하나의 기능에 해당하면 하나의 커밋으로 묶는다.
- 파일 단위 자동 커밋(auto-commit hook)은 작업 중 임시 저장용이며, 작업 완료 후에는 기능 단위로 정리해서 커밋한다.

## Notes

- The project uses ES modules (`"type": "module"` in package.json); avoid CommonJS patterns.
- To add TypeScript, the README references the `template-react-ts` Vite template and `typescript-eslint`.
- The React Compiler is intentionally not enabled due to dev/build performance impact.
