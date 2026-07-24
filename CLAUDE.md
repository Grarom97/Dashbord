## Stack conventions
- Next.js 14+ App Router only — no Pages Router
- Tailwind v4 with CSS variables for theming — no inline style overrides
- shadcn/ui components — never write custom UI primitives from scratch
- TypeScript strict mode throughout

## Tailwind v4 + shadcn specifics
- Dark mode via .dark class on html element, not media query
- CSS variables defined in globals.css under @layer base
- Never use hardcoded hex colors in className — always use CSS variable tokens
- shadcn components imported from @/components/ui/

## Code behavior rules
- Never delete existing working code to fix a bug — add, don't replace
- If unsure about a file's purpose — read it fully before editing
- After every change — verify the file compiles before moving on
- Never assume an import exists — check package.json first
- Prefer small targeted edits over full file rewrites

## Context management
- Read only files you need to edit
- After completing each feature — write one sentence summary of what was built
