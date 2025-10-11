// Decode wrapper - abstracts validation library (currently Zod, easy to swap for tiny-decoders)
import { z } from 'zod';
import { Result, type Result as ResultType } from './result';

export type DecodeError = {
  tag: 'DecodeError';
  fields: Array<{ path: string; message: string }>;
};

/**
 * Decode unknown data using a Zod schema
 * Returns Result type instead of throwing
 *
 * This wrapper allows easy migration to tiny-decoders or other libraries later
 */
export const decode = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ResultType<T, DecodeError> => {
  const result = schema.safeParse(data);

  if (!result.success) {
    return Result.err({
      tag: 'DecodeError',
      fields: result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  return Result.ok(result.data);
};
