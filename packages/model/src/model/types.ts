import type { RebornClient } from '../clients';
import type {
    GQLQueryOptions,
    GQLMutationOptions,
    RestQueryOptions,
    RestMutationOptions,
} from '../operations/types';

export type ModelCtorInfo<T> = {
    type: 'FunctionalModel' | 'ClassModel';
    ctor: (client?: RebornClient) => OriginalModelInstance<T>;
};

export type OriginalModelInstance<T> = {
    model: T;
    prefetch: () => Promise<unknown>;
    destroy: () => void;
};

export type Constructor<T> = new (...args: any[]) => T;

export type ModelMetadata<T extends unknown = unknown> = {
    type: 'gqlQuery';
    detail: GQLQueryOptions<T>;
} | {
    type: 'gqlMutation';
    detail: GQLMutationOptions<T>;
} | {
    type: 'restQuery';
    detail: RestQueryOptions<T>;
} | {
    type: 'restMutation';
    detail: RestMutationOptions<T>;
};
