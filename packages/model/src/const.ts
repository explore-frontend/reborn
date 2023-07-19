import type { RebornClient } from './clients';
import type { storeFactory } from './store';

import { inject } from 'vue';

export const INJECT_KEY = 'REBORN_STORE_KEY';

export let IS_SERVER = typeof window === 'undefined';

// TODO先脏一点，通过闭包模式来设置env，要不然得层层传递……后面再改一下
export type ENV = 'WEB' | 'MINI_APP';

export let env: ENV = 'WEB';

export function setEnv(e: ENV) {
    env = e;
}

export function getRootStore(): {
    store: ReturnType<typeof storeFactory>;
    rebornClient: RebornClient;
} {
    return inject(INJECT_KEY)!
}
