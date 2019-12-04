import { StoreModelInstance, GraphqlClients, Constructor } from './types';
import { BaseModel } from './model';
import { ApolloClient } from 'apollo-client';
import { createRequest, RestOptions, RequestParams } from './utils/request';

interface StoreConstructorOptions {
    defaultClient: ApolloClient<any>;
    clients?: Record<string, ApolloClient<any>>;
    restOptions?: RestOptions;
}

export default class Store {
    private modelMap = new Map();
    graphqlClients: GraphqlClients;
    request: (params: RequestParams) => Promise<any>;

    constructor(options: StoreConstructorOptions) {
        this.graphqlClients = {
            defaultClient: options.defaultClient,
            clients: options.clients || {}
        };
        this.request = createRequest(options.restOptions);
    }

    getModelInstance<T extends BaseModel>(constructor: Constructor<T>) {
        return this.modelMap.get(constructor) as StoreModelInstance<T> | undefined;
    }

    registerModel<T extends BaseModel>(constructor: Constructor<T>) {
        if (this.modelMap.has(constructor)) {
            return this.modelMap.get(constructor)! as StoreModelInstance<T>;
        }
        const storeModelInstance: StoreModelInstance<T> = {
            constructor,
            instance: null,
            count: 0,
        };
        this.modelMap.set(constructor, storeModelInstance);
        return storeModelInstance as StoreModelInstance<T>;
    }

    exportStates() {
        const clientsExtracts: any = {};
        for (const key in this.graphqlClients.clients) {
            clientsExtracts[key] = this.graphqlClients.clients[key].cache.extract();
        }
        return {
            defaultClient: this.graphqlClients.defaultClient.cache.extract(),
            clients: {
                ...clientsExtracts
            },
        };
    }
}