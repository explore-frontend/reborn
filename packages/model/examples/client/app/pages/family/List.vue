<script setup lang="ts">
import { ref } from 'vue-demi';
import Item from './Item.vue';

const list = ref(
    [1, 2, 3].map((i) => ({
        show: true,
        id: i,
    })),
);

const switchShow = (id: number) => {
    const item = list.value.find((i) => i.id === id);
    if (item) {
        item.show = !item.show;
    }
};
</script>
<template>
    <div>
        <div v-for="item in list" :key="item.id">
            <Item v-if="item.show" :id="item.id" />
            <button @click="switchShow(item.id)">switch show</button>
        </div>
    </div>
</template>
