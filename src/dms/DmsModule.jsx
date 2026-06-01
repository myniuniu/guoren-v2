import { useState, useCallback, useEffect } from 'react';
import { FileTextOutlined, FireOutlined } from '@ant-design/icons';
import { message, Tabs, Tag, Badge, Empty } from 'antd';
import DmsDocumentList from './DmsDocumentList';
import DmsDocumentForm from './DmsDocumentForm';
import DmsDocumentDetail from './DmsDocumentDetail';
import CategoryTree from './CategoryTree';
import DmsTodoPage from './DmsTodoPage';
import { dmsApi, dmsTagApi, dmsWorkflowApi } from './api';
import './DmsModule.css';

// 暂用本地常量（与 archive 模块一致风格）
const CURRENT_USER = 'admin';

/**
 * DMS 文档管理模块外壳：
 *  - 顶部 Tabs：文档库 / 我的待办（含 Badge）
 *  - 文档库：左 CategoryTree + 中列表 + 左下「热门标签」过滤
 *  - 待办：DmsTodoPage（复用 DmsApprovalModal）
 */
export default function DmsModule() {
  const [activeTab, setActiveTab] = useState('docs');

  // 当前选中的分类，null 表示全部
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  // 当前选中的标签（来自热门标签云），null 表示不限
  const [activeTagName, setActiveTagName] = useState(null);

  // 列表 / 待办 刷新计数器
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [todoFlag, setTodoFlag] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshFlag((n) => n + 1), []);

  // 表单弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formInitial, setFormInitial] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // 详情抽屉
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // 热门标签
  const [hotTags, setHotTags] = useState([]);
  const loadHotTags = useCallback(async () => {
    try {
      const list = await dmsTagApi.list('usage');
      setHotTags((list || []).slice(0, 12));
    } catch {
      // 静默
    }
  }, []);
  useEffect(() => {
    loadHotTags();
  }, [loadHotTags, refreshFlag]);

  // 待办数量 Badge
  const [pendingCount, setPendingCount] = useState(0);
  const loadPendingCount = useCallback(async () => {
    try {
      const list = await dmsWorkflowApi.pending(CURRENT_USER);
      setPendingCount((list || []).length);
    } catch {
      // 静默
    }
  }, []);
  useEffect(() => {
    loadPendingCount();
  }, [loadPendingCount, todoFlag, refreshFlag]);

  const openCreate = () => {
    setFormMode('create');
    setFormInitial({ categoryId: activeCategoryId || null });
    setFormOpen(true);
  };

  const openEdit = async (record) => {
    setFormMode('edit');
    try {
      const d = await dmsApi.detail(record.id);
      setFormInitial(d || record);
      setFormOpen(true);
    } catch {
      message.error('加载详情失败');
    }
  };

  const openDetail = async (record) => {
    try {
      const d = await dmsApi.detail(record.id);
      setDetailData(d);
      setDetailOpen(true);
    } catch {
      message.error('加载详情失败');
    }
  };

  const refreshDetail = async () => {
    if (!detailData?.id) return;
    try {
      const d = await dmsApi.detail(detailData.id);
      setDetailData(d);
    } catch {
      // 静默
    }
  };

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (formMode === 'edit' && formInitial?.id) {
        await dmsApi.update(formInitial.id, { ...data, createBy: CURRENT_USER });
        message.success('已更新');
      } else {
        await dmsApi.create({
          ...data,
          categoryId: data.categoryId ?? activeCategoryId ?? null,
          createBy: CURRENT_USER,
        });
        message.success('已创建');
      }
      setFormOpen(false);
      triggerRefresh();
    } catch (e) {
      message.error('保存失败：' + (e?.response?.data?.message || e?.message || ''));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDetailEdit = (data) => {
    setDetailOpen(false);
    setFormMode('edit');
    setFormInitial(data);
    setFormOpen(true);
  };

  const docTabContent = (
    <div className="dms-body">
      {/* 左侧分类树 + 热门标签 */}
      <aside className="dms-sider">
        <CategoryTree
          selectedId={activeCategoryId}
          onSelect={setActiveCategoryId}
          refreshKey={refreshFlag}
        />

        <div className="dms-sider-tagcloud">
          <div className="dms-sider-section-title">
            <FireOutlined style={{ marginRight: 4, color: '#fa541c' }} />
            热门标签
          </div>
          {hotTags.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无标签"
              style={{ marginTop: 8 }}
            />
          ) : (
            <div className="dms-sider-tag-list">
              {hotTags.map((t) => {
                const active = activeTagName === t.name;
                return (
                  <Tag.CheckableTag
                    key={t.id || t.name}
                    checked={active}
                    onChange={(checked) =>
                      setActiveTagName(checked ? t.name : null)
                    }
                  >
                    {t.name}
                    {t.usageCount ? (
                      <span className="dms-tag-count"> · {t.usageCount}</span>
                    ) : null}
                  </Tag.CheckableTag>
                );
              })}
              {activeTagName && (
                <a
                  className="dms-tag-clear"
                  onClick={() => setActiveTagName(null)}
                >
                  清除筛选
                </a>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* 中部主区 */}
      <main className="dms-main">
        <DmsDocumentList
          categoryId={activeCategoryId}
          tagName={activeTagName}
          refreshFlag={refreshFlag}
          currentUser={CURRENT_USER}
          onCreate={openCreate}
          onView={openDetail}
          onEdit={openEdit}
          onChanged={triggerRefresh}
        />
      </main>
    </div>
  );

  return (
    <div className="dms-module">
      <div className="dms-header">
        <div className="dms-header-title">
          <FileTextOutlined style={{ marginRight: 8 }} />
          文档管理 (DMS)
        </div>
        <div style={{ color: '#8a8f99', fontSize: 12 }}>
          v2 · 分类 / 版本 / 审批 / 标签
        </div>
      </div>

      <div className="dms-tabs-wrap">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'docs',
              label: '文档库',
              children: docTabContent,
            },
            {
              key: 'todo',
              label: (
                <span>
                  我的待办
                  <Badge
                    count={pendingCount}
                    style={{ marginLeft: 6 }}
                    overflowCount={99}
                  />
                </span>
              ),
              children: (
                <DmsTodoPage
                  currentUser={CURRENT_USER}
                  refreshFlag={todoFlag}
                  onChanged={() => {
                    setTodoFlag((n) => n + 1);
                    triggerRefresh();
                  }}
                  onView={openDetail}
                />
              ),
            },
          ]}
        />
      </div>

      <DmsDocumentForm
        open={formOpen}
        mode={formMode}
        initialData={formInitial}
        loading={formLoading}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <DmsDocumentDetail
        open={detailOpen}
        data={detailData}
        currentUser={CURRENT_USER}
        onClose={() => setDetailOpen(false)}
        onEdit={handleDetailEdit}
        onChanged={async () => {
          await refreshDetail();
          triggerRefresh();
          setTodoFlag((n) => n + 1);
        }}
      />
    </div>
  );
}
