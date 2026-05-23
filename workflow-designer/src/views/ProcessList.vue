<template>
  <div class="process-list-view">
    <div class="page-header">
      <h2>BPMN 流程管理</h2>
      <div style="display:flex;gap:10px;">
        <el-button @click="router.push('/form-list')">表单管理</el-button>
        <el-button type="primary" @click="openDesigner()">新建流程</el-button>
      </div>
    </div>

    <el-table :data="processList" v-loading="loading" stripe border>
      <el-table-column prop="key" label="流程标识" width="200" />
      <el-table-column prop="name" label="流程名称" width="200" />
      <el-table-column prop="version" label="版本" width="80" align="center" />
      <el-table-column prop="deploymentId" label="部署ID" min-width="240" show-overflow-tooltip />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.suspensionState === 1 ? 'success' : 'danger'">
            {{ row.suspensionState === 1 ? '激活' : '挂起' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDesigner(row.deploymentId)">
            编辑
          </el-button>
          <el-button link type="primary" @click="viewXml(row.deploymentId)">
            查看XML
          </el-button>
          <el-popconfirm
            title="确定删除此流程定义？"
            @confirm="handleDelete(row.deploymentId)"
          >
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- XML预览对话框 -->
    <el-dialog v-model="xmlDialogVisible" title="流程XML" width="70%">
      <pre class="xml-preview">{{ currentXml }}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { processApi, type ProcessDefinitionVO } from '../api'

const router = useRouter()
const loading = ref(false)
const processList = ref<ProcessDefinitionVO[]>([])
const xmlDialogVisible = ref(false)
const currentXml = ref('')

const loadList = async () => {
  loading.value = true
  try {
    const res = await processApi.list()
    processList.value = res.data
  } catch (err: any) {
    ElMessage.error('加载流程列表失败: ' + (err.message || ''))
  } finally {
    loading.value = false
  }
}

const openDesigner = (deploymentId?: string) => {
  if (deploymentId) {
    router.push({ path: '/designer', query: { deploymentId } })
  } else {
    router.push('/designer')
  }
}

const viewXml = async (deploymentId: string) => {
  try {
    const res = await processApi.getXml(deploymentId)
    currentXml.value = res.data
    xmlDialogVisible.value = true
  } catch (err: any) {
    ElMessage.error('获取XML失败: ' + (err.message || ''))
  }
}

const handleDelete = async (deploymentId: string) => {
  try {
    await processApi.remove(deploymentId)
    ElMessage.success('删除成功')
    loadList()
  } catch (err: any) {
    ElMessage.error('删除失败: ' + (err.message || ''))
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.process-list-view {
  padding: 24px;
  height: 100vh;
  overflow: auto;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.xml-preview {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 500px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
