import type { ClientOptions } from './types';

import { clientFactory, TimeoutError, FetchError } from './client-factory';
import { generateRequestInfo } from './request-transform';

export type * from './types';

export function createClient<ClientType extends 'GQL' | 'REST'>(type: ClientType, options?: ClientOptions) {
    return clientFactory(type, generateRequestInfo, options);
}

export { TimeoutError, FetchError };
