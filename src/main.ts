/**
 * @file vue model
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Oct 24, 2018
 */
import { useApolloModel } from './install';
import Store from './store';
import { BaseModel } from './model';
import { useXStream } from './utils/stream';
import {
    createLink,
    createApolloClient,
    createRestClient,
} from './clients';
import {
    apolloQuery,
    apolloMutation,
    restQuery,
    restMutation,
} from './decorators';

export default {
    Store,
    apolloQuery,
    BaseModel,
    apolloMutation,
    restQuery,
    restMutation,
    useApolloModel,
    useXStream,
    createLink,
    createApolloClient,
    createRestClient,
};

export * from './types';
