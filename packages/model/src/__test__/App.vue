<script lang="ts" setup>
import { ref } from 'vue-demi';

import ComponentA from './ComponentA.vue';
import ComponentB from './ComponentB.vue';

const show = ref(false);
const parentShow = ref(true);

function change() {
    show.value = !show.value;
}

function toggle() {
    parentShow.value = !parentShow.value;
}
</script>

<template>
    <div class="app" v-if="parentShow" @click="change" @keypress="toggle"><ComponentA v-if="show" /><ComponentB v-else /></div>
</template>