<script lang="ts" setup>
import { TestModel } from './test-model';
import { useModel } from '../index';

const model = useModel(TestModel);

function click() {
    model.a.value++;
}
</script>

<template>
    <div class="a" @click="click">A: a: {{ model.a.value }} b: {{ model.b.value }}</div>
</template>