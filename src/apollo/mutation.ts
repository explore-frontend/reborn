import { VueApolloModelMutationOptions, VariablesFn, apolloClient } from '@/types';
import { BaseModel } from '@/module';
import Vue from 'vue';
import { defineReactive } from '@/install';
import { getInitialStateFromQuery } from '@/utils/graphql';


export default class Mutation<T> {
    private option: VueApolloModelMutationOptions;
    private model: BaseModel;
    private vm: Vue;
    private client: apolloClient
    private name: string;
    data!: T;
    loading = false;

    constructor(name: string, option: VueApolloModelMutationOptions, client: apolloClient, model: BaseModel, vm: Vue) {
        defineReactive(this, 'loading', false);
        this.name = name;
        this.option = option;
        this.client = client;
        this.model = model;
        this.vm = vm;
        const initialQueryState = getInitialStateFromQuery(option);
        defineReactive(this, 'data', initialQueryState);
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
            const { data } = await this.client.mutate<T>({
                mutation: this.option.mutation,
                variables: this.variables(params),
            });
            if (data) {
                this.data = data;
            }
        } catch (e) {
            throw e;
        } finally {
            this.loading = false;
        }
    }
}
