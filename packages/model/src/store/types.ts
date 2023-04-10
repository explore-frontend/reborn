import type { createGQLQuery, createRestQuery } from '../operations';
import type { FNModelCreator, Constructor, OriginalModelInstance } from '../model';
import type { EffectScope } from 'vue';


export type ModelInfo<T = unknown> = {
    constructor: FNModelCreator<T> | Constructor<T>;
    instance: OriginalModelInstance<T> | null;
    count: number;
    queryList: Array<ReturnType<typeof createRestQuery | typeof createGQLQuery>>;
    scope: EffectScope | null;
}

export type ModelMap = Record<string, ModelInfo>