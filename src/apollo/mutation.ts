import { VueApolloModelMutationOptions, VariablesFn, apolloClient } from '@/types';
import { BaseModel } from '@/module';
import Vue from 'vue';
import { defineReactive } from '@/install';

export interface ApolloMutationQury<T> {
    data: T;
    mutate(): void;
}

export default class Mutation<T> {
    private option: VueApolloModelMutationOptions;
    private model: BaseModel;
    private vm: Vue;
    private client: apolloClient
    private name: string;
    loading = false;

    constructor(name: string, option: VueApolloModelMutationOptions, client: apolloClient, model: BaseModel, vm: Vue) {
        defineReactive(this, 'loading', false);
        this.name = name;
        this.option = option;
        this.client = client;
        this.model = model;
        this.vm = vm;
    }
    private variables<T>(params: T) {
        if (this.option.variables && typeof this.option.variables === 'function') {
            return (this.option.variables as Function).call(
                this.model,
                params,
                this.vm.$route,
            );
        }
        return this.variables;
    }
    async mutate(params: any) {
        this.loading = true;
        try {
            const { data } = await this.client.mutate({
                mutation: this.option.mutation,
                variables: this.variables(params),
            });
            // @ts-ignore
            this.model[this.name].data = data;
        } catch (e) {
            throw e;
        } finally {
            this.loading = false;
        }
    }
}
