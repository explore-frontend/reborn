/**
 * @file apollo query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Oct 30, 2018
 */

import Vue from 'vue';
import {ObservableQuery} from 'apollo-client';

import {VueApolloModelQueryOptions, apolloClient, VariablesFn} from './types';
import {BaseModel} from './model';
import xstream, {Stream} from 'xstream';
import {defineReactive} from '@/install';

export default class Query {
    observer!: ObservableQuery;
    observable: Stream<any> = xstream.create();

    private option: VueApolloModelQueryOptions;
    private client: apolloClient;
    private listeners: Array<() => void> = [];
    private model: BaseModel;
    private vm: Vue;
    private name: string;
    private hasPrefetched = false;

    loading: boolean = false;

    constructor(name: string, option: VueApolloModelQueryOptions, client: apolloClient, model: BaseModel, vm: Vue) {
        this.name = name;
        this.option = option;
        this.client = client;
        this.model = model;
        this.vm = vm;
        // TODO 判断是server的时候要重新弄一下
        if (typeof window !== 'undefined') {
            this.init();
        }
    }

    // TODO后面应该要把fetchMore，refetch什么的都干掉才行……否则这块就是乱的= =
    // 这里干的事情其实跟ObservableQuery干的事情有非常大的重合度……
    currentResult() {
        if (this.observer) {
            return this.observer.currentResult();
        }
        return {
            loading: true,
            data: {},
        };
    }

    async prefetch() {
        const canPrefetch = typeof this.option.prefetch === 'function'
            ? this.option.prefetch.call(this.model, this.vm.$route) : this.option.prefetch;

        if (!canPrefetch || this.hasPrefetched) {
            return;
        }

        const { data } = await this.client.query(this.queryOptions);
        this.hasPrefetched = true;
        // @ts-ignore
        this.model[this.name] = data;
        return {
            [this.name]: data,
        };
    }
    private get queryOptions() {
        return {
            ...this.option,
            variables: this.variables,
            skip: this.skip,
        };
    }

    // TODO后续桥接应该也给干掉，不过需要吃透一遍apollo-alient的代码
    private initObserver() {
        this.observer = this.client.watchQuery(this.queryOptions);
        // TODO这里需要手动改变一下loading，watchQuery以后才需要根据后续状态获取一下loading态
        // 后面看一下apollo-client内部的实现
        this.loading = true;
        this.observer.subscribe({
            next: ({data, loading}: {data: any, loading: boolean}) => {
                this.loading = loading;
                this.observable.shamefullySendNext({data, loading});
            },
            error: err => {
                this.observable.shamefullySendError(err);
            },
            complete: () => {
                this.observable.shamefullySendComplete();
            },
        });
    }

    private init() {
        defineReactive(this, 'loading', false);
        if (!this.skip) {
            this.initObserver();
        }
        if (typeof this.option.variables === 'function') {
            const watcher = this.vm.$watch(() => this.variables, this.changeVariables.bind(this));
            this.listeners.push(watcher);
        }
        if (typeof this.option.skip === 'function') {
            const watcher = this.vm.$watch(() => this.skip, this.changeVariables.bind(this));
            this.listeners.push(watcher);
        }
    }
    private get skip() {
        if (typeof this.option.skip === 'function') {
            return this.option.skip.call(this.model, this.vm.$route);
        }
        return this.option.skip;
    }
    private get variables() {
        if (this.option.variables && typeof this.option.variables === 'function') {
            return (this.option.variables as VariablesFn).call(this.model, this.vm.$route);
        }
        return this.option.variables;
    }
    private async changeVariables() {
        await this.vm.$nextTick();
        if (this.skip) {
            return;
        }
        if (!this.observer) {
            this.initObserver();
        } else {
            this.observer.refetch(this.variables);
        }
    }

    destroy() {
        this.listeners.forEach(unwatch => unwatch());
        this.listeners = [];
    }

    fetchMore(fetchMoreOptions: any) {
        // TODO这里需要手动改变一下loading
        // 后面看一下apollo-client内部的实现
        this.loading = true;
        return this.observer.fetchMore(fetchMoreOptions);
    }

    // refetch 只会手动调用
    // refetch 调用的时候不需要管！
    refetch() {
        // TODO这里需要手动改变一下loading
        // 后面看一下apollo-client内部的实现
        this.loading = true;
        return this.observer.refetch();
    }
}
