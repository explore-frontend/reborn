import { Stream, Listener, Subscription } from 'xstream';
import { onServerPrefetch, onBeforeUnmount } from './dep';

export function stringifyPrimitive(v: string | boolean | number) {
    switch (typeof v) {
        case 'string':
            return v;
        case 'boolean':
            return v ? 'true' : 'false';
        case 'number':
            return isFinite(v) ? v : '';
        default:
            return '';
    }
};

function encode(v: string | boolean | number) {
    return encodeURIComponent(stringifyPrimitive(v));
}

// 简单做下key的排序是为了做缓存key那里，临时性解决，后面可能做细粒度优化
export function shimStringify(obj: any) {
    if (obj === null) {
        obj = undefined;
    }
    if (typeof obj !== 'object') {
        throw new Error('Params stringify Error, only support object');
    }
    return Object.keys(obj).map(k => {
        const key = encode(k) + '=';
        if (Array.isArray(obj[k])) {
          return obj[k].map((v: any) => {
            return key + encode(v);
          }).join('&');
        }
        return key + encode(obj[k]);
    }).join('&');
}

export function useXStream<T>(stream: Stream<T>, listener: Partial<Listener<T>>) {
    const sub: Subscription = stream.subscribe(listener);
    onBeforeUnmount(() => {
        sub.unsubscribe();
    });
    onServerPrefetch(() => {
        sub.unsubscribe();
    });
}

export function deepMerge<T extends Record<string, any> | Array<T>>(origin: T, ...targets: Array<T>) {
    for (const target of targets) {
        for (const key in target) {
            const originItem = origin[key];
            const targetItem = target[key];
            if (targetItem === undefined || targetItem === null) {
                continue;
            }
            if (originItem === undefined || originItem === null) {
                origin[key] = targetItem;
                continue;
            }
            if (typeof originItem !== typeof targetItem) {
                origin[key] = targetItem;
                continue;
            }
            if (Array.isArray(originItem)) {
                originItem.push(...(targetItem as unknown as Array<T>));
                continue;
            }
            if (typeof targetItem !== 'object') {
                origin[key] = targetItem;
                continue;
            }
            origin[key] = deepMerge(originItem, targetItem);
        }
    }
    return origin;
}