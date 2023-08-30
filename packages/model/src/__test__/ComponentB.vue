<script lang="ts" setup>
import { computed } from 'vue';
import { TestModel } from './test-model';
import { useModel } from '../index';

const model = useModel(TestModel);

function click() {
    model.a.value++;
}

const c = computed(() => model.b.value);

</script>

<template>
    <div class="b" @click="click">B: a: {{ model.a.value }} b: {{ c }}</div>
</template>