# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

No test framework is configured.

## Stack

- **React 19** + **Vite 8**, plain JavaScript (no TypeScript)
- ESLint configured for browser globals, JSX, react-hooks, and react-refresh rules
- Entry: `src/main.jsx` → `src/App.jsx`
- Static assets served from `public/` (e.g. `icons.svg` referenced via `<use href="/icons.svg#...">` in JSX)

## 오류 기록 규칙

작업 중 오류가 발생하고 해결한 경우, **반드시** Notion "⚠️ 생긴 오류" 페이지(ID: `38a7aff1-25c3-80b8-8860-cdffe4a14448`) 안에 **오류 하나당 하위 페이지 하나**를 `notion-create-pages`로 생성한다.

## Notes

- The project uses ES modules (`"type": "module"` in package.json); avoid CommonJS patterns.
- To add TypeScript, the README references the `template-react-ts` Vite template and `typescript-eslint`.
- The React Compiler is intentionally not enabled due to dev/build performance impact.

## Response

- 모든 응답은 한국어로 한다.
- 절대 push를 하지 않는다