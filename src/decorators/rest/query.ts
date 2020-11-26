/**
 * @file rest query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Dec 3, 2019
 */

import Vue from 'vue';
import { RestQueryOptions, VariablesFn, RestClient, RestFetchMoreOptions } from '../../types';
import { BaseModel } from '../../model';
import xstream, { Subscription } from 'xstream';
import { initDataType } from '../utils';

export class RestQuery<ModelType extends BaseModel, DataType = any> {
    observable = xstream.create<{loading: boolean, data: DataType}>();

    private option: RestQueryOptions<ModelType>;
    private listeners: Array<() => void> = [];
    private client: RestClient<DataType>;
    private model: ModelType;
    private vm: Vue;

    loading: boolean = false;
    data!: DataType;
    error: any;

    constructor(
        option: RestQueryOptions<ModelType>,
        model: ModelType,
        vm: Vue,
        client: RestClient<DataType>,
    ) {
        this.option = option;
        this.model = model;
        this.client = client;
        this.vm = vm;
        initDataType(this, {} as DataType);
    }

    private get skip() {
        if (typeof this.option.skip === 'function') {
            return this.option.skip.call(this.model, this.vm.$route);
        }
        return this.option.skip;
    }

    private get pollInterval() {
        if (typeof this.option.pollInterval === 'function') {
            return this.option.pollInterval.call(this.model, this.vm.$route);
        }
        return this.option.pollInterval;
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
        const watcher = this.vm.$watch(() => [
            this.variables,
            this.skip,
            this.url,
        ], this.changeVariables);
        this.listeners.push(watcher);
        if (!this.skip) {
            this.refetch();
        }
        // TODO临时解，后面再优化
        const intervalWatcher = this.vm.$watch(() => [
            this.pollInterval,
        ], this.changePollInterval);
        this.listeners.push(intervalWatcher);
    }

    private pollIntervalSub: null | Subscription = null;

    private changePollInterval = () => {
        this.vm.$nextTick(() => {
            if (this.pollIntervalSub) {
                this.pollIntervalSub.unsubscribe();
                this.pollIntervalSub = null;
            }
            if (!this.pollInterval) {
                return;
            }
            this.pollIntervalSub = xstream
                .periodic(this.pollInterval)
                .subscribe({
                    next: () => this.refetch(),
                });
        });
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
        this.pollIntervalSub?.unsubscribe();
        this.pollIntervalSub = null;
    }

    fetchMore({ variables, updateQuery } : RestFetchMoreOptions<DataType>) {
        return new Promise(resolve => {
            this.client({
                url: this.url,
                headers: this.option.headers,
                method: this.option.method || 'GET',
                data: variables,
            }).then(data => {
                this.error = null;
                this.data = updateQuery(this.data, data);
                this.loading = false;
                resolve();
            }).catch(e => {
                this.error = e;
                this.loading = false;
                resolve();
            });
        });
    }

    refetch() {
        this.loading = true;
        // TODO差缓存数据做SSR还原
        return new Promise(resolve => {
            this.client({
                url: this.url,
                headers: this.option.headers,
                method: this.option.method || 'GET',
                data: this.variables,
            }).then(data => {
                this.error = null;
                if (data) {
                    this.data = data;
                }
                this.loading = false;
                resolve();
            }).catch(e => {
                this.error = e;
                this.loading = false;
                resolve();
            });
        });
    }
}
