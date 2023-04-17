<script lang="ts" setup>
import { useModel } from '../index';
import { TestModel } from './test-model';

const { data, loading, a, b } = useModel(TestModel);
defineExpose({
    a,
});
</script>
<template>
    <div>
        <span>{{ data }}</span>
        <span>{{ loading }}</span>
        <span>{{ a }}</span>
        <span>{{ b }}</span>
    </div>
</template>