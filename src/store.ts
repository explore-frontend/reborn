import Vue from 'vue';

import { storeModelInstance } from './types';
import { BaseModel } from './model';
import ApolloClient from 'apollo-client';

interface StoreConstructor {
    defaultApolloClient: ApolloClient<any>
}

export default class Store {
    private modelMap = new Map<BaseModel, storeModelInstance<BaseModel>>();
    graphqlClient: ApolloClient<any>;

    constructor(graphqlClient: ApolloClient<any>) {
        this.graphqlClient = graphqlClient;
    }

    getModelInstance<T extends BaseModel>(constructor: T) {
        return this.modelMap.get(constructor) as storeModelInstance<T>;
    }

    registerModel<T extends BaseModel>(constructor: T) {
        if (this.modelMap.has(constructor)) {
            return this.modelMap.get(constructor) as storeModelInstance<T>;
        }
        const storeModelInstance: storeModelInstance<T> = {
            constructor,
            instance: null,
            count: 0,
        };
        this.modelMap.set(constructor, storeModelInstance);
        return storeModelInstance;
    }

    exportStates() {
        return {
            defaultClient: this.graphqlClient.cache.extract(),
        };
    }
}