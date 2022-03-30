import type { ClientOptions } from './common';

import { clientFactory } from './common';
import { generateRequestInfo  } from './request-transform';


export function createClient(type: 'gql' | 'rest', options?: ClientOptions) {
    return clientFactory(type, generateRequestInfo, options)
}
