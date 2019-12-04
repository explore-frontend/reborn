import { ApolloMutationOptions, MutationVariablesFn } from '@/types';
import { BaseModel } from '@/module';
import Vue from 'vue';
import { defineReactive } from '../install';
import { getInitialStateFromQuery } from '@/utils/graphql';
import { ApolloClient } from 'apollo-client';

export class ApolloMutation<P extends BaseModel, T = any> {
    private option: ApolloMutationOptions<P>;
    private model: P;
    private vm: Vue;
    private client: ApolloClient<any>
    data!: T;
    loading = false;
    error: any;

    constructor(
        option: ApolloMutationOptions<P>,
        model: P,
        vm: Vue,
        client: ApolloClient<any>,
    ) {
        defineReactive(this, 'loading', false);
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
