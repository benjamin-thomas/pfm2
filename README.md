# Personal Finance Manager

A TypeScript-based personal finance manager using double-entry bookkeeping.

## Development

```sh
VITE_API=fake npm run dev
```

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
