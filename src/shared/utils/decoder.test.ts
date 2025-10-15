import { type DecoderResult, number } from 'tiny-decoders';
import { assert, describe, it } from 'vitest';
import { Decoder } from './decoder';

describe('Decoder', () => {
  describe('match', () => {

    it('calls onError for DecoderError', () => {
      const decoded: DecoderResult<number> = number.decoder('WAT');
      const output = Decoder.match<number, unknown>(
        decoded,
        (err) => ({ x: err }),
        (val) => ({ v: val })
      );
      assert.deepStrictEqual(
        output,
        {
          "x": {
            "got": "WAT",
            "path": [],
            "tag": "number",
          },
        }

      );
    });

    it('calls onValid for Valid', () => {
      const decoded = number.decoder(42);
      const output = Decoder.match<number, unknown>(
        decoded,
        (err) => ({ x: err }),
        (val) => ({ v: val })
      );
      assert.deepStrictEqual(output, { v: 42 });
    });


  });

  describe('toResult', () => {
    it('converts Valid to Ok', () => {
      const decoded = number.decoder(42);
      const result = Decoder.toResult(decoded, (err) => ({ origErr: err, extra: 99 }));
      assert.deepStrictEqual(result, { tag: 'Ok', value: 42 });
    });

    it('converts DecoderError to Err with transformed error', () => {
      const decoded = number.decoder('WAT');
      const result = Decoder.toResult(decoded, (err) => ({ origErr: err, extra: 99 }));
      assert.deepStrictEqual(result,
        {
          tag: 'Err',
          error: {
            origErr: { got: 'WAT', path: [], tag: 'number' },
            extra: 99
          }
        });
    });
  });
});