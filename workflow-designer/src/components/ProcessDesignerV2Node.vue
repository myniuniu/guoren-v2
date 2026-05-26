<template>
  <div class="pdv2-node-block">
    <!-- 当前节点（非根开始节点也用同样布局，根节点已是 start） -->
    <div
      v-if="node.type !== 'branch'"
      class="pdv2-node"
      :class="[
        node.type,
        { selected: selectedId === node.id, removable: canRemove(node) },
      ]"
      @click.stop="$emit('select', node)"
    >
      <div class="pdv2-node-header">
        <span class="pdv2-node-title">{{ headerTitle }}</span>
        <span
          v-if="canRemove(node)"
          class="pdv2-node-close"
          @click.stop="$emit('remove', node.id)"
        >×</span>
      </div>
      <div class="pdv2-node-body">
        <span class="pdv2-node-content">{{ contentText }}</span>
        <span class="pdv2-node-arrow">›</span>
      </div>
    </div>

    <!-- 条件分支：横向排列分支 -->
    <div v-if="node.type === 'condition' && node.branches && node.branches.length" class="pdv2-branches">
      <div class="pdv2-branch-line-top"></div>
      <div class="pdv2-branch-cols">
        <div v-for="(b, idx) in node.branches" :key="b.id" class="pdv2-branch-col">
          <div
            class="pdv2-branch-header"
            :class="{ selected: selectedId === b.id }"
            @click.stop="$emit('select', b)"
          >
            <span class="pdv2-branch-title">{{ b.name || `条件${idx + 1}` }}</span>
            <span class="pdv2-branch-priority">优先级{{ b.config?.priority || idx + 1 }}</span>
          </div>
          <!-- 分支内的下一节点 -->
          <div v-if="b.next" class="pdv2-branch-children">
            <div class="pdv2-add-btn" @click.stop="$emit('add', b.id)">
              <el-icon><Plus /></el-icon>
            </div>
            <NodeRender
              :node="b.next"
              :selected-id="selectedId"
              @select="$emit('select', $event)"
              @add="$emit('add', $event)"
              @remove="$emit('remove', $event)"
            />
          </div>
          <div v-else class="pdv2-add-btn solo" @click.stop="$emit('add', b.id)">
            <el-icon><Plus /></el-icon>
          </div>
        </div>
      </div>
      <div class="pdv2-branch-line-bottom"></div>
    </div>

    <!-- + 添加按钮 + 下一节点（非 end） -->
    <template v-if="node.type !== 'end' && node.type !== 'branch'">
      <div class="pdv2-add-btn" @click.stop="$emit('add', node.id)">
        <el-icon><Plus /></el-icon>
      </div>
    </template>

    <!-- 递归下一个节点 -->
    <NodeRender
      v-if="node.next"
      :node="node.next"
      :selected-id="selectedId"
      @select="$emit('select', $event)"
      @add="$emit('add', $event)"
      @remove="$emit('remove', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { FlowNode } from '../types/flowV2'

// 重要：设置组件名以支持模板内递归引用 <NodeRender />
defineOptions({ name: 'NodeRender' })

const props = defineProps<{
  node: FlowNode
  selectedId: string
}>()

defineEmits<{
  (e: 'select', n: FlowNode): void
  (e: 'add', parentId: string): void
  (e: 'remove', id: string): void
}>()

const headerTitle = computed(() => {
  switch (props.node.type) {
    case 'start':
      return '提交'
    case 'approval':
      return '审批'
    case 'cc':
      return '抄送'
    case 'condition':
      return '条件分支'
    case 'end':
      return '结束'
    default:
      return props.node.name || ''
  }
})

const contentText = computed(() => {
  const n = props.node
  switch (n.type) {
    case 'start': {
      const t = n.config?.submitterType
      if (t === 'all') return '提交人：全员可提交'
      if (t === 'role') return `提交人：角色 ${n.config?.roles || '未配置'}`
      if (t === 'user') return `提交人：${n.config?.users || '未配置'}`
      return '可设置抄送人'
    }
    case 'approval': {
      const t = n.config?.approverType
      if (t === 'self') return '审批人：提交人自选'
      if (t === 'leader') return '审批人：直属上级'
      if (t === 'role') return `审批人：角色 ${n.config?.roles || '未配置'}`
      if (t === 'user') return `审批人：${n.config?.approvers || '未配置'}`
      return '请选择审批人'
    }
    case 'cc':
      return n.config?.users ? `抄送：${n.config.users}` : '请选择抄送人'
    case 'condition':
      return '请配置分支条件'
    case 'end':
      return n.config?.ccUsers ? `抄送：${n.config.ccUsers}` : '可设置抄送人'
    default:
      return ''
  }
})

function canRemove(n: FlowNode): boolean {
  // 起始 / 结束节点不可删
  return n.type !== 'start' && n.type !== 'end'
}
</script>

<style scoped>
.pdv2-node-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 单节点 */
.pdv2-node {
  width: 220px;
  border-radius: 6px;
  background: #b1b9c8;
  cursor: pointer;
  user-select: none;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.15s ease;
}

.pdv2-node.selected {
  box-shadow: 0 0 0 2px #409eff, 0 4px 12px rgba(64, 158, 255, 0.2);
}

.pdv2-node.start,
.pdv2-node.end {
  background: #b1b9c8;
}
.pdv2-node.approval {
  background: #ff8c41;
}
.pdv2-node.cc {
  background: #36cfc9;
}
.pdv2-node.condition {
  background: #722ed1;
}

.pdv2-node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  color: #fff;
  font-size: 12px;
  position: relative;
}

.pdv2-node-title {
  font-weight: 500;
}

.pdv2-node-close {
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;
  padding: 0 4px;
}

.pdv2-node:hover .pdv2-node-close {
  opacity: 1;
}

.pdv2-node-close:hover {
  color: #ffe58f;
}

.pdv2-node-body {
  background: #fff;
  padding: 12px 14px;
  margin: 0 4px 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #303133;
  min-height: 22px;
}

.pdv2-node-content {
  flex: 1;
  color: #303133;
}

.pdv2-node.start .pdv2-node-body .pdv2-node-content,
.pdv2-node.end .pdv2-node-body .pdv2-node-content {
  color: #909399;
}

.pdv2-node-arrow {
  color: #c0c4cc;
  font-size: 18px;
  margin-left: 8px;
}

/* 加号按钮 */
.pdv2-add-btn {
  position: relative;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  cursor: pointer;
  margin: 14px 0;
  z-index: 1;
  transition: all 0.15s ease;
}

.pdv2-add-btn::before,
.pdv2-add-btn::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 1px;
  background: #c0c4cc;
}

.pdv2-add-btn::before {
  top: -14px;
  height: 14px;
}

.pdv2-add-btn::after {
  bottom: -14px;
  height: 14px;
  border-bottom: 6px solid transparent;
  /* 用伪元素的 box-shadow 制造箭头略繁琐，简化只保留连线 */
}

.pdv2-add-btn:hover {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
  transform: scale(1.05);
}

.pdv2-add-btn.solo::before,
.pdv2-add-btn.solo::after {
  display: none;
}

/* 条件分支布局 */
.pdv2-branches {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
}

.pdv2-branch-line-top,
.pdv2-branch-line-bottom {
  width: 1px;
  height: 14px;
  background: #c0c4cc;
}

.pdv2-branch-cols {
  display: flex;
  gap: 32px;
  position: relative;
  padding: 14px 0;
}

.pdv2-branch-cols::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: #c0c4cc;
}

.pdv2-branch-cols::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: #c0c4cc;
}

.pdv2-branch-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 240px;
}

.pdv2-branch-header {
  width: 220px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s ease;
}

.pdv2-branch-header.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

.pdv2-branch-title {
  color: #303133;
  font-weight: 500;
}

.pdv2-branch-priority {
  color: #909399;
  font-size: 12px;
}

.pdv2-branch-children {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
