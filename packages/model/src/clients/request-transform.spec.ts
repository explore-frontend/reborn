import { generateRequestInfo } from './request-transform';

const clientOptions = {
    method: 'get',
    timeout: 60 * 1000.
} as const;

describe('rest request transform should be correct', () => {
    const variables = { a: 1 };
    it('method "get" / "head" should not have body', () => {
        const getRequest = generateRequestInfo('REST', clientOptions, {
            url: '/test',
            method: 'get',
            variables,
        });

        expect(getRequest.requestInit.body).toBe(undefined);

        const headRequest = generateRequestInfo('REST', clientOptions, {
            url: '/test',
            method: 'head',
            variables,
        });

        expect(headRequest.requestInit.body).toBe(undefined);
    });

    it('method "get" / "head" with "application/x-www-form-urlencoded" should append variables to url', () => {
        const getRequest = generateRequestInfo('REST', clientOptions, {
            url: '/test',
            method: 'get',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            variables,
        });

        expect(getRequest.requestInit.body).toBe(undefined);
        expect(getRequest.url).toBe('/test&a=1');

        const headRequest = generateRequestInfo('REST', clientOptions, {
            url: '/test',
            method: 'head',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            variables,
        });

        expect(headRequest.requestInit.body).toBe(undefined);
        expect(headRequest.url).toBe('/test&a=1');
    });

    it('method other should not have a body', () => {
        const request = generateRequestInfo('REST', clientOptions, {
            url: '/test',
            method: 'post',
            variables,
        });

        expect(request.requestInit.body).toBe(JSON.stringify(variables));
    });
})