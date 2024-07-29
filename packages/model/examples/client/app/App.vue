<script lang="ts" setup>
import { routes } from './routes';
import { getCurrentInstance, provide } from 'vue';
import Additon from './Additon.vue';

const router = getCurrentInstance()?.proxy!.$router;

const components: any[] = [];
provide('ssr-render', components);
</script>
<template>
    <div>
        <ul>
            <li v-for="route in routes" @click="router?.push({ name: route.name })">{{ route.name }}</li>
        </ul>
        <RouterView />
        <Additon :components="components" />
    </div>
</template>
