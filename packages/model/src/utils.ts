import type { WatchOptions, WatchSource } from 'vue-demi';

import { watch } from 'vue-demi';
import { Observable } from 'rxjs';
import { hash } from './cache';

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

// TODO 因为当前url仅存在于代码中，暂不考虑hash的情况存在
export function appendQueryStringToUrl(url: string, queryString: string) {
    url = url.indexOf('?') !== -1 ? `${url}&${queryString}` : `${url}?${queryString}`;
    return url;
}

export function deepMerge<T extends any>(origin: T, ...targets: Array<T>) {
    for (const target of targets) {
        for (const key in target) {
            const originItem = origin[key];
            const targetItem = target[key];
            if (targetItem === undefined || targetItem === null) {
                continue;
            }
            let copy: any;
            if (Array.isArray(targetItem)) {
                copy = targetItem.map(info => {
                    if (Array.isArray(info)) {
                        return [...deepMerge([], info)];
                    }

                    if (typeof info === 'object' && info !== null) {
                        return deepMerge({}, info);
                    }

                    return info;
                })
            } else if (typeof targetItem === 'object' && targetItem !== null) {
                copy = deepMerge({}, targetItem);
            } else {
                copy = targetItem;
            }

            if (typeof originItem !== typeof targetItem || originItem === null) {
                origin[key] = copy;
                continue;
            }

            if (Array.isArray(originItem)) {
                originItem.push(...copy);
                continue;
            }

            if (typeof copy !== 'object') {
                origin[key] = targetItem;
                continue;
            }

            origin[key] = deepMerge(originItem, targetItem);
        }
    }
    return origin;
}

export function fromWatch<T>(fn: WatchSource<T>, watchOptions?: WatchOptions) {
    return new Observable<T>((subscriber) => {
        watch(fn, (val, oldVal) => {
            if (!val && oldVal === undefined || hash(val) !== hash(oldVal)) {
                // 一层简单的过滤，避免频繁触发
                subscriber.next(val);
            }
        }, watchOptions);
    });
}
