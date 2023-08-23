import type { RestMutationOptions, MutationVariablesFn } from './types';
import type { Client } from '../clients';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

import { initDataType } from './core';

export function createRestMutation<ModelType, DataType>(
    option: RestMutationOptions<ModelType>,
    model: ModelType,
    route: RouteLocationNormalizedLoaded,
    client?: Client,
){
return {} as any
}
