import { storeModelInstance, GraphqlClients, Constructor } from './types';
import { BaseModel } from './model';
import ApolloClient from 'apollo-client';

interface StoreConstructorOptions {
    defaultClient: ApolloClient<any>
    clients?: Record<string, ApolloClient<any>>
}

export default class Store {
    private modelMap = new Map<Constructor<BaseModel>, storeModelInstance<BaseModel>>();
    graphqlClients: GraphqlClients;

    constructor(options: StoreConstructorOptions) {
        this.graphqlClients = {
            defaultClient: options.defaultClient,
            clients: options.clients || {}
        };
    }

    getModelInstance<T extends BaseModel>(constructor: Constructor<T>) {
        return this.modelMap.get(constructor) as storeModelInstance<T> | undefined;
    }

    registerModel<T extends BaseModel>(constructor: Constructor<T>) {
        if (this.modelMap.has(constructor)) {
            return this.modelMap.get(constructor)! as storeModelInstance<T>;
        }
        const storeModelInstance: storeModelInstance<T> = {
            constructor,
            instance: null,
            count: 0,
        };
        this.modelMap.set(constructor, storeModelInstance);
        return storeModelInstance as storeModelInstance<T>;
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