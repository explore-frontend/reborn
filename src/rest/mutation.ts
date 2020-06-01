/**
 * @file rest query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Dec 3, 2019
 */

import Vue from 'vue';
import { RestMutationOptions, MutationVariablesFn, UrlFn, UrlParam } from '../types';
import { BaseModel } from '../model';
import { defineReactive } from '../install';
import { RequestParams } from '../utils/request';

export class RestMutation<ModelType extends BaseModel, DataType = any> {
    private option: RestMutationOptions<ModelType>;
    private request: (params: RequestParams) => Promise<DataType>;
    private model: ModelType;
    private vm: Vue;

    loading: boolean = false;
    data!: DataType;
    error: any;

    constructor(
        option: RestMutationOptions<ModelType>,
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

    private variables<T>(params: T) {
        if (this.option.variables && typeof this.option.variables === 'function') {
            return (this.option.variables as MutationVariablesFn<ModelType>).call(
                // @ts-ignore
                this.model,
                params,
                this.vm.$route,
            );
        }
        return this.option.variables;
    }
    private url<T>(params: any) {
        if (this.option.url && typeof this.option.url === 'function') {
            return (this.option.url as UrlFn<ModelType>).call(
                // @ts-ignore
                this.model,
                params,
                this.vm.$route,
            );
        }
        return this.option.url;
    }
    mutate(params: any, urlParams: any) {
        this.loading = true;
        this.error = null;
        return this.request({
            url: this.url(urlParams),
            headers: this.option.headers,
            method: this.option.method || 'get',
            data: this.variables(params),
        }).then(data => {
            if (data) {
                this.data = data;
            }
            this.loading = false;
        }).catch(e => {
            this.error = e;
            this.loading = false;
        });
    }
}
