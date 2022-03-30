import { deepMerge } from './utils';

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
    });
});