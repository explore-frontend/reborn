/**
 * @file apollo query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Oct 30, 2018
 */

import Vue from 'vue';
import ApolloClient, { ObservableQuery } from 'apollo-client';

import { VueApolloModelQueryOptions, VariablesFn } from '../types';
import { BaseModel } from '../model';
import xstream, { Stream } from 'xstream';
import { defineReactive } from '@/install';
import { getInitialStateFromQuery } from '@/utils/graphql';

export class Query<DataType, ModelType extends BaseModel> {
    observer!: ObservableQuery<DataType>;
    observable: Stream<{loading: boolean, data: DataType}> = xstream.create();

    private option: VueApolloModelQueryOptions<ModelType>;
    private client: ApolloClient<any>;
    private listeners: Array<() => void> = [];
    private model: ModelType;
    private vm: Vue;
    private name: string;
    private hasPrefetched = false;

    loading: boolean = false;
    data!: DataType;
    error: any;

    constructor(
        name: string,
        option: VueApolloModelQueryOptions<ModelType>,
        client: ApolloClient<any>,
        model: ModelType,
        vm: Vue,
    ) {
        this.name = name;
        this.option = option;
        this.client = client;
        this.model = model;
        this.vm = vm;

        const initialQueryState = getInitialStateFromQuery(option);
        defineReactive(this, 'data', initialQueryState);
        defineReactive(this, 'loading', false);
        defineReactive(this, 'error', null);
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

    prefetch() {
        const canPrefetch = typeof this.option.prefetch === 'function'
            ? this.option.prefetch.call(this.model, this.vm.$route)
            : this.option.prefetch;

        if (!canPrefetch || this.hasPrefetched) {
            return;
        }
        return this.client.query<DataType>(this.queryOptions)
            .then(({ data }) => {
                this.hasPrefetched = true;
                this.data = data;
                return data;
            });
    }
    private get queryOptions() {
        return {
            ...this.option,
            variables: this.variables,
            skip: this.skip,
            pollInterval: this.pollInterval,
        };
    }

    get pollInterval() {
        if (typeof this.option.pollInterval === 'function') {
            return this.option.pollInterval.call(this.model, this.vm.$route);
        }
        return this.option.pollInterval;
    }

    private initObserver() {
        this.observer = this.client.watchQuery(this.queryOptions);
        // 需要初始化watchQuery以后，currentResult才能拿到结果
        const initialData = this.currentResult();
        if (!initialData.loading) {
            this.data = initialData.data as DataType;
        }
        this.loading = true;
        this.observer.subscribe({
            next: ({data, loading}) => {
                if (!loading) {
                    this.data = data;
                }
                this.loading = loading;
                this.observable.shamefullySendNext({data, loading});
            },
            error: err => {
                this.loading = false;
                this.error = err;
                this.observable.shamefullySendError(err);
            },
            complete: () => {
                this.loading = false;
                this.observable.shamefullySendComplete();
            },
        });
    }

    init() {
        if (!this.skip) {
            this.initObserver();
        }
        if (typeof this.option.variables === 'function') {
            const watcher = this.vm.$watch(() => this.variables, this.changeVariables);
            this.listeners.push(watcher);
        }
        if (typeof this.option.skip === 'function') {
            const watcher = this.vm.$watch(() => this.skip, this.changeVariables);
            this.listeners.push(watcher);
        }
        if (typeof this.option.pollInterval === 'function') {
            const watcher = this.vm.$watch(() => this.pollInterval, () => {
                if (this.observer) {
                    this.observer.setOptions({
                        ...this.queryOptions,
                        pollInterval: this.pollInterval,
                    });
                }
            });
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
            return (this.option.variables as VariablesFn<ModelType>).call(this.model, this.vm.$route);
        }
        return this.option.variables;
    }
    private changeVariables = async () => {
        await this.vm.$nextTick();
        if (this.skip) {
            return;
        }
        if (!this.observer) {
            this.initObserver();
        } else {
            this.observer.setVariables(this.variables || {});
        }
    }

    destroy() {
        this.listeners.forEach(unwatch => unwatch());
        this.listeners = [];
    }

    fetchMore(fetchMoreOptions: any) {
        if (!this.observer) {
            return;
        }
        this.loading = true;
        return this.observer.fetchMore(fetchMoreOptions);
    }

    // refetch 只会手动调用
    // refetch 调用的时候不需要管！
    refetch() {
        if (!this.observer) {
            return;
        }
        this.loading = true;
        return this.observer.refetch(this.variables);
    }
}
