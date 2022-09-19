import { describe, it, expect } from 'vitest';
import { hash } from '../src/cache/hash';

describe('hash in the right way', () => {
    it('primitive value', () => {
        expect(hash(undefined)).toBe('undefined-undefined');
        expect(hash(null)).toBe('null-null');
        expect(hash(true)).toBe('boolean-true');
        expect(hash(1)).toBe('number-1');
        expect(hash('1')).toBe('string-1');
        expect(() => hash(() => {})).toThrow();
    });

    it('primitive array', () => {
        expect(hash([ undefined ])).toBe('array-undefined-undefined');
        expect(hash([ null ])).toBe('array-null-null');
        expect(hash([ true ])).toBe('array-boolean-true');
        expect(hash([ 1 ])).toBe('array-number-1');
        expect(hash([ '1' ])).toBe('array-string-1');
        expect(() => hash([ () => {} ])).toThrow();
    });

    it('primitive object', () => {
        expect(hash({ })).toBe('object-');
        expect(hash({ a: undefined })).toBe('object-a-undefined-undefined');
        expect(hash({ a: null })).toBe('object-a-null-null');
        expect(hash({ a: true })).toBe('object-a-boolean-true');
        expect(hash({ a: 1 })).toBe('object-a-number-1');
        expect(hash({ a: '1' })).toBe('object-a-string-1');
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