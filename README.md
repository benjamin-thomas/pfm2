# Personal Finance Manager

A TypeScript-based personal finance manager using double-entry bookkeeping.

## Development

```sh
VITE_API=fake npm run dev
```

### Git Hooks

Install git hooks to automatically format and lint code before commits:

```sh
./manage/install-git-hooks.sh
```

This will set up a pre-commit hook that runs:
- `npm run format` - Format all files with Biome
- `npm run lint` - Lint all files with Biome

To bypass the hook (not recommended):
```sh
git commit --no-verify
```

### Test coverage workflow

A good option to interactively improve coverage is to use WebStorm:

- right-click on project root
  - left-click on  `More Run/Debug`
    - left-click on `Run 'All Tests' with Coverage`
    - refresh gutters by re-running the action of the same name (via Ctrl+Shift+A, not via Shift+F10)
- open `vitest.config.ts` file
  - left-click on the play icon for the `test` key
    - click on `Run 'All Tests' with Coverage`
    - refresh gutters by re-running the action of the same name (via Ctrl+Shift+A, not via Shift+F10)

Otherwise, just run `npm run test:watch -- --coverage --coverage.cleanOnRerun=false` and observe the HTML output via `live-server ./coverage/`.

Note: `--coverage.cleanOnRerun=false` prevents Vitest from deleting the coverage directory on each run, which keeps live-server connected. This is only useful for the live-server workflow; the default `true` ensures accurate coverage by removing stale files.

A third option could be using vitest's "UI" via `npm run test:ui`, but it seems to be a little buggy currently (looses coverage data), is not friendly to hard refreshes, etc.

## Architecture

### Type-Safe Error Handling

- **Option<T>** - Replaces null/undefined. Use `Option.match()` to handle.
- **Result<E, T>** - Represents operations that can fail. Use `Result.match()` to handle.

### CQS (Command Query Separation)

**Queries** (reads) - `src/server/cqs/{domain}/queries.ts`
- Return `Promise<T>` or `Promise<Option<T>>`
- Never modify state

**Commands** (writes) - `src/server/cqs/{domain}/commands.ts`
- Return `Promise<T>` for simple CRUD
- Return `Promise<Result<E, T>>` when business rules can fail

### Repository Pattern

Data access abstracted behind interfaces with multiple implementations (fake/SQL).

### Layers

```
HTTP/CLI → CQS Handlers → Repository
```

- **HTTP** - Validates with Zod, converts Option/Result to responses
- **CQS** - Business logic (thin pass-through until rules emerge)
- **Repository** - Returns Option for optional data, AffectedRows for updates

### Key Patterns

- No null/undefined - use Option
- Pass Options through layers, match at boundaries
- Optional params: `Option<T>` not `T | undefined`
- `affectedRows=0` is data feedback, not an error
