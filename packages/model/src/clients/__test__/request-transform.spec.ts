import { describe, it, expect } from 'vitest';
import { generateRequestInfo } from '../request-transform';

const clientOptions = {
    method: 'get',
    timeout: 60 * 1000.
} as const;

describe('rest request transform should be correct', () => {
    const variables = { a: 1 };
    it('method "get" / "head" should not have body', () => {
        const getRequest = generateRequestInfo('REST', {
            url: '/test',
            method: 'get',
            variables,
        });

        expect(getRequest.requestInit.body).toBe(undefined);

        const headRequest = generateRequestInfo('REST', {
            url: '/test',
            method: 'head',
            variables,
        });

        expect(headRequest.requestInit.body).toBe(undefined);
    });

    it('method "get" / "head" with "application/x-www-form-urlencoded" should append variables to url', () => {
        const getRequest = generateRequestInfo('REST', {
            url: '/test',
            method: 'get',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            variables,
        });

        expect(getRequest.requestInit.body).toBe(undefined);
        expect(getRequest.url).toBe('/test?a=1');

        const headRequest = generateRequestInfo('REST', {
            url: '/test',
            method: 'head',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            variables,
        });

        expect(headRequest.requestInit.body).toBe(undefined);
        expect(headRequest.url).toBe('/test?a=1');


        const getRequest1 = generateRequestInfo('REST', {
            url: '/test',
            method: 'get',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
        });

        expect(getRequest1.requestInit.body).toBe(undefined);
        expect(getRequest1.url).toBe('/test');

        const headRequest1 = generateRequestInfo('REST', {
            url: '/test',
            method: 'head',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
        });

        expect(headRequest1.requestInit.body).toBe(undefined);
        expect(headRequest1.url).toBe('/test');
    });

    it('method other should have a body', () => {
        const request = generateRequestInfo('REST', {
            url: '/test',
            method: 'post',
            variables,
        });

        expect(request.requestInit.body).toBe(JSON.stringify(variables));
    });
})