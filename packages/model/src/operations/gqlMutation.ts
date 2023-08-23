import type { GQLMutationOptions, MutationVariablesFn } from './types';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { Client } from '../clients';

import { initDataType } from './core';


export function createGQLMutation<ModelType, DataType>(
    option: GQLMutationOptions<ModelType>,
    model: ModelType,
    route: RouteLocationNormalizedLoaded,
    client?: Client,
) {
    return {} as any
}
