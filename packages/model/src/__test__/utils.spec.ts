import { describe, it, expect } from 'vitest';
import { deepMerge } from '../utils';

describe('utils', () => {
    it('deep merge', () => {
        const a = deepMerge({
            a: {
                b: 1,
            },
        }, {
            a: {
                b: 2,
            },
        });

        expect(a).toStrictEqual({
            a: {
                b: 2,
            },
        });

        const b = deepMerge({
            a: [1, 2, 3],
        }, {
            a: [4, 5, 6],
        });

        expect(b).toStrictEqual({
            a: [1, 2, 3, 4, 5, 6],
        });

        const c = deepMerge({}, {
            a: [4, 5, 6],
        });

        expect(c).toStrictEqual({
            a: [4, 5, 6],
        });

        const d = deepMerge({
            a: null,
        }, {
            a: [4, 5, 6],
        });

        expect(d).toStrictEqual({
            a: [4, 5, 6],
        });
    });

    it('deep merge the target should not be polluted', () => {
        const DEFAULT_OPTIONS = {
            a: {
                a: 1,
            },
        };
        const target = {
            a: {
                a: 2,
            }
        };

        const result = deepMerge({} as Partial<typeof DEFAULT_OPTIONS>, DEFAULT_OPTIONS, target);
        expect(result.a?.a).toBe(2);
        expect(DEFAULT_OPTIONS.a.a).toBe(1);
    });
});