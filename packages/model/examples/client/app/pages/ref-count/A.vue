<script setup lang="ts">
import { useModel } from '../../../../../src';
import { TestModel, WrapModel } from './model2';

const {add, a} = useModel(WrapModel)
const {a: a2} = useModel(TestModel)
</script>
<template>
    <div @click="add">a {{ a }} {{ a2 }}</div>
</template>
