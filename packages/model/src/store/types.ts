import type { FNModelCreator, Constructor, OriginalModelInstance } from '../model';
import type { EffectScope } from 'vue';
import { createQuery } from '../operations/query';


export type ModelInfo<T = unknown> = {
    constructor: FNModelCreator<T> | Constructor<T>;
    instance: OriginalModelInstance<T> | null;
    count: number;
    queryList: Array<ReturnType<typeof createQuery>>;
    scope: EffectScope | null;
}

export type ModelMap = Record<string, ModelInfo>
