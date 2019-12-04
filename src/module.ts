/**
 * @file vue model
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Oct 24, 2018
 */
import { useApolloModel, install } from './install';
import Store from './store';
export { BaseModel } from './model';
export {
    apolloQuery,
    apolloMutation,
    restQuery,
    restMutation,
} from './decorators';

export default {
    install,
};

export {
    Store,
    useApolloModel,
};

export * from './types';