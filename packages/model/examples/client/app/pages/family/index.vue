<script setup lang="ts">
import { ref } from 'vue-demi';
import List from './List.vue';
import { useModel } from '../../../../../src';
import { HomeModel } from './model';

const { data } = useModel(HomeModel);
</script>
<template>
    <div v-if="data">
        <List />
        <br />
        <List />
        <br />
        <!-- <List /> -->
    </div>
</template>
