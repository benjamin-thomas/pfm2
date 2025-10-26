# Personal Finance Manager (PFM2)

A personal finance manager using double-entry bookkeeping, built with TypeScript and functional programming patterns.

[🔗 Live Demo](#) (TODO)

## In action

https://github.com/user-attachments/assets/7c95d7d7-dc7b-41a8-b19d-d8f508b5b3b6

---

## Overview

- **Type-Safe Error Handling**: `Result<E, T>` and `Maybe<T>` instead of exceptions and nulls
- **Simulated ADTs and Pattern Matching**: Using discriminated unions to simulate algebraic data types with exhaustive pattern matching
- **Onion Architecture**: Dependency injection makes all layers testable without mocking
- **Double-Entry Bookkeeping**: A way to view "money flow" from "any angle".

**Tech Stack**: TypeScript • React • Node.js • Express • Vitest • SQLite (planned)

---

## Quick Start

```bash
# Install dependencies
npm install

# Run in development (uses in-memory fake API)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:ui
```

The app will be available at:
- Frontend: http://localhost:5176
- Backend API: http://localhost:8086

Or just start the frontend and load the in-memory data: http://localhost:5176/?api=fake

---

## A Closer Look

### Result for error handling

Being strict about modeling types via the type system clearly communicates possible failures. We use `Result<E, A>` and `Maybe<A>` for domain errors - operations that can fail as part of normal business logic (mostly).

```typescript
// Exceptions workflow ❌
async function deleteAccount(id: number): Promise<void> {
  // Is the possible error case being handled correctly? Not sure!
}

// Result workflow ✅
async function deleteAccount(id: number): Promise<Result<DeleteError, AffectedRows>> {
  // Caller MUST handle both success and error cases
}
```

This approach also makes unexpected `null`/`undefined` values bubbling up much less likely, since we use `Maybe<T>` to represent optional values explicitly.

Exceptions may stay useful for isolated cases, but they're not the norm.

### Swappable implementations

The frontend uses an API client interface with two implementations:
- **Fake**: In-memory data, no network calls
- **HTTP**: Real backend via fetch

The backend uses a Repository interface with two implementations:
- **Fake**: In-memory data store
- **SQL**: Real database (planned)

```typescript
// Frontend: Can swap API client implementations
const api = useFakeAPI ? ApiFake.init() : ApiHttp.init();

// Backend: Can swap repository implementations
const repo = useFakeRepo ? AccountRepoFake.init() : AccountRepoSQL.init();
```

This separation forces us to decouple the software. As a by-product, we get faster tests and can test at different integration levels without mocking.

### Ledger-based accounting

Money always "comes from somewhere" and "goes to somewhere". There are no truly negative values - just different perspectives on the same transaction.

Try clicking different account balance cards in the UI - each view of the same transactions tells a different story.

---

## Testing

How to run the tests:

```bash
npm test
npm run test:watch
npm run test:watch -- --coverage
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

---

### Git Hooks

Auto-format and lint before commits:

```bash
./manage/install-git-hooks.sh
```
