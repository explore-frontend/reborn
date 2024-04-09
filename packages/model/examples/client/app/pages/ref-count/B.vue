<script setup lang="ts">
import { useModel } from '../../../../../src';
import { WrapModel } from './model2';

const {add, a} = useModel(WrapModel)
</script>
<template>
    <div @click="add">b {{ a }}</div>
</template>
