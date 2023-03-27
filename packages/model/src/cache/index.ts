import { deepMerge } from '../utils';

// TODO 暂时不需要考虑normalize的情况，等到后续有复杂需求以后再考虑。
export class Cache {
    private data: Record<string, unknown> = {};
    restore(data: Record<string, unknown>) {
        this.data = data;
    }

    put(key: string, value: unknown) {
        this.data[key] = value;
    }

    get<T>(key: string): T {
        return this.data[key] as T;
    }

    update(key: string, value: unknown) {
        this.data[key] = deepMerge(this.data[key], value);
    }

    delete(key: string) {
        this.data[key] = undefined;
    }

    extract() {
        return JSON.stringify(this.data);
    }
}