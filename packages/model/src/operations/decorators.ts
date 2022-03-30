import type { ModelMetadata } from '../types';

import type {
    GQLQueryOptions,
    GQLMutationOptions,
    RestQueryOptions,
    RestMutationOptions,
} from './types';


type OptionsDefine<T = Constructor> = ModelMetadata<T>['detail'];

type DecoratorType<T = Constructor> = ModelMetadata<T>['type'];

type Constructor = new (...args: any[]) => any;

function createDecorator<ModelType>(type: DecoratorType<ModelType>, detail: OptionsDefine<ModelType>) {
    return function decorator(target: any, key: string) {
        target.constructor.rebornDecorators = target.rebornDecorators || [];
        target.constructor.rebornDecorators.push({
            key,
            meta: {
                type,
                detail,
            },
        });
    }
}

export function gqlQuery<ModelType>(detail: GQLQueryOptions<ModelType>) {
    return createDecorator<ModelType>('gqlQuery', detail);
}

export function gqlMutation<ModelType>(detail: GQLMutationOptions<ModelType>) {
    return createDecorator<ModelType>('gqlMutation', detail);
}

export function restQuery<ModelType>(detail: RestQueryOptions<ModelType>) {
    return createDecorator<ModelType>('restQuery', detail);
}

export function restMutation<ModelType>(detail: RestMutationOptions<ModelType>) {
    return createDecorator<ModelType>('restMutation', detail);
}
