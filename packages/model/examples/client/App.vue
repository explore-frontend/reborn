<script lang="ts" setup>
import { useModel } from '../../src';
import { TestModel } from './model';

const { a, b, c, data } = useModel(TestModel);
setInterval(() => {
    a.value++;
}, 1000)
</script>
<template>
    <div>
        {{ a }}, {{ b }}, {{ c }}, {{ data }}
        <button type="button" @click="c++">点，C变一次，理应重新发请求一次</button>
    </div>
</template>
