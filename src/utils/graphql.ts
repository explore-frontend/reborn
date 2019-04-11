import {FieldNode} from 'graphql';
import merge from 'lodash/merge';

import {VueApolloModelQueryOptions} from '@/types';

export function transformQuery(item: FieldNode) {
    const result: {[key: string]: any} = {};
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

export function getInitialStateFromQuery(apolloDefine: VueApolloModelQueryOptions) {
    const initialState = {};
    const queryDefine = apolloDefine.query;
    if (!queryDefine) {
        throw new Error('Query 里面没有 Query 么');
    }

    const {definitions} = queryDefine;

    definitions.forEach(item => {
        if ('selectionSet' in item) {
            item.selectionSet.selections.forEach(item => {
                if (item.kind === 'Field') {
                    Object.assign(initialState, transformQuery(item));
                }
            });
        }
    });

    return merge({}, initialState, apolloDefine.initState || {});
}
