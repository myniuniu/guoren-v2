<template>
  <div class="unified-designer">
    <!-- 顶部栏 -->
    <div class="unified-toolbar">
      <div class="toolbar-left">
        <div v-if="!isEmbedded" class="back-btn" @click="goBack">
          <el-icon :size="20"><ArrowLeft /></el-icon>
        </div>
        <el-icon :size="18" class="toolbar-icon"><Grid /></el-icon>
        <el-input
          v-model="formName"
          placeholder="未命名表单"
          class="toolbar-name-input"
          size="default"
        />
      </div>
      <div class="toolbar-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>
      <div class="toolbar-right">
        <el-button type="danger" @click="handlePublish" :loading="saving">
          <el-icon><Upload /></el-icon>
          发布
        </el-button>
      </div>
    </div>

    <!-- Tab 内容区 -->
    <div class="unified-body">
      <!-- 表单设计 -->
      <div v-show="activeTab === 'form'" class="tab-content">
        <fc-designer ref="designerRef" :config="designerConfig" />
      </div>

      <!-- 流程设计 -->
      <div v-show="activeTab === 'process'" class="tab-content process-tab">
        <iframe
          v-if="processTabMounted"
          ref="processIframe"
          :src="designerSrc"
          class="process-iframe"
          @load="onIframeLoad"
        />
        <div v-if="!modelerReady && activeTab === 'process'" class="process-loading">
          <el-icon class="is-loading" :size="28"><Loading /></el-icon>
          <span>正在加载流程设计器...</span>
        </div>
      </div>

      <!-- 列表设计 -->
      <div v-show="activeTab === 'list'" class="tab-content list-designer-tab">
        <div class="list-main">
          <!-- 搜索栏 -->
          <div class="list-search-bar">
            <el-button type="danger" size="small">
              <el-icon><Search /></el-icon> 搜索
            </el-button>
            <el-button size="small">
              <el-icon><RefreshLeft /></el-icon> 重置
            </el-button>
            <el-button type="text" size="small" class="expand-btn">
              展开 <el-icon><ArrowDown /></el-icon>
            </el-button>
          </div>
          <!-- 表格区 -->
          <div class="list-table-area">
            <div class="list-table-toolbar">
              <el-button type="danger" size="small" plain>
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </div>
            <el-table :data="listPreviewData" border style="width: 100%" size="small">
              <el-table-column type="selection" width="40" />
              <el-table-column label="数据标题" prop="_title" align="center" width="180">
                <template #default>--</template>
              </el-table-column>
              <el-table-column
                v-for="col in visibleListColumns"
                :key="col.field"
                :label="col.title"
                :prop="col.field"
                align="center"
              >
                <template #default>--</template>
              </el-table-column>
            </el-table>
            <!-- 分页 -->
            <div class="list-pagination">
              <span>共 0 条</span>
              <el-select size="small" model-value="10" style="width:90px;margin:0 8px;">
                <el-option label="10条/页" :value="10" />
                <el-option label="20条/页" :value="20" />
                <el-option label="50条/页" :value="50" />
              </el-select>
              <el-pagination
                layout="prev, pager, next, jumper"
                :total="0"
                :page-size="10"
                small
              />
            </div>
          </div>
        </div>
        <!-- 右侧字段设置面板 -->
        <div class="list-right-panel">
          <div class="panel-tabs">
            <div
              class="panel-tab-item"
              :class="{ active: listPanelTab === 'fields' }"
              @click="listPanelTab = 'fields'"
            >字段设置</div>
            <div
              class="panel-tab-item"
              :class="{ active: listPanelTab === 'settings' }"
              @click="listPanelTab = 'settings'"
            >列表设置</div>
          </div>
          <!-- 字段设置 -->
          <div v-show="listPanelTab === 'fields'" class="panel-body">
            <div class="panel-section">
              <div class="panel-section-header">
                <span>查询条件</span>
                <el-popover
                  placement="left-start"
                  :width="280"
                  trigger="click"
                >
                  <template #reference>
                    <el-icon class="panel-add-icon"><Plus /></el-icon>
                  </template>
                  <div class="query-picker-panel">
                    <div class="query-picker-header">
                      <span class="query-picker-title">查询字段</span>
                      <span class="query-picker-selectall">
                        全选 <el-checkbox v-model="querySelectAll" @change="toggleQuerySelectAll" />
                      </span>
                    </div>
                    <div class="query-picker-list">
                      <div
                        v-for="f in allListFields"
                        :key="f.field"
                        class="query-picker-item"
                      >
                        <span>{{ f.title }}</span>
                        <el-checkbox
                          :model-value="isQueryFieldSelected(f.field)"
                          @change="(val) => toggleQueryField(f.field, f.title, val)"
                        />
                      </div>
                    </div>
                  </div>
                </el-popover>
              </div>
              <div v-if="listQueryFields.length" class="panel-field-list">
                <div
                  v-for="(f, idx) in listQueryFields"
                  :key="f.field"
                  class="panel-field-item"
                  draggable="true"
                  @dragstart="onQueryDragStart(idx, $event)"
                  @dragover.prevent="onQueryDragOver(idx)"
                  @drop="onQueryDrop(idx)"
                  @dragend="onQueryDragEnd"
                  :class="{ 'drag-over': queryDragOverIdx === idx }"
                >
                  <el-icon class="drag-icon"><Rank /></el-icon>
                  <span>{{ f.title }}</span>
                  <el-icon class="remove-icon" @click="listQueryFields.splice(idx, 1)"><Close /></el-icon>
                </div>
              </div>
            </div>
            <div class="panel-section">
              <div class="panel-section-header">
                <span>列表字段</span>
                <span class="select-all-wrap">
                  全选 <el-checkbox v-model="listSelectAll" @change="toggleSelectAll" />
                </span>
              </div>
              <div class="panel-field-list">
                <div
                  v-for="(f, idx) in allListFields"
                  :key="f.field"
                  class="panel-field-item"
                  draggable="true"
                  @dragstart="onFieldDragStart(idx, $event)"
                  @dragover.prevent="onFieldDragOver(idx, $event)"
                  @drop="onFieldDrop(idx)"
                  @dragend="onFieldDragEnd"
                  :class="{ 'drag-over': dragOverIdx === idx }"
                >
                  <el-icon class="drag-icon"><Rank /></el-icon>
                  <span>{{ f.title }}</span>
                  <el-checkbox v-model="f.visible" />
                </div>
              </div>
            </div>
          </div>
          <!-- 列表设置 -->
          <div v-show="listPanelTab === 'settings'" class="panel-body">
            <div class="settings-section">
              <div class="settings-label">排序字段</div>
              <el-select v-model="listConfig.sortField" placeholder="请选择" style="width:100%">
                <el-option
                  v-for="f in allListFields"
                  :key="f.field"
                  :label="f.title"
                  :value="f.field"
                />
              </el-select>
            </div>
            <div class="settings-section">
              <div class="settings-label">排序方式</div>
              <el-select v-model="listConfig.sortOrder" style="width:100%">
                <el-option label="降序" value="desc" />
                <el-option label="升序" value="asc" />
              </el-select>
            </div>
            <div class="settings-section">
              <div class="settings-label-row">
                <span>功能按钮</span>
                <el-icon class="panel-add-icon" @click="addFuncButton"><Plus /></el-icon>
              </div>
              <div class="func-btn-list">
                <div v-for="(btn, idx) in listConfig.funcButtons" :key="btn.key" class="func-btn-item">
                  <el-icon class="func-btn-icon" :style="{ color: '#f56c6c' }">
                    <component :is="iconMap[btn.icon]" />
                  </el-icon>
                  <span>{{ btn.label }}</span>
                  <el-icon class="func-btn-delete" @click="listConfig.funcButtons.splice(idx, 1)"><Delete /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 表单设置 -->
      <div v-show="activeTab === 'settings'" class="tab-content settings-tab">
        <div class="settings-form">
          <h3>表单基本设置</h3>
          <el-form label-width="100px" style="max-width: 500px">
            <el-form-item label="表单名称">
              <el-input v-model="formName" placeholder="请输入表单名称" />
            </el-form-item>
            <el-form-item label="表单标识">
              <el-input
                v-model="formKey"
                placeholder="表单标识(英文)"
                :disabled="isEdit"
              />
            </el-form-item>
            <el-form-item label="表单描述">
              <el-input
                v-model="formDesc"
                type="textarea"
                placeholder="请输入表单描述"
                :rows="4"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="表单预览" width="680px" destroy-on-close>
      <form-create
        v-if="previewRule.length"
        :rule="previewRule"
        :option="previewOption"
        v-model:api="previewApi"
      />
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Grid, Upload, Loading, Search, RefreshLeft, ArrowDown, Delete, Plus, Rank, Close, Refresh, Download, List, Printer, Operation } from '@element-plus/icons-vue'
import { processApi } from '../api'

// 图标名称到组件的映射
const iconMap: Record<string, any> = {
  Refresh, Search, Upload, Download, List, Printer, Operation, Delete
}

const router = useRouter()
const route = useRoute()
const designerRef = ref<any>(null)
const processIframe = ref<HTMLIFrameElement>()
const formName = ref('未命名表单')
const formKey = ref('')
const formDesc = ref('')
const saving = ref(false)
const previewVisible = ref(false)
const previewRule = ref<any[]>([])
const previewOption = ref<any>({})
const previewApi = ref<any>({})
const modelerReady = ref(false)

// 嵌入模式检测（从流程管理页面打开）
const isEmbedded = route.name === 'EmbeddedDesigner'
// 从流程管理进入时默认显示流程设计Tab
const activeTab = ref(isEmbedded ? 'process' : 'form')
// 流程设计Tab是否已激活过（避免iframe在隐藏状态加载导致画布异常）
const processTabMounted = ref(isEmbedded)
const editDeploymentId = route.query.deploymentId as string
const processKey = route.query.processKey as string
const isEdit = !!(route.query.formKey as string)

const tabs = [
  { key: 'form', label: '表单设计' },
  { key: 'process', label: '流程设计' },
  { key: 'list', label: '列表设计' },
  { key: 'settings', label: '表单设置' },
]

const designerConfig = ref({
  showSaveBtn: false,
})

const designerSrc = '/designer/index.html?v=' + Date.now()

// --- Process designer communication ---
const pendingRequests = new Map<string, { resolve: Function; reject: Function; timer: ReturnType<typeof setTimeout> }>()

function sendCommand(type: string, data: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const timer = setTimeout(() => {
      pendingRequests.delete(id)
      reject(new Error('操作超时'))
    }, 10000)
    pendingRequests.set(id, { resolve, reject, timer })
    processIframe.value?.contentWindow?.postMessage({ type, id, ...data }, '*')
  })
}

function handleMessage(event: MessageEvent) {
  const { type, id, xml, success, error } = event.data || {}
  if (type === 'modeler-ready') {
    if (modelerReady.value) return
    modelerReady.value = true
    // 如果有已有流程需要加载
    if (editDeploymentId) {
      loadExistingXml(editDeploymentId)
    } else if (processKey) {
      loadProcessByKey(processKey)
    }
    // 自动发送表单上下文到流程设计器
    setTimeout(() => sendFormContext(), 300)
    return
  }
  if (id && pendingRequests.has(id)) {
    const { resolve, reject, timer } = pendingRequests.get(id)!
    clearTimeout(timer)
    pendingRequests.delete(id)
    if (type === 'save-result') {
      if (xml) resolve(xml)
      else reject(new Error(error || '获取XML失败'))
    } else if (type === 'import-result') {
      if (success) resolve(true)
      else reject(new Error(error || '导入XML失败'))
    } else {
      resolve(event.data)
    }
  }
}

// 加载已有流程 XML
const loadExistingXml = async (deploymentId: string) => {
  try {
    const res = await processApi.getXml(deploymentId)
    const xml = typeof res.data === 'string' ? res.data : (res as any).data
    if (xml) {
      await sendCommand('import-xml', { xml })
    }
  } catch (err) {
    console.error('加载流程XML失败', err)
    ElMessage.warning('加载已有流程失败，将使用空白画布')
  }
}

const loadProcessByKey = async (key: string) => {
  try {
    const res = await processApi.getByKey(key)
    const pd = res.data
    if (pd) {
      formName.value = pd.name || formName.value
      await loadExistingXml(pd.deploymentId)
    }
  } catch (err) {
    console.error('根据key加载流程失败', err)
    ElMessage.warning('加载流程失败，将使用空白画布')
  }
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
  pendingRequests.forEach(({ timer }) => clearTimeout(timer))
  pendingRequests.clear()
})

// 监听 tab 切换，首次进入流程设计时加载 iframe，切换时重发表单上下文
watch(activeTab, (val) => {
  if (val === 'process' && !processTabMounted.value) {
    processTabMounted.value = true
  }
  // 切换到流程设计时，重新发送最新的表单上下文（包含最新 rules）
  if (val === 'process' && modelerReady.value) {
    setTimeout(() => sendFormContext(), 200)
  }
})

// 发送表单上下文到流程设计器 iframe
function sendFormContext() {
  if (!processIframe.value?.contentWindow) return
  // 获取当前表单的 key 和 rules
  const key = formKey.value || formName.value || ''
  let rules = ''
  if (designerRef.value) {
    try {
      const r = designerRef.value.getRule()
      if (r && r.length > 0) rules = JSON.stringify(r)
    } catch { /* ignore */ }
  }
  processIframe.value.contentWindow.postMessage({
    type: 'set-form-context',
    formKey: key,
    formName: formName.value,
    rules: rules
  }, '*')
}

// 监听 formKey/formName 变化，自动同步到流程设计器
watch([formKey, formName], () => {
  if (modelerReady.value) {
    sendFormContext()
  }
})

// ===== 列表设计 =====
const listPanelTab = ref('fields')
const listSelectAll = ref(false)
const listQueryFields = ref<Array<{ field: string; title: string }>>([])
const listConfig = reactive({
  sortField: '_createTime',
  sortOrder: 'desc',
  funcButtons: [
    { key: 'refresh', label: '刷新', icon: 'Refresh' },
    { key: 'filter', label: '筛选', icon: 'Search' },
    { key: 'import', label: '导入', icon: 'Upload' },
    { key: 'export', label: '导出', icon: 'Download' },
    { key: 'display', label: '显示', icon: 'List' },
  ] as Array<{ key: string; label: string; icon: string }>
})

// 添加功能按钮
const AVAILABLE_FUNC_BUTTONS = [
  { key: 'refresh', label: '刷新', icon: 'Refresh' },
  { key: 'filter', label: '筛选', icon: 'Search' },
  { key: 'import', label: '导入', icon: 'Upload' },
  { key: 'export', label: '导出', icon: 'Download' },
  { key: 'display', label: '显示', icon: 'List' },
  { key: 'print', label: '打印', icon: 'Printer' },
  { key: 'batch', label: '批量操作', icon: 'Operation' },
]

function addFuncButton() {
  const available = AVAILABLE_FUNC_BUTTONS.filter(
    b => !listConfig.funcButtons.some(fb => fb.key === b.key)
  )
  if (available.length === 0) {
    ElMessage.info('所有功能按钮已添加')
    return
  }
  listConfig.funcButtons.push({ ...available[0] })
}

// 固定字段
const FIXED_FIELDS = [
  { field: '_status', title: '流程状态', visible: true, fixed: true },
  { field: '_creator', title: '创建人员', visible: true, fixed: true },
  { field: '_department', title: '所属部门', visible: true, fixed: true },
  { field: '_createTime', title: '创建时间', visible: true, fixed: true },
]

// 所有列表字段（固定 + 表单动态字段）
const allListFields = ref<Array<{ field: string; title: string; visible: boolean; fixed?: boolean }>>(
  [...FIXED_FIELDS]
)

// 可见列
const visibleListColumns = computed(() => allListFields.value.filter(f => f.visible))

// 表格预览数据（3行空数据）
const listPreviewData = ref([{}, {}, {}])

// 全选/取消全选
function toggleSelectAll(val: boolean) {
  allListFields.value.forEach(f => { f.visible = val })
}

// 拖动排序
const dragFromIdx = ref(-1)
const dragOverIdx = ref(-1)

function onFieldDragStart(idx: number, e: DragEvent) {
  dragFromIdx.value = idx
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onFieldDragOver(idx: number, _e: DragEvent) {
  dragOverIdx.value = idx
}

function onFieldDrop(idx: number) {
  const from = dragFromIdx.value
  if (from < 0 || from === idx) return
  const list = allListFields.value
  const [item] = list.splice(from, 1)
  list.splice(idx, 0, item)
  dragFromIdx.value = -1
  dragOverIdx.value = -1
}

function onFieldDragEnd() {
  dragFromIdx.value = -1
  dragOverIdx.value = -1
}

// 查询条件弹窗
const queryPickerVisible = ref(false)
const querySelectAll = ref(false)

function isQueryFieldSelected(field: string): boolean {
  return listQueryFields.value.some(q => q.field === field)
}

function toggleQueryField(field: string, title: string, val: any) {
  if (val) {
    if (!listQueryFields.value.some(q => q.field === field)) {
      listQueryFields.value.push({ field, title })
    }
  } else {
    const idx = listQueryFields.value.findIndex(q => q.field === field)
    if (idx >= 0) listQueryFields.value.splice(idx, 1)
  }
}

function toggleQuerySelectAll(val: any) {
  if (val) {
    allListFields.value.forEach(f => {
      if (!listQueryFields.value.some(q => q.field === f.field)) {
        listQueryFields.value.push({ field: f.field, title: f.title })
      }
    })
  } else {
    listQueryFields.value = []
  }
}

// 查询条件拖动排序
const queryDragFromIdx = ref(-1)
const queryDragOverIdx = ref(-1)

function onQueryDragStart(idx: number, e: DragEvent) {
  queryDragFromIdx.value = idx
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onQueryDragOver(idx: number) {
  queryDragOverIdx.value = idx
}

function onQueryDrop(idx: number) {
  const from = queryDragFromIdx.value
  if (from < 0 || from === idx) return
  const list = listQueryFields.value
  const [item] = list.splice(from, 1)
  list.splice(idx, 0, item)
  queryDragFromIdx.value = -1
  queryDragOverIdx.value = -1
}

function onQueryDragEnd() {
  queryDragFromIdx.value = -1
  queryDragOverIdx.value = -1
}

// 监听 tab 切换到列表设计时，自动刷新表单字段
watch(activeTab, (val) => {
  if (val === 'list') {
    refreshListFields()
  }
})

// 从表单设计器读取字段并合并到列表字段
function refreshListFields() {
  let formFields: Array<{ field: string; title: string }> = []
  if (designerRef.value) {
    try {
      const rules = designerRef.value.getRule()
      if (rules && rules.length > 0) {
        formFields = extractFields(rules)
      }
    } catch { /* ignore */ }
  }
  // 保留固定字段 + 合并动态字段
  const existing = allListFields.value
  const merged: typeof allListFields.value = [...FIXED_FIELDS.map(f => {
    const ex = existing.find(e => e.field === f.field)
    return ex ? { ...f, visible: ex.visible } : { ...f }
  })]
  formFields.forEach(ff => {
    const ex = existing.find(e => e.field === ff.field)
    merged.push({
      field: ff.field,
      title: ff.title,
      visible: ex ? ex.visible : true
    })
  })
  allListFields.value = merged
}

// 从 form-create rules 中提取字段
function extractFields(rules: any[]): Array<{ field: string; title: string }> {
  const fields: Array<{ field: string; title: string }> = []
  function walk(list: any[]) {
    (list || []).forEach((r: any) => {
      if (r.field) {
        fields.push({ field: r.field, title: r.title || r.field })
      }
      if (r.children && Array.isArray(r.children)) walk(r.children)
      if (r.props && r.props.rule) walk(r.props.rule)
    })
  }
  walk(rules)
  return fields
}

const onIframeLoad = () => {
  console.log('[UnifiedDesigner] process iframe loaded')
}

const goBack = () => {
  router.push('/process-list')
}

// 发布：同时保存表单 + 部署流程
const handlePublish = async () => {
  saving.value = true
  try {
    // 保存表单设计（如果有设计内容）
    if (designerRef.value) {
      const rules = designerRef.value.getRule()
      const options = designerRef.value.getOption()
      if (rules && rules.length > 0 && formKey.value.trim()) {
        const stored = localStorage.getItem('gr_form_list')
        const formList: any[] = stored ? JSON.parse(stored) : []
        const existIdx = formList.findIndex((f: any) => f.key === formKey.value)
        const formData = {
          key: formKey.value,
          name: formName.value,
          desc: formDesc.value,
          rules: JSON.stringify(rules),
          options: JSON.stringify(options),
          updatedAt: new Date().toISOString(),
        }
        if (existIdx >= 0) {
          formList[existIdx] = { ...formList[existIdx], ...formData }
        } else {
          formList.push({ ...formData, createdAt: new Date().toISOString() })
        }
        localStorage.setItem('gr_form_list', JSON.stringify(formList))
      }
    }

    // 部署流程（如果流程设计器就绪）
    if (modelerReady.value) {
      const xml = await sendCommand('save-xml')
      if (xml) {
        const nameMatch = xml.match(/name="([^"]+)"/)
        const processName = nameMatch ? nameMatch[1] : formName.value

        const { value: deployName } = await ElMessageBox.prompt(
          '请输入流程名称',
          '部署流程',
          {
            confirmButtonText: '部署',
            cancelButtonText: '取消',
            inputValue: processName,
          }
        )

        await processApi.deploy({ name: deployName, xml })
        ElMessage.success('发布成功！')
        // 通知父窗口刷新列表
        try {
          window.parent?.postMessage({ type: 'process-deployed' }, '*')
        } catch { /* ignore */ }
      }
    } else {
      ElMessage.success('表单保存成功')
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error('发布失败: ' + (err.message || '未知错误'))
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  const editKey = route.query.formKey as string
  if (editKey) {
    const stored = localStorage.getItem('gr_form_list')
    const formList: any[] = stored ? JSON.parse(stored) : []
    const form = formList.find((f: any) => f.key === editKey)
    if (form) {
      formKey.value = form.key
      formName.value = form.name
      formDesc.value = form.desc || ''
      setTimeout(() => {
        if (designerRef.value) {
          try {
            const rules = JSON.parse(form.rules)
            const options = JSON.parse(form.options)
            designerRef.value.setRule(rules)
            designerRef.value.setOption(options)
          } catch { /* ignore */ }
        }
      }, 500)
    }
  }
})
</script>

<style scoped>
.unified-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f5f5;
}

.unified-toolbar {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 50px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #f56c6c;
  color: #fff;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #e64545;
}

.toolbar-icon {
  color: #666;
}

.toolbar-name-input {
  width: 160px;
}

.toolbar-name-input :deep(.el-input__wrapper) {
  box-shadow: none;
  border-bottom: 1px solid #dcdfe6;
  border-radius: 0;
  padding-left: 0;
}

.toolbar-tabs {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0 auto;
}

.tab-item {
  padding: 8px 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-item:hover {
  color: #333;
}

.tab-item.active {
  color: #f56c6c;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: #f56c6c;
  border-radius: 1px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unified-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-content {
  height: 100%;
  width: 100%;
}

.tab-content :deep(.fc-designer) {
  height: 100% !important;
}

.process-tab {
  position: relative;
}

.process-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.process-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.85);
  color: #909399;
  font-size: 14px;
}

.placeholder-tab {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== 列表设计 ===== */
.list-designer-tab {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.list-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: auto;
  background: #f5f5f5;
}

.list-search-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 16px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 12px;
  gap: 8px;
}

.expand-btn {
  color: #f56c6c !important;
}

.list-table-area {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.list-table-toolbar {
  margin-bottom: 12px;
}

.list-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0 0;
  font-size: 13px;
  color: #606266;
}

.list-right-panel {
  width: 240px;
  border-left: 1px solid #e8e8e8;
  background: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.panel-tabs {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.panel-tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 13px;
  cursor: pointer;
  color: #606266;
  position: relative;
}

.panel-tab-item:hover {
  color: #303133;
}

.panel-tab-item.active {
  color: #f56c6c;
  font-weight: 500;
}

.panel-tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 20%;
  width: 60%;
  height: 2px;
  background: #f56c6c;
  border-radius: 1px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
}

.panel-section {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #303133;
  margin-bottom: 8px;
}

.panel-add-icon {
  cursor: pointer;
  color: #f56c6c;
  font-size: 16px;
}

.panel-add-icon:hover {
  color: #e64545;
}

.select-all-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.panel-field-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-field-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 13px;
  color: #303133;
  gap: 8px;
}

.panel-field-item:hover {
  background: #f5f7fa;
}

.panel-field-item.drag-over {
  border-top: 2px solid #f56c6c;
  background: #fff5f5;
}

.panel-field-item span {
  flex: 1;
}

.drag-icon {
  color: #f56c6c;
  cursor: grab;
  font-size: 14px;
}

.remove-icon {
  cursor: pointer;
  color: #c0c4cc;
  font-size: 12px;
}

.remove-icon:hover {
  color: #f56c6c;
}

/* 查询字段选择弹窗 */
.query-picker-panel {
  padding: 0;
}

.query-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.query-picker-title {
  font-size: 14px;
  font-weight: 500;
  color: #f56c6c;
}

.query-picker-selectall {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #303133;
}

.query-picker-list {
  max-height: 320px;
  overflow-y: auto;
}

.query-picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  font-size: 14px;
  color: #303133;
  border-bottom: 1px solid #fafafa;
}

.query-picker-item:hover {
  background: #f5f7fa;
}

/* 列表设置面板 */
.settings-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 10px;
}

.settings-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 10px;
}

.func-btn-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.func-btn-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
  color: #303133;
  gap: 10px;
}

.func-btn-item:last-child {
  border-bottom: none;
}

.func-btn-icon {
  font-size: 16px;
}

.func-btn-item span {
  flex: 1;
}

.func-btn-delete {
  cursor: pointer;
  color: #f56c6c;
  font-size: 16px;
  opacity: 0.7;
}

.func-btn-delete:hover {
  opacity: 1;
}

.settings-tab {
  padding: 40px;
  overflow: auto;
}

.settings-form {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  max-width: 600px;
}

.settings-form h3 {
  margin: 0 0 24px;
  font-size: 16px;
  color: #303133;
}
</style>
