import type { ClientOptions } from './types';
import { createRestClient } from './rest-client';

export type * from './types';

export function createClient(type: 'GQL' | 'REST', options?: ClientOptions) {
    return createRestClient(options)
}
