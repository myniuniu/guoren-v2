<template>
  <div class="pdv2-wrap">
    <!-- 顶部工具栏 -->
    <div class="pdv2-toolbar">
      <div class="pdv2-toolbar-left">
        <span class="pdv2-tip">点击节点可配置，点击 + 可添加节点</span>
      </div>
      <div class="pdv2-toolbar-right">
        <el-button size="small" @click="zoomOut">-</el-button>
        <span class="pdv2-zoom">{{ Math.round(zoom * 100) }}%</span>
        <el-button size="small" @click="zoomIn">+</el-button>
        <el-button size="small" @click="resetZoom">重置</el-button>
      </div>
    </div>

    <!-- 画布 -->
    <div class="pdv2-canvas">
      <div class="pdv2-flow" :style="{ transform: `scale(${zoom})` }">
        <NodeRender
          :node="root"
          :selected-id="selectedId"
          @select="onSelect"
          @add="onAdd"
          @remove="onRemove"
        />
      </div>
    </div>

    <!-- 节点配置抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="drawerTitle"
      direction="rtl"
      size="400px"
      :destroy-on-close="false"
    >
      <div v-if="currentNode" class="pdv2-config">
        <el-form label-position="top" label-width="100px">
          <el-form-item label="节点名称">
            <el-input v-model="currentNode.name" placeholder="请输入节点名称" />
          </el-form-item>

          <!-- 提交节点 -->
          <template v-if="currentNode.type === 'start'">
            <el-form-item label="提交人">
              <el-radio-group v-model="currentNode.config.submitterType">
                <el-radio value="all">全员可提交</el-radio>
                <el-radio value="role">指定角色</el-radio>
                <el-radio value="user">指定人员</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="currentNode.config.submitterType === 'role'" label="角色">
              <el-input v-model="currentNode.config.roles" placeholder="多个角色用逗号分隔" />
            </el-form-item>
            <el-form-item v-if="currentNode.config.submitterType === 'user'" label="人员">
              <el-input v-model="currentNode.config.users" placeholder="多个人员用逗号分隔" />
            </el-form-item>
          </template>

          <!-- 审批节点 -->
          <template v-if="currentNode.type === 'approval'">
            <el-form-item label="审批人来源">
              <el-radio-group v-model="currentNode.config.approverType">
                <el-radio value="user">指定人员</el-radio>
                <el-radio value="role">指定角色</el-radio>
                <el-radio value="leader">直属上级</el-radio>
                <el-radio value="self">提交人自选</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="currentNode.config.approverType === 'user'" label="审批人">
              <el-input v-model="currentNode.config.approvers" placeholder="多个人员用逗号分隔" />
            </el-form-item>
            <el-form-item v-if="currentNode.config.approverType === 'role'" label="角色">
              <el-input v-model="currentNode.config.roles" placeholder="多个角色用逗号分隔" />
            </el-form-item>
            <el-form-item label="多人审批方式">
              <el-radio-group v-model="currentNode.config.multiMode">
                <el-radio value="any">任一人通过即可</el-radio>
                <el-radio value="all">所有人通过</el-radio>
                <el-radio value="sequential">按顺序依次审批</el-radio>
              </el-radio-group>
            </el-form-item>
          </template>

          <!-- 抄送节点 -->
          <template v-if="currentNode.type === 'cc'">
            <el-form-item label="抄送人">
              <el-input
                v-model="currentNode.config.users"
                placeholder="多个人员用逗号分隔"
              />
            </el-form-item>
          </template>

          <!-- 条件分支节点 -->
          <template v-if="currentNode.type === 'condition'">
            <el-form-item label="条件表达式">
              <el-input
                v-model="currentNode.config.expression"
                type="textarea"
                :rows="3"
                placeholder="如：${amount > 1000}"
              />
            </el-form-item>
            <el-form-item label="优先级">
              <el-input-number v-model="currentNode.config.priority" :min="1" :max="99" />
            </el-form-item>
          </template>

          <!-- 结束节点 -->
          <template v-if="currentNode.type === 'end'">
            <el-form-item label="抄送人">
              <el-input
                v-model="currentNode.config.ccUsers"
                placeholder="流程结束后抄送给这些人，多个用逗号分隔"
              />
            </el-form-item>
          </template>
        </el-form>
      </div>
    </el-drawer>

    <!-- 添加节点弹窗 -->
    <el-dialog v-model="addDialogVisible" title="添加节点" width="420px" append-to-body>
      <div class="pdv2-add-list">
        <div class="pdv2-add-item" @click="confirmAdd('approval')">
          <div class="pdv2-add-icon approval">审</div>
          <div class="pdv2-add-info">
            <div class="pdv2-add-name">审批人</div>
            <div class="pdv2-add-desc">由指定的成员对申请进行审批</div>
          </div>
        </div>
        <div class="pdv2-add-item" @click="confirmAdd('cc')">
          <div class="pdv2-add-icon cc">抄</div>
          <div class="pdv2-add-info">
            <div class="pdv2-add-name">抄送人</div>
            <div class="pdv2-add-desc">将申请通知给指定的成员</div>
          </div>
        </div>
        <div class="pdv2-add-item" @click="confirmAdd('condition')">
          <div class="pdv2-add-icon condition">条</div>
          <div class="pdv2-add-info">
            <div class="pdv2-add-name">条件分支</div>
            <div class="pdv2-add-desc">根据不同条件流转到不同分支</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits, defineExpose } from 'vue'
import NodeRender from './ProcessDesignerV2Node.vue'
import { ElMessage } from 'element-plus'
import type { FlowNode, NodeType } from '../types/flowV2'

const props = defineProps<{ modelValue?: FlowNode | null }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: FlowNode): void
  (e: 'change', v: FlowNode): void
}>()

const zoom = ref(1)
const drawerVisible = ref(false)
const selectedId = ref<string>('')
const currentNode = ref<FlowNode | null>(null)
const addDialogVisible = ref(false)
const addParentId = ref<string>('')

const root = ref<FlowNode>(props.modelValue || createDefaultFlow())

watch(
  root,
  (val) => {
    emit('update:modelValue', val)
    emit('change', val)
  },
  { deep: true },
)

watch(
  () => props.modelValue,
  (val) => {
    if (val && val !== root.value) {
      root.value = val
    }
  },
)

function createDefaultFlow(): FlowNode {
  const endNode: FlowNode = {
    id: genId(),
    type: 'end',
    name: '结束',
    config: { ccUsers: '' },
  }
  const approvalNode: FlowNode = {
    id: genId(),
    type: 'approval',
    name: '审批人',
    config: { approverType: 'self', multiMode: 'any' },
    next: endNode,
  }
  const startNode: FlowNode = {
    id: genId(),
    type: 'start',
    name: '提交',
    config: { submitterType: 'all' },
    next: approvalNode,
  }
  return startNode
}

function genId(): string {
  return 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const drawerTitle = computed(() => {
  if (!currentNode.value) return '配置节点'
  const map: Record<NodeType, string> = {
    start: '提交人配置',
    approval: '审批人配置',
    cc: '抄送人配置',
    condition: '条件分支配置',
    end: '结束节点配置',
    branch: '分支配置',
  }
  return map[currentNode.value.type] || '配置节点'
})

function onSelect(node: FlowNode) {
  selectedId.value = node.id
  currentNode.value = node
  drawerVisible.value = true
}

function onAdd(parentId: string) {
  addParentId.value = parentId
  addDialogVisible.value = true
}

function confirmAdd(type: NodeType) {
  const parent = findNode(root.value, addParentId.value)
  if (!parent) return
  const newNode: FlowNode = createNode(type)
  // 把原 next 接到新节点之后
  newNode.next = parent.next
  parent.next = newNode

  // 条件分支默认两个分支
  if (type === 'condition') {
    newNode.branches = [
      {
        id: genId(),
        type: 'branch',
        name: '条件1',
        config: { expression: '', priority: 1 },
      },
      {
        id: genId(),
        type: 'branch',
        name: '条件2',
        config: { expression: '', priority: 2 },
      },
    ]
  }

  addDialogVisible.value = false
  ElMessage.success('已添加节点')
}

function createNode(type: NodeType): FlowNode {
  const base: FlowNode = {
    id: genId(),
    type,
    name: '',
    config: {},
  }
  switch (type) {
    case 'approval':
      base.name = '审批人'
      base.config = { approverType: 'self', multiMode: 'any' }
      break
    case 'cc':
      base.name = '抄送人'
      base.config = { users: '' }
      break
    case 'condition':
      base.name = '条件分支'
      base.config = {}
      break
  }
  return base
}

function onRemove(nodeId: string) {
  removeNodeById(root.value, nodeId)
  ElMessage.success('已删除节点')
}

function removeNodeById(parent: FlowNode, nodeId: string): boolean {
  if (parent.next && parent.next.id === nodeId) {
    parent.next = parent.next.next
    return true
  }
  if (parent.next && removeNodeById(parent.next, nodeId)) return true
  if (parent.branches) {
    for (const b of parent.branches) {
      if (removeNodeById(b, nodeId)) return true
    }
  }
  return false
}

function findNode(node: FlowNode | undefined, id: string): FlowNode | null {
  if (!node) return null
  if (node.id === id) return node
  const inNext = findNode(node.next, id)
  if (inNext) return inNext
  if (node.branches) {
    for (const b of node.branches) {
      const r = findNode(b, id)
      if (r) return r
    }
  }
  return null
}

function zoomIn() {
  zoom.value = Math.min(zoom.value + 0.1, 1.6)
}
function zoomOut() {
  zoom.value = Math.max(zoom.value - 0.1, 0.5)
}
function resetZoom() {
  zoom.value = 1
}

function getFlowJson(): FlowNode {
  return JSON.parse(JSON.stringify(root.value))
}

function setFlowJson(json: FlowNode) {
  if (json) root.value = json
}

defineExpose({ getFlowJson, setFlowJson })
</script>

<style scoped>
.pdv2-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.pdv2-toolbar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.pdv2-tip {
  font-size: 12px;
  color: #909399;
}

.pdv2-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pdv2-zoom {
  font-size: 13px;
  color: #606266;
  min-width: 42px;
  text-align: center;
}

.pdv2-canvas {
  flex: 1;
  overflow: auto;
  padding: 32px 16px 80px;
  display: flex;
  justify-content: center;
}

.pdv2-flow {
  transform-origin: top center;
  transition: transform 0.15s ease;
}

.pdv2-config {
  padding: 0 16px;
}

/* 添加节点弹窗 */
.pdv2-add-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pdv2-add-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pdv2-add-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.pdv2-add-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.pdv2-add-icon.approval {
  background: #ff8c41;
}
.pdv2-add-icon.cc {
  background: #36cfc9;
}
.pdv2-add-icon.condition {
  background: #722ed1;
}

.pdv2-add-info {
  flex: 1;
}

.pdv2-add-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  margin-bottom: 2px;
}

.pdv2-add-desc {
  font-size: 12px;
  color: #909399;
}
</style>
