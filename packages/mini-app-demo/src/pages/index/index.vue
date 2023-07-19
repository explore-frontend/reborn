<template>
    <view class="content">
        <image class="logo" src="/static/logo.png" />
        <view class="text-area">
            <text class="title">{{ title }}</text>
        </view>
        <view>
            {{ a }}, {{ b }}, {{ c }}, {{ data }}
            <button type="button" @click="c++">点，C变一次，理应重新发请求一次</button>
        </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useModel } from '../../../../model/src';
import { TestModel } from './model';
const title = ref('Hello');


const { a, b, c, data } = useModel(TestModel);
setInterval(() => {
    a.value++;
}, 1000)
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 200rpx;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}
</style>
