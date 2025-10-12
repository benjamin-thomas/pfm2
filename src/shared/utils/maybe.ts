// Maybe type - follows Elm's Maybe API
// Either Nothing or Just<A>

export type Maybe<A> =
  | { tag: 'Nothing' }
  | { tag: 'Just'; value: A };

const just = <A>(value: A): Maybe<A> => ({ tag: 'Just', value });

const nothing: Maybe<never> = { tag: 'Nothing' };

// Match/fold over Maybe - eliminates need for fragile if checks
// Usage: Maybe.match(maybe, onNothing, onJust)
// Nothing handler first, Just handler second
const match = <A, B>(
  maybe: Maybe<A>,
  onNothing: () => B,
  onJust: (value: A) => B
): B => {
  switch (maybe.tag) {
    case 'Nothing':
      return onNothing();
    case 'Just':
      return onJust(maybe.value);
    default: {
      const exhaustive: never = maybe;
      throw new Error(`Impossible: ${exhaustive}`);
    }
  }
};

export const Maybe = { just, nothing, match } as const;
