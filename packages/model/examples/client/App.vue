<script lang="ts" setup>
import { useModel } from '../../src';
import { TestModel } from './model';

const { a, b, data } = useModel(TestModel);
setInterval(() => {
    a.value++;
}, 1000)
</script>
<template>
    <div>
        {{ a }}, {{ b }}, {{ data?.d }}
    </div>
</template>
