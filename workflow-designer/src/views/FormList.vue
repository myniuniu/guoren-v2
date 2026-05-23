<template>
  <div class="form-list-view">
    <div class="page-header">
      <h2>表单管理</h2>
      <el-button type="primary" @click="openDesigner()">新建表单</el-button>
    </div>

    <el-table :data="formList" stripe border empty-text="暂无表单，点击右上角新建">
      <el-table-column prop="key" label="表单标识" width="180" />
      <el-table-column prop="name" label="表单名称" width="200" />
      <el-table-column label="字段数" width="100" align="center">
        <template #default="{ row }">
          {{ getFieldCount(row) }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="240" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDesigner(row.key)">编辑</el-button>
          <el-button link type="primary" @click="handlePreview(row)">预览</el-button>
          <el-button link type="primary" @click="handleCopyJson(row)">复制JSON</el-button>
          <el-popconfirm title="确定删除此表单？" @confirm="handleDelete(row.key)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="表单预览" width="680px" destroy-on-close>
      <form-create
        v-if="previewRule.length"
        :rule="previewRule"
        :option="previewOption"
      />
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formList = ref<any[]>([])
const previewVisible = ref(false)
const previewRule = ref<any[]>([])
const previewOption = ref<any>({})

const loadList = () => {
  const stored = localStorage.getItem('gr_form_list')
  formList.value = stored ? JSON.parse(stored) : []
}

const openDesigner = (formKey?: string) => {
  if (formKey) {
    router.push({ path: '/form-designer', query: { formKey } })
  } else {
    router.push('/form-designer')
  }
}

const handlePreview = (row: any) => {
  try {
    const rules = JSON.parse(row.rules)
    const options = JSON.parse(row.options)
    previewRule.value = rules
    previewOption.value = { ...options, submitBtn: true, resetBtn: true }
    previewVisible.value = true
  } catch {
    ElMessage.error('表单数据解析失败')
  }
}

const handleCopyJson = async (row: any) => {
  try {
    const data = { key: row.key, name: row.name, rules: JSON.parse(row.rules), options: JSON.parse(row.options) }
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const handleDelete = (key: string) => {
  const stored = localStorage.getItem('gr_form_list')
  const list: any[] = stored ? JSON.parse(stored) : []
  const filtered = list.filter((f: any) => f.key !== key)
  localStorage.setItem('gr_form_list', JSON.stringify(filtered))
  ElMessage.success('删除成功')
  loadList()
}

const getFieldCount = (row: any): number => {
  try {
    const rules = JSON.parse(row.rules)
    return rules.filter((r: any) => r.field).length
  } catch {
    return 0
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.form-list-view {
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
</style>
