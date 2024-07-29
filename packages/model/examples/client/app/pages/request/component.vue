<script lang="ts" setup>
import { useModel } from '../../../../../src';
import { TestModel } from './model';

const { a, b, c, data, status } = useModel(TestModel);

const getString = () => {
    console.log('start render progress', data.value);
    return '???';
};

console.log('child setup')
</script>
<template>
    <div>
        {{ status }}
        {{ a }}, {{ b }}, {{ c }}, {{ data }}
        <button type="button" @click="c++">点，C变一次，理应重新发请求一次 {{ getString() }}</button>
    </div>
</template>
