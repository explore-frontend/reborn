<script lang="ts" setup>
import { ref } from 'vue3';
import AComponent from './A.vue'
import BComponent from './B.vue'
const abc = 'hello world';
const showA = ref(true)
const showB = ref(true)

const switchA = () =>  showA.value = !showA.value
const switchB = () =>  showB.value = !showB.value
</script>
<template>
    <div @click="switchA">switch a</div>
    <AComponent v-if="showA" />
    <div @click="switchB">switch b</div>
    <BComponent v-if="showB" />
</template>
