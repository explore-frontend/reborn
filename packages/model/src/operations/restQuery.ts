import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { Observable, type Subscription } from 'rxjs';

import type { RestQueryOptions, RestFetchMoreOption, CommonQueryOptions } from './types';
import type { Client, RestRequestConfig } from '../clients';
import type { HydrationStatus, Store } from '../store';

import { generateQueryOptions } from './core';
import { computed, ref, type Ref } from 'vue';
import { deepMerge } from '../utils';
import { RequestReason } from './status';

export function createRestQuery<ModelType, DataType>(...args: any[]) {
    return {} as any
}
