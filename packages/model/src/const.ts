import type { RebornClient } from './clients';
import type { storeFactory } from './store';

import { inject } from 'vue-demi';

export const INJECT_KEY = 'REBORN_STORE_KEY';

export let MODE: 'SPA' | 'SSR' = 'SPA';

export function setMode(mode: 'SPA' | 'SSR') {
    MODE = mode;
}

export function getRootStore(): {
    store: ReturnType<typeof storeFactory>;
    rebornClient: RebornClient;
} {
    return inject(INJECT_KEY)!
}
