import type { DecoderError, DecoderResult } from 'tiny-decoders';

/**
 * Pattern matching for decoder results
 * Similar to Maybe.match and Result.match
 */
const match = <A, B>(
  result: DecoderResult<A>,
  onError: (error: DecoderError) => B,
  onValid: (value: A) => B
): B => {
  switch (result.tag) {
    case 'DecoderError':
      return onError(result.error);
    case 'Valid':
      return onValid(result.value);
  }
};

export const Decoder = { match } as const;
