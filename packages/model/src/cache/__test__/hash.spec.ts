import { describe, it, expect } from 'vitest';
import { hash, encode } from '../hash';

describe('hash in the right way', () => {
    it('primitive value', () => {
        expect(hash(undefined)).toBe(encode('undefined-undefined'));
        expect(hash(null)).toBe(encode('null-null'));
        expect(hash(true)).toBe(encode('boolean-true'));
        expect(hash(1)).toBe(encode('number-1'));
        expect(hash('1')).toBe(encode('string-1'));
        expect(() => hash(() => {})).toThrow();
    });

    it('primitive array', () => {
        expect(hash([ undefined ])).toBe(encode(`array-${encode('undefined-undefined')}`));
        expect(hash([ null ])).toBe(encode(`array-${encode('null-null')}`));
        expect(hash([ true ])).toBe(encode(`array-${encode('boolean-true')}`));
        expect(hash([ 1 ])).toBe(encode(`array-${encode('number-1')}`));
        expect(hash([ '1' ])).toBe(encode(`array-${encode('string-1')}`));
        expect(() => hash([ () => {} ])).toThrow();
    });

    it('primitive object', () => {
        expect(hash({ })).toBe(encode('object-'));
        expect(hash({ a: undefined })).toBe(encode(`object-a-${encode('undefined-undefined')}`));
        expect(hash({ a: null })).toBe(encode(`object-a-${encode('null-null')}`));
        expect(hash({ a: true })).toBe(encode(`object-a-${encode('boolean-true')}`));
        expect(hash({ a: 1 })).toBe(encode(`object-a-${encode('number-1')}`));
        expect(hash({ a: '1' })).toBe(encode(`object-a-${encode('string-1')}`));
        expect(() => hash({a: () => {} })).toThrow();
    });

    it('mix type and order', () => {
        expect(hash({ a: 1, b: 2 })).toBe(hash({ b: 2, a: 1 }));
        expect(hash({ a: [ 1, 2, 3, 4 ], b: 2 })).toBe(hash({ b: 2, a: [ 1, 2, 3, 4 ] }));
        expect(hash({ a: [ 1, { b: 2, c: 3 }, 4 ], b: 2 })).toBe(hash({ b: 2, a: [ 1, { c: 3, b: 2 }, 4 ] }));
        expect(hash({ a: { b: 2, c: 3 }, b: 2 })).toBe(hash({ b: 2, a: { c: 3, b: 2 } }));

        expect(hash({ a: 1, b: 2 })).not.toBe(hash({ b: '2', a: 1 }));
        expect(hash({ a: [ 2, 1, 3, 4 ], b: 2 })).not.toBe(hash({ b: 2, a: [ 1, 2, 3, 4 ] }));
        expect(hash({ a: [ 1, { b: 2, c: 3 }, 4 ], b: 2 })).not.toBe(hash({ b: 2, a: [ 1, { c: 3, b: '2' }, 4 ] }));
    });
});