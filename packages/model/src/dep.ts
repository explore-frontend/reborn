// 为了同时能用2和3，跑起来方便一点，把所有的Vue依赖收口一下
import Vue from 'vue';
import CompositionAPI from '@vue/composition-api';

export * from '@vue/composition-api';
export {
    CompositionAPI,
};

export type {
    VueConstructor,
} from 'vue';
export type {
    Route,
} from 'vue-router';

export {
    Vue,
};
