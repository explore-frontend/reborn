import type { ModelInfo } from './types';
import type { RebornInstanceType } from './api';

import { Cache } from './cache';
import { effectScope } from '@vue/composition-api';

export type GetModelInstance = ReturnType<typeof storeFactory>['getModelInstance'];

export function storeFactory() {
    const modelMap = new Map<ModelInfo<any>['constructor'], ModelInfo<any>>();
    const cache = new Cache();

    function getModelInstance<T>(constructor: ModelInfo<T>['constructor']): RebornInstanceType<typeof constructor> | null{
        return modelMap.get(constructor)?.instance?.model as unknown as RebornInstanceType<typeof constructor>;
    }

    function addModel<T>(constructor: ModelInfo<T>['constructor']) {
        if (modelMap.has(constructor)) {
            return modelMap.get(constructor)! as ModelInfo<T>;
        }

        const storeModelInstance: ModelInfo<T> = {
            constructor,
            instance: null,
            count: 0,
            queryList: [],
            scope: effectScope(true),
        };
        modelMap.set(constructor, storeModelInstance);
        return storeModelInstance as ModelInfo<T>;
    }

    function removeModel<T>(constructor: ModelInfo<T>['constructor']) {
        if (modelMap.has(constructor)) {
            modelMap.delete(constructor);
        }
    }

    function restore(data: Record<string, any>): void {
        cache.restore(data);
    }

    function exportStates(): Record<string, any>{
        return cache.extract();
    }

    return {
        getModelInstance,
        addModel,
        removeModel,
        restore,
        exportStates,
    };
}
