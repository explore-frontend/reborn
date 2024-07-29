<script lang="ts" setup>
import { onServerPrefetch, provide } from 'vue';
const props = defineProps<{ components: any[] }>();
provide('ssr-render', undefined);
const isSSR = typeof window === 'undefined';
console.log('add setup')
</script>
<template>
    <template v-if="isSSR" v-for="(component, idx) in components">
        <!-- <Teleport to="#addition"> -->
        <div><component :is="component" /></div>
        <!-- </Teleport> -->
    </template>
</template>
