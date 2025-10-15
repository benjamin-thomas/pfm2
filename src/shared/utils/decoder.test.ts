import { Decoder } from 'elm-decoders';
import { assert, describe, it } from 'vitest';
import { DecoderUtil } from './decoder';

describe('DecoderUtil', () => {
  describe('match', () => {

    it('calls onError for DecoderError', () => {
      const decoded = Decoder.number.run('WAT');
      const output = DecoderUtil.match<number, unknown>(
        decoded,
        (err) => ({ x: err }),
        (val) => ({ v: val })
      );
      assert.deepStrictEqual(
        output,
        {
          "x": {
            "error": "Not a number",
            "value": "WAT",
          },
        }
      );
    });

    it('calls onValid for Valid', () => {
      const decoded = Decoder.number.run(42);
      const output = DecoderUtil.match<number, unknown>(
        decoded,
        (err) => ({ x: err }),
        (val) => ({ v: val })
      );
      assert.deepStrictEqual(output, { v: 42 });
    });


  });

  describe('toResult', () => {
    it('converts Valid to Ok', () => {
      const decoded = Decoder.number.run(42);
      const result = DecoderUtil.toResult(decoded, (err) => ({ origErr: err, extra: 99 }));
      assert.deepStrictEqual(result, { tag: 'Ok', value: 42 });
    });

    it('converts DecoderError to Err with transformed error', () => {
      const decoded = Decoder.number.run('WAT');
      const result = DecoderUtil.toResult(decoded, (err) => ({ origErr: err, extra: 99 }));
      assert.deepStrictEqual(result,
        {
          tag: 'Err',
          error: {
            origErr: { error: "Not a number", value: "WAT" },
            extra: 99
          }
        });
    });
  });
});