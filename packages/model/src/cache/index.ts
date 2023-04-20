import { deepMerge } from '../utils';

export { hash } from './hash';

// TODO 暂时不需要考虑normalize的情况，等到后续有复杂需求以后再考虑。
export function createCache() {
    let cacheData: Record<string, unknown> = {};
    function restore(data: Record<string, unknown>) {
        cacheData = data;
    }

    function put(key: string, value: unknown) {
        cacheData[key] = value;
    }

    function get<T>(key: string): T {
        return cacheData[key] as T;
    }

    function update(key: string, value: unknown) {
        cacheData[key] = deepMerge(cacheData[key], value);
    }

    function remove(key: string) {
        cacheData[key] = undefined;
    }

    function extract() {
        return JSON.stringify(cacheData);
    }

    return {
        restore,
        put,
        get,
        update,
        remove,
        extract,
    }
}