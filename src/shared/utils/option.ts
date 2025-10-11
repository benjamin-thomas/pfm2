// Option type - Either None or Some<A>

export type Option<A> =
  | { tag: 'none' }
  | { tag: 'some'; value: A };

const some = <A>(value: A): Option<A> => ({ tag: 'some', value });

const none: Option<never> = { tag: 'none' };

// Match/fold over Option - eliminates need for fragile if checks
// Usage: Option.match(option, onNone, onSome)
// None handler first, Some handler second
const match = <A, R>(
  option: Option<A>,
  onNone: () => R,
  onSome: (value: A) => R
): R => {
  switch (option.tag) {
    case 'none':
      return onNone();
    case 'some':
      return onSome(option.value);
    default: {
      const _exhaustive: never = option;
      throw new Error(`Unhandled Option tag: ${_exhaustive}`);
    }
  }
};

export const Option = { some, none, match } as const;
