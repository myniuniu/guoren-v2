<template>
  <div class="gr-image-list">
    <div v-for="(img, idx) in localImages" :key="idx" class="gr-image-row">
      <el-input v-model="localImages[idx]" placeholder="请输入图片URL" size="small" @change="emitChange" />
      <el-icon class="gr-img-del" @click="remove(idx)"><Delete /></el-icon>
    </div>
    <el-button size="small" type="primary" plain link @click="add">
      <el-icon><Plus /></el-icon>
      <span>添加图片</span>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'

const props = defineProps<{ modelValue?: string[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', val: string[]): void }>()

const localImages = ref<string[]>(props.modelValue ? [...props.modelValue] : [])

watch(() => props.modelValue, (val) => {
  localImages.value = val ? [...val] : []
})

function add() {
  localImages.value.push('')
  emitChange()
}
function remove(idx: number) {
  localImages.value.splice(idx, 1)
  emitChange()
}
function emitChange() {
  emit('update:modelValue', [...localImages.value])
}
</script>

<style scoped>
.gr-image-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gr-image-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.gr-img-del {
  cursor: pointer;
  color: #909399;
  flex-shrink: 0;
}
.gr-img-del:hover {
  color: #f56c6c;
}
</style>
