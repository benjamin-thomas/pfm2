# Personal Finance Manager (PFM2)

A personal finance manager demo, using double-entry bookkeeping.

**Note:** This is a focused TypeScript implementation. For a broader exploration of the same domain across multiple
languages (most interestingly Elm+Haskell, fullstack PureScript), see the [original exploration repo](https://github.com/benjamin-thomas/pfm).

The goal of this project is to demonstrate code organization patterns, by implementing a central slice of a typical
finance manager app

[🔗 Live Demo](https://pfm2.onrender.com/)

## In action

[https://github.com/user-attachments/assets/7c95d7d7-dc7b-41a8-b19d-d8f508b5b3b6](https://github.com/user-attachments/assets/7413eea6-860e-43c9-9a58-504376da417a)

---

## What This Demonstrates

**Architecture & Patterns:**
- Manual dependency injection
  - Swappable implementations for testing
- Repository pattern
- Command-Query Separation (CQS)
- Elm-style decoders to validate incoming data
- Type-safe error handling without exceptions

**Fullstack TypeScript:**
- React frontend with hooks
- Express REST API
- SQLite database integration
- End-to-end type safety, see the "shared" directory

**Testing & Quality:**
- Integration testing without mocks
- Test coverage tracking
- Strict TypeScript configuration

## Technical overview

- **Type-Safe Error Handling**: `Result<E, T>` and `Maybe<T>` instead of exceptions and nulls
- **Simulated ADTs and Pattern Matching**: Using discriminated unions to simulate algebraic data types with exhaustive pattern matching
- **Onion Architecture**: Dependency injection makes all layers testable without mocking
- **Double-Entry Bookkeeping**: A way to view "money flow" from "any angle".

**Tech Stack**: TypeScript • React • Node.js • Express • Vitest • SQLite

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
  // Oh, I cannot delete an account if it's a "system account" OR if it's linked to existing transactions: now I know!
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
- **SQL**: Real SQLite database

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

### About CQS

CQS is the layer where business rules naturally live, and are enforced.

This is why I'm using Elm-style decoders (rather than a lib like Zod) to validate incoming data:
  - decoding is an HTTP concern
  - validating the decoded data is a business rule concern that lives in CQS

Also, separating reads from writes makes for cleaner code organization at the expense of incidental duplication.

From the backend's perspective, the shape of incoming data (for writes) may not necessarily match the shape of the output
data (for reads).

- Writes: shouldn't contain ID, createdAt, updatedAt columns
- Reads: may contain aggregated/joined data, etc.

**Command Return Types:**
- `create` / `createMany` → return the created resource(s) (useful for getting generated IDs)
- `update` / `delete` / `deleteAll` → return `AffectedRows` (count of modified rows)

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
