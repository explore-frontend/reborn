import type { RebornClient } from './types';
import type { storeFactory } from './store';

import { inject } from '@vue/composition-api';

export const INJECT_KEY = 'REBORN_STORE_KEY';

export function getRootStore(): {
    store: ReturnType<typeof storeFactory>;
    rebornClient: RebornClient;

} {
    return inject(INJECT_KEY)!
}