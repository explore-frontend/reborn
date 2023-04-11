import type { ClientOptions } from './types';

import { clientFactory } from './common';
import { generateRequestInfo  } from './request-transform';

export type * from './types';

export function createClient(type: 'GQL' | 'REST', options?: ClientOptions) {
    return clientFactory(type, generateRequestInfo, options)
}
