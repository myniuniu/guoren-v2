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
        <fc-designer ref="designerRef" :config="designerConfig" :menu="designerMenu" />
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

      <!-- 流程设计 v2（钉钉风格） -->
      <div v-show="activeTab === 'processV2'" class="tab-content process-v2-tab">
        <ProcessDesignerV2 ref="processV2Ref" v-model="flowV2Data" />
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
import { ArrowLeft, Grid, Upload, Loading } from '@element-plus/icons-vue'
import { processApi } from '../api'
import ProcessDesignerV2 from '../components/ProcessDesignerV2.vue'
import { flowToBpmnXml } from '../utils/flowV2ToBpmn'
import type { FlowNode } from '../types/flowV2'

const router = useRouter()
const route = useRoute()
const designerRef = ref<any>(null)
const processIframe = ref<HTMLIFrameElement>()
const processV2Ref = ref<any>(null)
const flowV2Data = ref<FlowNode | null>(null)
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
  { key: 'processV2', label: '流程设计v2' },
]

const designerConfig = ref<any>({
  showSaveBtn: false,
  // 隐藏额外的配置 Tab，只保留一个统一的右侧面板
  showPropsForm: false,
  showValidateForm: false,
  showStyleForm: false,
  showEventForm: false,
  showFormConfig: false,
  showInputData: false,
  showJsonPreview: false,
  showCustomProps: false,
  showAi: false,
  showLanguage: false,
  showDevice: false,
  showComponentName: false,
  // 右侧面板只显示“基础配置”，下面通过 baseRule + componentRule 定制字段
  baseRule: ({ t }: any) => buildBaseRule(t),
  componentRule: {
    input: (rule: any) => buildPlaceholderRule(rule, '请输入'),
    textarea: (rule: any) => buildPlaceholderRule(rule, '请输入'),
    inputNumber: (rule: any) => buildPlaceholderRule(rule, '请输入'),
    datePicker: (rule: any) => buildPlaceholderRule(rule, '请选择日期'),
    dateRange: (rule: any) => buildPlaceholderRule(rule, '请选择日期区间'),
    upload: () => [],
    radio: () => buildOptionsRule(),
    checkbox: () => buildOptionsRule(),
    elAlert: (rule: any) => buildAlertRule(rule),
    tableForm: () => [],
  },
  // 每个拖入组件只显示复制和删除悬浮按钮
  updateDefaultRule: {
    input: { handleBtn: ['copy', 'delete'] },
    textarea: { handleBtn: ['copy', 'delete'] },
    inputNumber: { handleBtn: ['copy', 'delete'] },
    datePicker: { handleBtn: ['copy', 'delete'] },
    dateRange: { handleBtn: ['copy', 'delete'] },
    radio: { handleBtn: ['copy', 'delete'] },
    checkbox: { handleBtn: ['copy', 'delete'] },
    elAlert: { handleBtn: ['copy', 'delete'] },
    upload: { handleBtn: ['copy', 'delete'] },
    tableForm: { handleBtn: ['copy', 'delete'] },
  },
})

// “其他可选”的公共项：打印 + 必填
function buildOtherCheckboxRule() {
  return {
    type: 'checkbox',
    field: '$_extras',
    title: '其他可选',
    value: ['print', 'required'],
    options: [
      { label: '打印', value: 'print' },
      { label: '必填', value: 'required' },
    ],
    props: { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
  }
}

// 默认 baseRule：标题 + 默认提示 + 默认值开关 + 其他可选
function buildBaseRule(_t: any) {
  return [
    {
      type: 'input',
      field: 'title',
      title: '标题',
      props: { placeholder: '请输入' },
      validate: [{ required: true, message: '标题不能为空' }],
    },
    {
      type: 'switch',
      field: '$_default_enabled',
      title: '默认值设置',
      value: false,
    },
    buildOtherCheckboxRule(),
  ]
}

// input/textarea/inputNumber/datePicker/dateRange 共用：默认提示
function buildPlaceholderRule(_rule: any, defaultPlaceholder: string) {
  return [
    {
      type: 'input',
      field: 'props.placeholder',
      title: '默认提示',
      value: defaultPlaceholder,
      props: { placeholder: defaultPlaceholder },
    },
  ]
}

// radio/checkbox 选项配置
function buildOptionsRule() {
  return [
    {
      type: 'fcOptions',
      field: 'options',
      title: '选项配置',
      value: [
        { label: '选项一', value: '1' },
        { label: '选项二', value: '2' },
      ],
    },
  ]
}

// 说明组件
function buildAlertRule(_rule: any) {
  return [
    {
      type: 'input',
      field: 'props.title',
      title: '说明内容',
      props: { placeholder: '请输入说明文本' },
    },
  ]
}

// 自定义左侧组件菜单：按设计稿对齐，仅保留与图示一致的组件
const designerMenu = [
  {
    name: 'text',
    title: '文本',
    list: [
      { name: 'input', label: '单行文本', icon: 'icon-input' },
      { name: 'textarea', label: '多行文本', icon: 'icon-textarea' },
      { name: 'elAlert', label: '说明', icon: 'icon-alert' },
    ],
  },
  {
    name: 'number',
    title: '数值',
    list: [
      { name: 'inputNumber', label: '数字', icon: 'icon-number' },
    ],
  },
  {
    name: 'options',
    title: '选项',
    list: [
      { name: 'radio', label: '单选', icon: 'icon-radio' },
      { name: 'checkbox', label: '多选', icon: 'icon-checkbox' },
    ],
  },
  {
    name: 'date',
    title: '日期',
    list: [
      { name: 'datePicker', label: '日期', icon: 'icon-date' },
      { name: 'dateRange', label: '日期区间', icon: 'icon-date-range' },
    ],
  },
  {
    name: 'other',
    title: '其他',
    list: [
      { name: 'tableForm', label: '明细/表格', icon: 'icon-table-form' },
      { name: 'upload', label: '图片/视频', icon: 'icon-upload' },
    ],
  },
]

// 注册轮播图组件到表单设计器（已不再显示在菜单中，仅保留以兼容历史表单的渲染）
function registerCarouselComponent() {
  if (!designerRef.value) return
  try {
    designerRef.value.addComponent({
      name: 'GrCarousel',
      label: '轮播图',
      icon: 'icon-image',
      menu: 'aide',
      input: false,
      drag: false,
      mask: true,
      rule() {
        return {
          type: 'GrCarousel',
          props: {
            height: '200px',
            autoplay: true,
            interval: 3000,
            arrow: 'hover',
            indicatorPosition: '',
            type: '',
            images: [
              'https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg',
              'https://fuss10.elemecdn.com/1/34/19aa98b1fcb2781c4fba33d850549jpeg.jpeg',
              'https://fuss10.elemecdn.com/0/6f/e35ff375812e6b0020b6b4e8f9583jpeg.jpeg'
            ]
          }
        }
      },
      props(_rule: any, { t }: any) {
        return [
          { type: 'input', field: 'height', title: '高度', value: '200px' },
          { type: 'switch', field: 'autoplay', title: '自动播放', value: true },
          { type: 'inputNumber', field: 'interval', title: '间隔(ms)', value: 3000, props: { min: 500, step: 500 } },
          {
            type: 'select', field: 'arrow', title: '箭头',
            options: [
              { label: '划过时显示', value: 'hover' },
              { label: '始终显示', value: 'always' },
              { label: '从不显示', value: 'never' }
            ]
          },
          {
            type: 'select', field: 'indicatorPosition', title: '指示器位置',
            options: [
              { label: '内部', value: '' },
              { label: '外部', value: 'outside' },
              { label: '不显示', value: 'none' }
            ]
          },
          {
            type: 'select', field: 'type', title: '类型',
            options: [
              { label: '默认', value: '' },
              { label: '卡片', value: 'card' }
            ]
          },
          {
            type: 'GrImageList', field: 'images', title: '图片列表', value: []
          }
        ]
      }
    })
  } catch (e) { console.warn('[registerCarouselComponent]', e) }
}

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
    // 自动发送表单上下文到流程设计器（延迟确保表单规则已加载）
    setTimeout(() => sendFormContext(), 800)
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
  // 表单设计器加载后注册轮播图组件
  setTimeout(() => registerCarouselComponent(), 100)
  // 切换为手机模式，让中间画布呈现手机壳容器（每行一个组件）
  setTimeout(() => {
    try {
      designerRef.value?.setDevice && designerRef.value.setDevice('mobile')
    } catch (e) { /* ignore */ }
  }, 120)
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
    // 部署流程：优先使用 V2 设计（如果 V2 设计中有后续节点），否则使用传统 BPMN 设计器
    const hasV2Flow = !!(flowV2Data.value && (flowV2Data.value.next || flowV2Data.value.branches))
    if (hasV2Flow) {
      const json = flowV2Data.value as FlowNode
      const processKey = (formKey.value || formName.value || 'processV2').replace(/[^a-zA-Z0-9_]/g, '_')
      const xml = flowToBpmnXml(json, processKey, formName.value || '流程V2')
      const { value: deployName } = await ElMessageBox.prompt(
        '请输入流程名称',
        '部署流程',
        {
          confirmButtonText: '部署',
          cancelButtonText: '取消',
          inputValue: formName.value || '流程V2',
        }
      )
      await processApi.deploy({ name: deployName, xml })
      // 保存 V2 JSON 到 localStorage（便于下次编辑）
      try {
        const stored = localStorage.getItem('gr_flow_v2') || '{}'
        const map = JSON.parse(stored)
        map[processKey] = json
        localStorage.setItem('gr_flow_v2', JSON.stringify(map))
      } catch { /* ignore */ }
      ElMessage.success('发布成功！')
      try { window.parent?.postMessage({ type: 'process-deployed' }, '*') } catch { /* ignore */ }
    } else if (modelerReady.value) {
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
      // 加载 V2 流程 JSON（如果之前发布过）
      try {
        const v2Stored = localStorage.getItem('gr_flow_v2')
        if (v2Stored) {
          const map = JSON.parse(v2Stored)
          const v2Key = form.key.replace(/[^a-zA-Z0-9_]/g, '_')
          if (map && map[v2Key]) {
            flowV2Data.value = map[v2Key]
          }
        }
      } catch { /* ignore */ }
      setTimeout(() => {
        if (designerRef.value) {
          try {
            const rules = JSON.parse(form.rules)
            const options = JSON.parse(form.options)
            designerRef.value.setRule(rules)
            designerRef.value.setOption(options)
          } catch { /* ignore */ }
        }
        // 设置完规则后，如果流程设计器已就绪，重新发送表单上下文
        if (modelerReady.value) {
          setTimeout(() => sendFormContext(), 100)
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

/* ===== 表单设计中间画布：手机壳容器，每行一个组件 ===== */
/* 隐藏顶部设备切换工具栏（设计稿中不展示） */
.tab-content :deep(._fc-m-tools) {
  display: none !important;
}
/* 画布备件类：清理背景让手机壳冸显 */
.tab-content :deep(._fc-m-con) {
  background: #f0f2f5 !important;
  padding: 24px 0 !important;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
/* 手机壳容器 */
.tab-content :deep(._fc-m-drag.mobile) {
  width: 360px !important;
  min-height: calc(100% - 48px);
  margin: 0 auto !important;
  background: #fff !important;
  border-radius: 16px !important;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08) !important;
  padding: 16px !important;
  overflow: visible !important;
}
/* 强制画布内子表单项单列排列，每行仅允许一个组件 */
.tab-content :deep(._fc-m-drag.mobile) > .el-row,
.tab-content :deep(._fc-m-drag.mobile) .el-row {
  display: block !important;
  margin: 0 !important;
}
.tab-content :deep(._fc-m-drag.mobile) .el-col {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  flex: 0 0 100% !important;
  padding: 0 !important;
  margin-bottom: 8px;
}

/* ===== 选中组件时的悬浮操作按钮：仅复制/删除，不占位置 ===== */
/* 画布内组件容器：相对定位，便于按钮区绝对定位 */
.tab-content :deep(._fd-drag-tool) {
  position: relative !important;
  outline: none;
  border: 2px solid transparent;
  border-radius: 4px;
  transition: border-color 0.15s ease;
}
/* 选中时蓝色边框 */
.tab-content :deep(._fd-drag-tool.active) {
  border-color: #409eff;
}
/* 隐藏左侧拖拽把手（移动按钮），手机模式不需要拖拽排序 */
.tab-content :deep(._fd-drag-tool ._fd-drag-l) {
  display: none !important;
}
/* 按钮区：始终渲染并绝对定位（不占位），默认透明不可点 */
.tab-content :deep(._fd-drag-tool ._fd-drag-r) {
  display: inline-flex !important;
  position: absolute !important;
  top: -30px !important;
  right: -2px !important;
  bottom: auto !important;
  left: auto !important;
  z-index: 10;
  background: #409eff !important;
  border-radius: 4px !important;
  padding: 0 !important;
  gap: 0 !important;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.25);
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}
/* 选中时显示按钮区 */
.tab-content :deep(._fd-drag-tool.active ._fd-drag-r) {
  opacity: 1;
  pointer-events: auto;
}
/* 单个按钮样式 */
.tab-content :deep(._fd-drag-tool ._fd-drag-r ._fd-drag-btn) {
  width: 30px !important;
  height: 26px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #fff !important;
  cursor: pointer;
  border: none;
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
}
.tab-content :deep(._fd-drag-tool ._fd-drag-r ._fd-drag-btn:hover) {
  background: rgba(255, 255, 255, 0.18) !important;
}
/* 图标颜色 */
.tab-content :deep(._fd-drag-tool ._fd-drag-r ._fd-drag-btn .fc-icon) {
  color: #fff !important;
  font-size: 14px !important;
}
/* 复制与删除按钮之间的竖线分隔符 */
.tab-content :deep(._fd-drag-tool ._fd-drag-r ._fd-drag-danger) {
  position: relative;
}
.tab-content :deep(._fd-drag-tool ._fd-drag-r ._fd-drag-danger)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 5px;
  bottom: 5px;
  width: 1px;
  background: rgba(255, 255, 255, 0.45);
}

/* ===== 右侧面板简化样式 ===== */
/* 隐藏右侧 Tab 头部划分条 */
.tab-content :deep(._fc-r) {
  background: #fff;
}
.tab-content :deep(._fc-r-tabs) {
  display: none !important;
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
</style>
