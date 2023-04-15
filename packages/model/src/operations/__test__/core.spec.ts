import type { RestMutationOptions, RestQueryOptions } from '../types';

import { describe, it, expect } from 'vitest';
import { initDataType, generateQueryOptions, generateMutationOptions, isDef } from '../core';

describe('isDef', () => {
    it('should return true for a defined value', () => {
        const value = 'hello';
        expect(isDef(value)).toBe(true);
    });

    it('should return false for an undefined value', () => {
        const value = undefined;
        expect(isDef(value)).toBe(false);
    });

    it('should return false for a null value', () => {
        const value = null;
        expect(isDef(value)).toBe(false);
    });
});

describe('initDataType', () => {
    it('should initialize data with undefined value and loading and error set to false', () => {
        const data = initDataType<string>();
        expect(data.data).toBeUndefined();
        expect(data.loading).toBe(false);
        expect(data.error).toBeUndefined();
    });
});

describe('generateQueryOptions', () => {
    const model = {};
    const route = {} as any;

    it('should return an object with the correct properties', () => {
        const option: RestQueryOptions = {
            url: '',
            skip: false,
            pollInterval: 1000,
            variables: {},
        };

        const queryOptions = generateQueryOptions(option, route, model);

        expect(queryOptions).toEqual(expect.objectContaining({
            info: expect.any(Object),
            skip: expect.any(Object),
            pollInterval: expect.any(Object),
            variables: expect.any(Object),
        }));
    });
});

describe('generateMutationOptions', () => {
    const model = {};
    const route = {} as any;

    it('should return an object with the correct properties', () => {
        const option: RestMutationOptions = {
            url: '',
            variables: {},
        };
        const mutationOptions = generateMutationOptions(option, route, model);

        expect(mutationOptions).toEqual(expect.objectContaining({
            info: expect.any(Object),
            variables: expect.any(Function),
        }));
    });
});