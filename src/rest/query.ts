/**
 * @file rest query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Dec 3, 2019
 */

import Vue from 'vue';
import { RestQueryOptions, VariablesFn, UrlFn } from '../types';
import { BaseModel } from '../model';
import xstream from 'xstream';
import { defineReactive } from '../install';
import { RequestParams } from '../utils/request';

export class RestQuery<ModelType extends BaseModel, DataType = any> {
    observable = xstream.create<{loading: boolean, data: DataType}>();

    private option: RestQueryOptions<ModelType>;
    private listeners: Array<() => void> = [];
    private request: (params: RequestParams) => Promise<any>;
    private model: ModelType;
    private vm: Vue;
    private hasPrefetched = false;

    loading: boolean = false;
    data!: DataType;
    error: any;

    constructor(
        option: RestQueryOptions<ModelType>,
        model: ModelType,
        vm: Vue,
        request: (params: RequestParams) => any,
    ) {
        this.option = option;
        this.model = model;
        this.request = request;
        this.vm = vm;

        defineReactive(this, 'data', {});
        defineReactive(this, 'loading', false);
        defineReactive(this, 'error', null);
    }

    private get skip() {
        if (typeof this.option.skip === 'function') {
            return this.option.skip.call(this.model, this.vm.$route);
        }
        return this.option.skip;
    }
    private get variables() {
        if (typeof this.option.variables === 'function') {
            return (this.option.variables as VariablesFn<ModelType>).call(this.model, this.vm.$route);
        }
        return this.option.variables;
    }
    private get url() {
        if (typeof this.option.url === 'function') {
            return this.option.url.call(
                this.model,
                this.vm.$route,
                this.variables,
            );
        }
        return this.option.url;
    }
    prefetch() {
        // TODO
    }

    init() {
        if (typeof this.option.variables === 'function') {
            const watcher = this.vm.$watch(() => this.variables, this.changeVariables);
            this.listeners.push(watcher);
        }
        if (typeof this.option.skip === 'function') {
            const watcher = this.vm.$watch(() => this.skip, this.changeVariables);
            this.listeners.push(watcher);
        }
        if (typeof this.option.url === 'function') {
            const watcher = this.vm.$watch(() => this.url, this.changeVariables);
            this.listeners.push(watcher);
        }
        if (!this.skip) {
            this.refetch();
        }
    }
    private changeVariables = () => {
        this.vm.$nextTick(() => {
            if (this.skip) {
                return;
            }
            this.refetch();
        });
    }

    destroy() {
        this.listeners.forEach(unwatch => unwatch());
        this.listeners = [];
    }

    fetchMore() {
        // TODO
    }

    refetch() {
        this.loading = true;
        // TODO差缓存数据做SSR还原
        return this.request({
            url: this.url,
            headers: this.option.headers,
            method: this.option.method || 'get',
            data: this.variables,
        }).then(data => {
            if (data) {
                this.data = data;
            }
        }).catch(e => {
            this.error = e
        }).finally(() => this.loading = false);;
    }
}
