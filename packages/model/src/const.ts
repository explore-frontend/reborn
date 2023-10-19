import type { RebornClient } from './clients';
import type { storeFactory } from './store';

import { getCurrentInstance, inject } from 'vue-demi';

export const INJECT_KEY = 'REBORN_STORE_KEY';

interface RootStore {
    store: ReturnType<typeof storeFactory>;
    rebornClient: RebornClient;
}

export const ROOT_STORE_MAP = new WeakMap<
    NonNullable<NonNullable<ReturnType<typeof getCurrentInstance>>['proxy']>,
    RootStore
>();

export let MODE: 'SPA' | 'SSR' = 'SPA';

export function setMode(mode: 'SPA' | 'SSR') {
    MODE = mode;
}

export function getRootStore(): RootStore {
    const instance = getCurrentInstance()?.proxy;
    const store = instance && ROOT_STORE_MAP.get(instance);
    // if self is not provided store, then use injected store from parent
    return store ?? inject(INJECT_KEY)!;
}
