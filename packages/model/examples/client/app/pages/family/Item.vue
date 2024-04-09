<script setup lang="ts">
import { useModel } from '../../../../../src';
import { TestModelFamily } from './model';

const props = defineProps<{
    id: number;
}>();
const { add, msg, globalMsg,data } = useModel(TestModelFamily(props.id));

</script>
<template>
    <span @click="add">id:{{ id }} item:{{ msg }} global: {{ globalMsg }} data: {{ data }}</span>
</template>
