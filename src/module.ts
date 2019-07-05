/**
 * @file vue model
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Oct 24, 2018
 */
import install from './install';
import Store from './store';
import { BaseModel, apolloQuery } from './model';

export default {
    install,
};

export { Store, apolloQuery, BaseModel };
