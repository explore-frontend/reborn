<script lang="ts" setup>
import { routes } from './routes';
import { getCurrentInstance } from 'vue';

const router = getCurrentInstance()?.proxy!.$router;
</script>
<template>
    <div>
        <ul>
            <li v-for="route in routes" @click="router?.push({ name: route.name })">{{ route.name }}</li>
        </ul>
        <RouterView />
    </div>
</template>
