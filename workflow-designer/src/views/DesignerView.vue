<template>
  <div class="designer-view">
    <div class="designer-toolbar">
      <el-button v-if="!isEmbedded" @click="goBack" icon="ArrowLeft">返回列表</el-button>
      <span class="toolbar-title">BPMN 流程设计器</span>
      <div v-if="isEmbedded" class="toolbar-info">
        <el-tag v-if="processInfo" type="info" size="small">
          {{ processInfo.name }} v{{ processInfo.version }}
        </el-tag>
      </div>
      <div class="toolbar-actions">
        <el-button type="primary" @click="handleSave" :loading="saving" :disabled="!modelerReady">
          保存并部署
        </el-button>
      </div>
    </div>
    <div class="designer-container">
      <iframe
        ref="designerIframe"
        :src="designerSrc"
        class="designer-iframe"
        @load="onIframeLoad"
      />
      <div v-if="!modelerReady" class="designer-loading">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <span>正在加载设计器...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { processApi, type ProcessDefinitionVO } from '../api'

const router = useRouter()
const route = useRoute()
const designerIframe = ref<HTMLIFrameElement>()
const modelerReady = ref(false)
const saving = ref(false)
const processInfo = ref<ProcessDefinitionVO | null>(null)

const isEmbedded = route.name === 'EmbeddedDesigner'
const editDeploymentId = route.query.deploymentId as string
const processKey = route.query.processKey as string
const designerSrc = '/designer/index.html?v=' + Date.now()

// --- postMessage communication ---
const pendingRequests = new Map<string, { resolve: Function; reject: Function; timer: ReturnType<typeof setTimeout> }>()

function sendCommand(type: string, data: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const timer = setTimeout(() => {
      pendingRequests.delete(id)
      reject(new Error('操作超时'))
    }, 10000)
    pendingRequests.set(id, { resolve, reject, timer })
    designerIframe.value?.contentWindow?.postMessage({ type, id, ...data }, '*')
  })
}

function handleMessage(event: MessageEvent) {
  const { type, id, xml, success, error } = event.data || {}

  // Handle modeler-ready notification
  if (type === 'modeler-ready') {
    if (modelerReady.value) return // dedupe duplicate ready events
    modelerReady.value = true
    console.log('[DesignerView] BPMN modeler is ready')
    // If editing, load existing XML
    if (editDeploymentId) {
      loadExistingXml(editDeploymentId)
    } else if (processKey) {
      loadProcessByKey(processKey)
    }
    return
  }

  // Handle responses to commands
  if (id && pendingRequests.has(id)) {
    const { resolve, reject, timer } = pendingRequests.get(id)!
    clearTimeout(timer)
    pendingRequests.delete(id)

    if (type === 'save-result') {
      if (xml) resolve(xml)
      else reject(new Error(error || '保存XML失败'))
    } else if (type === 'import-result') {
      if (success) resolve(true)
      else reject(new Error(error || '导入XML失败'))
    } else {
      resolve(event.data)
    }
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

const onIframeLoad = () => {
  console.log('[DesignerView] iframe loaded')
  // modeler-ready will be sent by the bridge script once bpmnModeler is available
}

const loadExistingXml = async (deploymentId: string) => {
  try {
    const res = await processApi.getXml(deploymentId)
    const xml = res.data
    if (xml) {
      await sendCommand('import-xml', { xml })
      ElMessage.success('流程加载成功')
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
    processInfo.value = pd
    await loadExistingXml(pd.deploymentId)
  } catch (err) {
    console.error('根据key加载流程失败', err)
    ElMessage.warning('加载流程失败，将使用空白画布')
  }
}

const goBack = () => {
  router.push('/process-list')
}

const handleSave = async () => {
  if (!modelerReady.value) {
    ElMessage.warning('设计器尚未加载完成')
    return
  }

  try {
    saving.value = true
    const xml = await sendCommand('save-xml')
    if (!xml) {
      ElMessage.error('获取流程XML失败')
      return
    }

    // Extract process name from XML
    const nameMatch = xml.match(/name="([^"]+)"/)
    const processName = nameMatch ? nameMatch[1] : '未命名流程'

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
    ElMessage.success('流程部署成功！')
    // 通知父窗口刷新列表（如果在 iframe 中嵌入）
    try {
      window.parent && window.parent.postMessage({ type: 'process-deployed' }, '*')
    } catch { /* ignore */ }
    if (isEmbedded) {
      // 嵌入式模式：刷新流程信息（版本号等）
      if (processKey) {
        try {
          const res = await processApi.getByKey(processKey)
          processInfo.value = res.data
        } catch { /* ignore */ }
      }
    } else {
      router.push('/process-list')
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error('部署失败: ' + (err.message || '未知错误'))
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.designer-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.designer-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  gap: 12px;
}

.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-actions {
  margin-left: auto;
}

.designer-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.designer-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.designer-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.85);
  color: #909399;
  font-size: 14px;
  z-index: 10;
}
</style>
