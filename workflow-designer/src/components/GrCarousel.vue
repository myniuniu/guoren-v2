<template>
  <div class="gr-carousel">
    <el-carousel
      v-if="images && images.length"
      :height="height"
      :autoplay="autoplay"
      :interval="interval"
      :arrow="arrow"
      :indicator-position="indicatorPosition || undefined"
      :type="type || undefined"
    >
      <el-carousel-item v-for="(img, idx) in images" :key="idx">
        <img :src="img" class="gr-carousel-img" />
      </el-carousel-item>
    </el-carousel>
    <div v-else class="gr-carousel-empty" :style="{ height }">
      <span>请在右侧配置图片</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  height?: string
  autoplay?: boolean
  interval?: number
  arrow?: string
  indicatorPosition?: string
  type?: string
  images?: string[]
}>()
</script>

<style scoped>
.gr-carousel {
  width: 100%;
}
.gr-carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.gr-carousel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}
</style>
