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
      <div v-show="activeTab === 'settings'" class="tab-content form-settings-tab">
        <!-- 左侧菜单 -->
        <div class="fs-sidebar">
          <div
            v-for="item in settingsMenus"
            :key="item.key"
            class="fs-menu-item"
            :class="{ active: settingsActiveMenu === item.key }"
            @click="settingsActiveMenu = item.key"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </div>
        </div>
        <!-- 右侧内容 -->
        <div class="fs-content">
          <!-- 提交校验 -->
          <div v-if="settingsActiveMenu === 'submitValidation'">
            <div class="fs-content-title">提交校验</div>
            <div class="fs-empty-state">
              <div class="fs-empty-icon">
                <el-icon :size="64" color="#dcdfe6"><DocumentChecked /></el-icon>
              </div>
              <div class="fs-empty-text">暂无提交校验</div>
              <div class="fs-empty-desc">在提交表单时，满足校验规则的数据将不允许提交</div>
              <el-button type="danger" size="small" @click="validationDialogVisible = true">立即设置</el-button>
            </div>
          </div>
          <!-- 动态校验 -->
          <div v-if="settingsActiveMenu === 'dynamicValidation'">
            <div class="dv-header">
              <span class="dv-title">动态校验</span>
              <el-button v-if="dynamicRules.length > 0" type="danger" size="small" @click="addDynamicRule">新增规则</el-button>
            </div>
            <div class="dv-notice">
              说明：在提交表单时满足以下校验规则的数据将不允许提交，多条规则之间请避免输入互斥条件，以免校验出错
            </div>
            <div v-if="dynamicRules.length === 0" class="fs-empty-state">
              <div class="fs-empty-icon">
                <el-icon :size="64" color="#dcdfe6"><Edit /></el-icon>
              </div>
              <div class="fs-empty-text">暂无动态校验</div>
              <div class="fs-empty-desc">根据表单字段值动态控制其他字段的显示/隐藏/必填等</div>
              <el-button type="danger" size="small" @click="addDynamicRule">立即设置</el-button>
            </div>
            <div v-else class="dv-rule-list">
              <div v-for="(rule, idx) in dynamicRules" :key="idx" class="dv-rule-item">
                <div class="dv-rule-index">{{ idx + 1 }}</div>
                <div class="dv-rule-content">
                  <div><b>触发事件:</b> {{ rule.trigger }}</div>
                  <div><b>校验信息:</b> {{ rule.message }}</div>
                  <div><b>关联表单:</b> {{ rule.relatedForm }}</div>
                  <div><b>备注:</b> {{ rule.remark }}</div>
                </div>
                <div class="dv-rule-actions">
                  <el-switch v-model="rule.enabled" />
                </div>
              </div>
            </div>
          </div>
          <!-- 业务规则 -->
          <div v-if="settingsActiveMenu === 'businessRules'">
            <div class="fs-content-title">业务规则</div>
            <div class="fs-empty-state">
              <div class="fs-empty-icon">
                <el-icon :size="64" color="#dcdfe6"><Setting /></el-icon>
              </div>
              <div class="fs-empty-text">暂无业务规则</div>
              <div class="fs-empty-desc">配置表单数据的业务逻辑规则</div>
              <el-button type="danger" size="small" @click="businessRuleDialogVisible = true">立即设置</el-button>
            </div>
          </div>
          <!-- 消息提醒 -->
          <div v-if="settingsActiveMenu === 'notification'">
            <div class="fs-content-title">消息提醒</div>
            <div class="fs-empty-state">
              <div class="fs-empty-icon">
                <el-icon :size="64" color="#dcdfe6"><Bell /></el-icon>
              </div>
              <div class="fs-empty-text">暂无消息提醒</div>
              <div class="fs-empty-desc">配置流程节点的消息通知规则</div>
              <el-button type="danger" size="small">立即设置</el-button>
            </div>
          </div>
          <!-- 关联列表 -->
          <div v-if="settingsActiveMenu === 'relatedList'">
            <div class="fs-content-title">关联列表</div>
            <div class="fs-empty-state">
              <div class="fs-empty-icon">
                <el-icon :size="64" color="#dcdfe6"><Connection /></el-icon>
              </div>
              <div class="fs-empty-text">暂无关联列表</div>
              <div class="fs-empty-desc">配置与其他表单的关联关系</div>
              <el-button type="danger" size="small">立即设置</el-button>
            </div>
          </div>
          <!-- 打印模板 -->
          <div v-if="settingsActiveMenu === 'printTemplate'">
            <div class="fs-content-title">打印模板</div>
            <div class="fs-empty-state">
              <div class="fs-empty-icon">
                <el-icon :size="64" color="#dcdfe6"><Printer /></el-icon>
              </div>
              <div class="fs-empty-text">暂无打印模板</div>
              <div class="fs-empty-desc">配置表单数据的打印输出模板</div>
              <el-button type="danger" size="small">立即设置</el-button>
            </div>
          </div>
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

    <!-- 业务规则配置弹窗 -->
    <el-dialog
      v-model="businessRuleDialogVisible"
      title="业务规则配置"
      width="720px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="dvr-dialog-body">
        <div class="dvr-tip">
          "流程启动"是指表单提交时就触发，"流程完成"是指流程审批完成时触发，"流程作废"是指流程被驳回、被撤销时触发。<br/>
          "明细表"的操作类型只支持仅插入数据和仅删除数据。
        </div>
        <el-form label-width="90px" label-position="left">
          <el-form-item label="触发事件" required>
            <el-select v-model="businessRuleForm.trigger" placeholder="请选择触发事件" style="width:100%">
              <el-option label="流程启动" value="流程启动" />
              <el-option label="流程完成" value="流程完成" />
              <el-option label="流程作废" value="流程作废" />
            </el-select>
          </el-form-item>
          <el-form-item label="目标表单" required>
            <el-select v-model="businessRuleForm.targetForm" placeholder="请选择" style="width:100%">
              <el-option
                v-for="f in validationFields"
                :key="f.field"
                :label="f.title"
                :value="f.field"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="操作类型" required>
            <el-select v-model="businessRuleForm.operationType" placeholder="请选择操作类型" style="width:100%">
              <el-option label="仅更新数据" value="仅更新数据" />
              <el-option label="仅插入数据" value="仅插入数据" />
              <el-option label="更新和插入数据" value="更新和插入数据" />
              <el-option label="仅删除数据" value="仅删除数据" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button type="danger" @click="saveBusinessRule">确 定</el-button>
        <el-button @click="businessRuleDialogVisible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 动态校验规则配置弹窗 -->
    <el-dialog
      v-model="dynamicRuleDialogVisible"
      title="动态校验规则配置"
      width="720px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="dvr-dialog-body">
        <div class="dvr-tip">
          "流程启动时"是指表单提交时就触发，"流程审批时"是指流程审批提交时触发。
        </div>
        <el-form label-width="90px" label-position="left">
          <el-form-item label="触发事件" required>
            <el-select v-model="dynamicRuleForm.trigger" placeholder="请选择触发事件" style="width:100%">
              <el-option label="流程启动时" value="流程启动时" />
              <el-option label="流程审批时" value="流程审批时" />
            </el-select>
          </el-form-item>
          <el-form-item label="提示信息" required>
            <el-input v-model="dynamicRuleForm.message" placeholder="请输入提示信息" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="dynamicRuleForm.remark" placeholder="请输入备注" />
          </el-form-item>
          <el-form-item label="关联表单" required>
            <el-select v-model="dynamicRuleForm.relatedForm" placeholder="请选择关联表单" style="width:100%">
              <el-option
                v-for="f in validationFields"
                :key="f.field"
                :label="f.title"
                :value="f.title"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="dvr-condition-tip">
          添加校验条件，用于全局表单校验，校验结果为true时表单不允许提交。
        </div>
        <div class="dvr-add-condition" @click="addValidationCondition">
          <el-icon><Plus /></el-icon>
          <span>添加校验条件</span>
        </div>
        <div v-if="dynamicConditions.length > 0" class="dvr-conditions">
          <div v-for="(cond, idx) in dynamicConditions" :key="idx" class="dvr-condition-row">
            <el-select v-model="cond.logic" style="width:100px">
              <el-option label="并且" value="并且" />
              <el-option label="或者" value="或者" />
            </el-select>
            <el-select v-model="cond.field" placeholder="当前表单属性" style="flex:1">
              <el-option
                v-for="f in validationFields"
                :key="f.field"
                :label="f.title"
                :value="f.field"
              />
            </el-select>
            <span class="dvr-condition-label">值</span>
            <el-select v-model="cond.operator" style="width:120px">
              <el-option label="等于" value="等于" />
              <el-option label="不等于" value="不等于" />
              <el-option label="大于" value="大于" />
              <el-option label="小于" value="小于" />
              <el-option label="大于等于" value="大于等于" />
              <el-option label="小于等于" value="小于等于" />
              <el-option label="包含" value="包含" />
            </el-select>
            <el-select v-model="cond.target" placeholder="目标表单属性" style="flex:1">
              <el-option
                v-for="f in validationFields"
                :key="f.field"
                :label="f.title"
                :value="f.field"
              />
            </el-select>
            <el-icon class="dvr-condition-delete" @click="dynamicConditions.splice(idx, 1)"><Delete /></el-icon>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="danger" @click="saveDynamicRule">确 定</el-button>
        <el-button @click="dynamicRuleDialogVisible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 提交校验弹窗 -->
    <el-dialog
      v-model="validationDialogVisible"
      title="提交校验"
      width="900px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="validation-dialog-body">
        <!-- 左侧字段列表 -->
        <div class="vd-left">
          <div class="vd-left-header">当前表单</div>
          <div class="vd-field-list">
            <div
              v-for="f in validationFields"
              :key="f.field"
              class="vd-field-item"
              @click="insertFieldTag(f)"
            >
              {{ f.title }}
            </div>
          </div>
        </div>
        <!-- 右侧编辑器 -->
        <div class="vd-right">
          <div class="vd-formula-header">当满足以下条件时表单不允许提交</div>
          <div class="vd-formula-editor">
            <div class="vd-line-numbers"><span>1</span></div>
            <div
              class="vd-editor-area"
              ref="validationEditorRef"
              contenteditable="true"
              @input="onEditorInput"
              @keyup="saveSelection"
              @mouseup="saveSelection"
              @blur="saveSelection"
              @keydown.enter.prevent
            ></div>
          </div>
          <div class="vd-formula-actions">
            <el-popover placement="right-start" :width="280" trigger="click">
              <template #reference>
                <el-button size="small" type="danger" plain>插入函数</el-button>
              </template>
              <div class="func-popover">
                <el-input
                  v-model="funcFilterKeyword"
                  placeholder="输入关键字过滤"
                  size="small"
                  clearable
                  class="func-filter-input"
                />
                <div class="func-list">
                  <div
                    v-for="fn in filteredFuncList"
                    :key="fn"
                    class="func-list-item"
                    @click="insertFunction(fn)"
                  >{{ fn }}</div>
                </div>
              </div>
            </el-popover>
          </div>
          <div class="vd-formula-help">
            <ul>
              <li>请从左侧面板选择字段或选项</li>
              <li>支持英文模式下运算符(+, -, *, /, &gt;, &lt;, ==, !=, &lt;=, &gt;=)及函数</li>
              <li>参考场景：<br/>根据输入的数量和单价,自动计算出金额,则可将计算公式设置为:数量*单价</li>
            </ul>
          </div>
          <div class="vd-error-tip">
            <span class="vd-error-label">校验错误提示<span class="required">*</span></span>
            <el-input v-model="validationErrorMsg" placeholder="当表单不能提交时弹出的提示信息内容" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="danger" @click="saveValidationRule">确 定</el-button>
        <el-button @click="validationDialogVisible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Grid, Upload, Loading, Search, RefreshLeft, ArrowDown, Delete, Plus, Rank, Close, Refresh, Download, List, Printer, Operation, DocumentChecked, Edit, Setting, Bell, Connection } from '@element-plus/icons-vue'
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

// 注册轮播图组件到表单设计器
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

// ===== 表单设置 =====
const settingsActiveMenu = ref('submitValidation')
const settingsMenus = [
  { key: 'submitValidation', label: '提交校验', icon: DocumentChecked },
  { key: 'dynamicValidation', label: '动态校验', icon: Edit },
  { key: 'businessRules', label: '业务规则', icon: Setting },
  { key: 'notification', label: '消息提醒', icon: Bell },
  { key: 'relatedList', label: '关联列表', icon: Connection },
  { key: 'printTemplate', label: '打印模板', icon: Printer },
]

// ===== 业务规则 =====
const businessRuleDialogVisible = ref(false)
const businessRuleForm = reactive({
  trigger: '',
  targetForm: '',
  operationType: ''
})

function saveBusinessRule() {
  if (!businessRuleForm.trigger) {
    ElMessage.warning('请选择触发事件')
    return
  }
  if (!businessRuleForm.targetForm) {
    ElMessage.warning('请选择目标表单')
    return
  }
  if (!businessRuleForm.operationType) {
    ElMessage.warning('请选择操作类型')
    return
  }
  ElMessage.success('业务规则保存成功')
  businessRuleDialogVisible.value = false
}

// ===== 动态校验 =====
const dynamicRules = ref<Array<{ trigger: string; message: string; relatedForm: string; remark: string; enabled: boolean }>>([])
const dynamicRuleDialogVisible = ref(false)
const dynamicRuleForm = reactive({
  trigger: '',
  message: '',
  remark: '',
  relatedForm: ''
})

function addDynamicRule() {
  dynamicRuleForm.trigger = ''
  dynamicRuleForm.message = ''
  dynamicRuleForm.remark = ''
  dynamicRuleForm.relatedForm = ''
  dynamicRuleDialogVisible.value = true
}

const dynamicConditions = ref<Array<{ logic: string; field: string; operator: string; target: string }>>([])

function addValidationCondition() {
  dynamicConditions.value.push({
    logic: '并且',
    field: '',
    operator: '等于',
    target: ''
  })
}

function saveDynamicRule() {
  if (!dynamicRuleForm.trigger) {
    ElMessage.warning('请选择触发事件')
    return
  }
  if (!dynamicRuleForm.message) {
    ElMessage.warning('请输入提示信息')
    return
  }
  dynamicRules.value.push({
    trigger: dynamicRuleForm.trigger,
    message: dynamicRuleForm.message,
    relatedForm: dynamicRuleForm.relatedForm,
    remark: dynamicRuleForm.remark,
    enabled: true
  })
  dynamicRuleDialogVisible.value = false
}

// ===== 提交校验弹窗 =====
const validationDialogVisible = ref(false)
const validationErrorMsg = ref('')
const validationEditorRef = ref<HTMLElement | null>(null)
let savedRange: Range | null = null

// 保存光标位置（在编辑器失焦前调用）
function saveSelection() {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    const editor = validationEditorRef.value
    if (editor && editor.contains(range.commonAncestorContainer)) {
      savedRange = range.cloneRange()
    }
  }
}

// 恢复光标位置
function restoreSelection() {
  const editor = validationEditorRef.value
  if (!editor) return
  editor.focus()
  if (savedRange) {
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(savedRange)
    }
  } else {
    // 没有保存的位置，将光标放到末尾
    const sel = window.getSelection()
    if (sel) {
      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }
}

// 插入函数列表
const FUNC_LIST = [
  'IF', 'AND', 'OR', 'XOR', 'IFS', 'ABS', 'MAX', 'MIN', 'SUM', 'INT', 'MOD', 'PI',
  'ROUND', 'FLOOR', 'CEIL', 'SQRT', 'AVG', 'DEVSQ', 'AVEDEV', 'HARMEAN', 'LARGE',
  'UPPERMONEY', 'RAND', 'LAST', 'LEFT', 'RIGHT', 'LEN', 'LENGTH', 'ISEMPTY',
  'CONCATENATE', 'CHAR', 'UPPERFIRST', 'PADSTART', 'CAPITALIZE', 'ESCAPE',
  'TRUNCATE', 'BEFORELAST', 'SPLIT', 'TRIM', 'STRIPTAG', 'LINEBREAK',
  'STARTSWITH', 'ENDSWITH', 'CONTAINS', 'REPLACE', 'BASENAME', 'DATE',
  'TIMESTAMP', 'TODAY', 'NOW', 'WEEKDAY', 'WEEK', 'DATETOSTR', 'DATERANGESPLIT',
  'STARTOF', 'ENDOF', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'SECOND', 'YEARS',
  'MINUTES', 'DAYS', 'HOURS', 'DATEMODIFY', 'STRTODATE', 'ISBEFORE', 'ISAFTER',
  'BETWEENRANGE', 'ISSAMEORBEFORE', 'ISSAMEOAFTER', 'COUNT', 'ARRAYMAP',
  'ARRAYFILTER', 'ARRAYFINDINDEX', 'ARRAYFIND', 'ARRAYSOME', 'ARRAYEVERY',
  'ARRAYINCLUDES', 'COMPACT', 'JOIN', 'CONCAT', 'UNIQ', 'ENCODEJSON'
]
const funcFilterKeyword = ref('')
const filteredFuncList = computed(() => {
  const kw = funcFilterKeyword.value.trim().toUpperCase()
  if (!kw) return FUNC_LIST
  return FUNC_LIST.filter(fn => fn.includes(kw))
})

// 在光标位置插入内容
function insertAtCursor(html: string) {
  const editor = validationEditorRef.value
  if (!editor) return
  restoreSelection()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) {
    editor.innerHTML += html
    return
  }
  const range = sel.getRangeAt(0)
  range.deleteContents()
  const temp = document.createElement('div')
  temp.innerHTML = html
  const frag = document.createDocumentFragment()
  let lastNode: Node | null = null
  while (temp.firstChild) {
    lastNode = temp.firstChild
    frag.appendChild(lastNode)
  }
  range.insertNode(frag)
  if (lastNode) {
    range.setStartAfter(lastNode)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }
  savedRange = range.cloneRange()
}

function insertFunction(fn: string) {
  const funcHtml = `<span class="vd-func-tag" contenteditable="false">${fn}</span>`
  insertAtCursor(funcHtml + '()')
  // 将光标放到括号内
  const editor = validationEditorRef.value
  if (!editor) return
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    if (range.startContainer.nodeType === 3 && range.startOffset > 0) {
      range.setStart(range.startContainer, range.startOffset - 1)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }
}

function insertFieldTag(f: { field: string; title: string }) {
  const tagHtml = `<span class="vd-field-tag" contenteditable="false" data-field="${f.field}">${f.title}</span>\u200B`
  insertAtCursor(tagHtml)
}

function onEditorInput() {
  // 可以在这里做实时校验或同步
}

// 从表单设计器提取字段供校验弹窗使用
const validationFields = computed(() => {
  if (!designerRef.value) return []
  try {
    const rules = designerRef.value.getRule()
    return extractFields(rules || [])
  } catch {
    return []
  }
})

function saveValidationRule() {
  if (!validationErrorMsg.value.trim()) {
    ElMessage.warning('请填写校验错误提示')
    return
  }
  ElMessage.success('校验规则已保存')
  validationDialogVisible.value = false
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

/* ===== 表单设置 ===== */
.form-settings-tab {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.fs-sidebar {
  width: 140px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  padding: 8px 0;
  flex-shrink: 0;
  overflow-y: auto;
}

.fs-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.fs-menu-item:hover {
  color: #303133;
  background: #f5f7fa;
}

.fs-menu-item.active {
  color: #f56c6c;
  border-left-color: #f56c6c;
  background: #fff5f5;
}

.fs-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  background: #fafafa;
}

.fs-content-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 24px;
}

.fs-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
  gap: 12px;
}

.fs-empty-icon {
  margin-bottom: 8px;
}

.fs-empty-text {
  font-size: 15px;
  color: #909399;
}

.fs-empty-desc {
  font-size: 13px;
  color: #c0c4cc;
  margin-bottom: 8px;
}

/* ===== 提交校验弹窗 ===== */
/* ===== 动态校验 =====*/
.dv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.dv-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.dv-notice {
  font-size: 12px;
  color: #909399;
  background: #fef0f0;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.dv-rule-list {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.dv-rule-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.dv-rule-item:last-child {
  border-bottom: none;
}

.dv-rule-index {
  width: 32px;
  font-size: 14px;
  color: #909399;
  flex-shrink: 0;
  padding-top: 2px;
}

.dv-rule-content {
  flex: 1;
  font-size: 13px;
  color: #303133;
  line-height: 1.8;
}

.dv-rule-content b {
  font-weight: 500;
}

.dv-rule-actions {
  flex-shrink: 0;
  padding-left: 16px;
}

/* 动态校验规则弹窗 */
.dvr-dialog-body {
  padding: 0 10px;
}

.dvr-tip {
  font-size: 13px;
  color: #606266;
  margin-bottom: 20px;
  line-height: 1.6;
}

.dvr-condition-tip {
  font-size: 13px;
  color: #909399;
  margin-top: 16px;
  margin-bottom: 8px;
}

.dvr-add-condition {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #f56c6c;
  cursor: pointer;
  margin-bottom: 10px;
}

.dvr-add-condition:hover {
  color: #e04040;
}

.dvr-conditions {
  margin-top: 12px;
}

.dvr-condition-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.dvr-condition-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.dvr-condition-delete {
  font-size: 18px;
  color: #909399;
  cursor: pointer;
  flex-shrink: 0;
}

.dvr-condition-delete:hover {
  color: #f56c6c;
}

.validation-dialog-body {
  display: flex;
  min-height: 400px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.vd-left {
  width: 180px;
  border-right: 1px solid #e8e8e8;
  background: #fafafa;
  flex-shrink: 0;
  overflow-y: auto;
}

.vd-left-header {
  padding: 12px 16px;
  font-size: 14px;
  color: #606266;
  border-bottom: 1px solid #e8e8e8;
}

.vd-field-list {
  padding: 4px 0;
}

.vd-field-item {
  padding: 8px 16px;
  font-size: 13px;
  color: #303133;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.15s;
}

.vd-field-item:hover {
  background: #f0f0f0;
  border-left-color: #f56c6c;
  color: #f56c6c;
}

.vd-right {
  flex: 1;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vd-formula-header {
  font-size: 13px;
  color: #909399;
  background: #fef0f0;
  padding: 8px 12px;
  border-radius: 4px;
}

.vd-formula-editor {
  display: flex;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 120px;
  background: #fff;
}

.vd-line-numbers {
  width: 32px;
  background: #f5f7fa;
  border-right: 1px solid #e8e8e8;
  padding: 8px 0;
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
  flex-shrink: 0;
}

.vd-editor-area {
  flex: 1;
  padding: 8px 12px;
  min-height: 100px;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  outline: none;
  cursor: text;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 字段标签样式 (contenteditable 中的不可编辑元素) */
:deep(.vd-field-tag) {
  display: inline-block;
  padding: 1px 8px;
  background: #fef0f0;
  border: 1px solid #f56c6c;
  border-radius: 3px;
  color: #f56c6c;
  font-size: 12px;
  line-height: 20px;
  margin: 0 2px;
  vertical-align: middle;
  user-select: all;
}

:deep(.vd-func-tag) {
  display: inline-block;
  padding: 1px 6px;
  background: #fff5f5;
  border-radius: 3px;
  color: #f56c6c;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  margin: 0 1px;
  vertical-align: middle;
  user-select: all;
}

.vd-formula-actions {
  display: flex;
  justify-content: flex-end;
}

.vd-formula-help {
  font-size: 12px;
  color: #909399;
}

.vd-formula-help ul {
  margin: 0;
  padding-left: 16px;
  line-height: 1.8;
}

.vd-error-tip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #e8e8e8;
}

.vd-error-label {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
}

.vd-error-label .required {
  color: #f56c6c;
  margin-left: 2px;
}

/* 插入函数 Popover */
.func-popover {
  display: flex;
  flex-direction: column;
}

.func-filter-input {
  margin-bottom: 8px;
}

.func-list {
  max-height: 400px;
  overflow-y: auto;
}

.func-list-item {
  padding: 8px 12px;
  font-size: 14px;
  color: #303133;
  cursor: pointer;
  transition: background 0.15s;
}

.func-list-item:hover {
  background: #f0f0f5;
}
</style>
