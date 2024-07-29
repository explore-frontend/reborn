<script lang="ts" setup>
import { useModel } from '../../../../../src';
import { TestModel } from './model';
import Comp from './component.vue'

const { a, b, c, data, status } = useModel(TestModel);
console.log('parent setup')


</script>
<template>
    <div>
        <button type="button" @click="c++">parent {{ status }}</button>
        <Comp />
    </div>
</template>
