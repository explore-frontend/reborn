import { VueApolloModelMutationOptions, MutationVariablesFn } from '@/types';
import { BaseModel } from '@/module';
import Vue from 'vue';
import { defineReactive } from '@/install';
import { getInitialStateFromQuery } from '@/utils/graphql';
import ApolloClient from 'apollo-client';

export class Mutation<T, P extends BaseModel> {
    private option: VueApolloModelMutationOptions<P>;
    private model: BaseModel;
    private vm: Vue;
    private client: ApolloClient<any>
    private name: string;
    data!: T;
    loading = false;
    error: any;

    constructor(name: string, option: VueApolloModelMutationOptions<P>, client: ApolloClient<any>, model: BaseModel, vm: Vue) {
        defineReactive(this, 'loading', false);
        this.name = name;
        this.option = option;
        this.client = client;
        this.model = model;
        this.vm = vm;
        const initialQueryState = getInitialStateFromQuery(option);
        defineReactive(this, 'data', initialQueryState);
        defineReactive(this, 'error', null);
    }
    private variables<T>(params: T) {
        if (this.option.variables && typeof this.option.variables === 'function') {
            return (this.option.variables as MutationVariablesFn<P>).call(
                // @ts-ignore
                this.model,
                params,
                this.vm.$route,
            );
        }
        return this.option.variables;
    }
    mutate(params: any) {
        this.loading = true;
        this.error = null;
        this.client.mutate<T>({
            mutation: this.option.mutation,
            variables: this.variables(params),
        }).then(({ data }) => {
            if (data) {
                this.data = data;
            }
        }).catch(e => {
            this.error = e
        }).finally(() => this.loading = false);
    }
}
