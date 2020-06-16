import { FieldNode}  from 'graphql';
import { ApolloQueryOptions, ApolloMutationOptions } from '../types';
import { BaseModel } from '../model';

function is(target: any, type: string) {
    return Object.prototype.toString.call(target) === `[object ${type}]`;
}

function merge(source: any, ...args: any[]) {
    for (const target of args) {
        if (!is(target, 'Object') && !is(target, 'Array')) {
            return source;
        }
        const keys = is(target, 'Object')
            ? Object.keys({
                ...source,
                ...target,
            })
            : new Array(target.length).fill(1).map((val, index) => index);
        for (const key of keys) {
            if (target[key] === 'undefined') {
                continue;
            }
            if (is(target[key], 'Object')) {
                source[key] = is(source[key], 'Object') ? source[key] : {};
                merge(source[key], target[key]);
            } else if (is(target[key], 'Array')) {
                source[key] = is(source[key], 'Array') ? source[key] : [];
                merge(source[key], target[key]);
            } else if (!is(target[key], 'Undefined')){
                source[key] = target[key];
            } else {
                source[key] = source[key] || target[key];
            }
        }
    }
    return source;
}

export function transformQuery(item: FieldNode) {
    const result: Record<string, any> = {};
    const key = item.name.value;

    if (!item.selectionSet) {
        result[key] = null;
        return result;
    }

    result[key] = {};
    item.selectionSet.selections.forEach(item => {
        if ('name' in item) {
            result[key][item.name.value] = null;
        }
    });
    return result;
}

export function getInitialStateFromQuery<T extends BaseModel>(
    apolloDefine: ApolloQueryOptions<T> | ApolloMutationOptions<T>
) {
    const initialState = {};
    const queryDefine = 'query' in apolloDefine
        ? apolloDefine.query
        : apolloDefine.mutation;

    if (!queryDefine) {
        throw new Error('No query found.');
    }

    const { definitions } = queryDefine;

    definitions.forEach(item => {
        if ('selectionSet' in item) {
            item.selectionSet.selections.forEach(item => {
                if (item.kind === 'Field') {
                    Object.assign(initialState, transformQuery(item));
                }
            });
        }
    });
    if ('initState' in apolloDefine) {
        console.warn('"initState" field in query declare will no longer support!');
        return merge({}, initialState, apolloDefine.initState || {});
    }
    return initialState;
}
