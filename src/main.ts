/**
 * @file vue model
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Oct 24, 2018
 */
import { useApolloModel, install } from './install';
import Store from './store';
import { BaseModel } from './model';
import { useXStream } from './utils/stream';
import {
    apolloQuery,
    apolloMutation,
    restQuery,
    restMutation,
} from './decorators';

export default {
    install,
    Store,
    apolloQuery,
    BaseModel,
    apolloMutation,
    restQuery,
    restMutation,
    useApolloModel,
    useXStream,
};

export * from './types';
