<script lang="ts" setup>
import { useModel } from '../src/api';
import { TestModel } from './model';

const { a, b } = useModel(TestModel);
setInterval(() => {
    a.value++;
}, 1000)
</script>
<template>
    <div>
        {{ a }}, {{ b }}
    </div>
</template>
