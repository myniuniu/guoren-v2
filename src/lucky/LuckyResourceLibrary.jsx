import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Empty, Input, Modal, Select, Tag, message } from 'antd';
import { DownloadOutlined, EllipsisOutlined, LeftOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import ResourceLibrarySaveModal from '../resourceLib/ResourceLibrarySaveModal.jsx';
import AgentLibraryContent, { AgentLibraryPreview } from '../resourceLib/AgentLibraryContent.jsx';
import { inferFileType } from '../resourceLib/resourceLibStore';
import { LIBRARY_ROWS, SOURCE_OPTIONS, SCOPE_OPTIONS } from './luckyResourceLibraryData';
import './LuckyResourceLibrary.css';

const PAGE_SIZE = 14;

export default function LuckyResourceLibrary({
  embedded = false, searchKeyword, source, libraryScope, onSaved, finderProps = {},
}) {
  const [localSourceFilter, setSourceFilter] = useState('all');
  const [localScopeFilter, setScopeFilter] = useState('all');
  const sourceFilter = source ?? localSourceFilter;
  const scopeFilter = libraryScope ?? localScopeFilter;
  const [localKeyword, setKeyword] = useState('');
  const keyword = searchKeyword ?? localKeyword;
  const [pageSelection, setPageSelection] = useState({ filterKey: '', page: 1 });
  const filterKey = JSON.stringify([sourceFilter, scopeFilter, keyword.trim().toLowerCase()]);
  const currentPage = pageSelection.filterKey === filterKey ? pageSelection.page : 1;
  const setCurrentPage = (page) => setPageSelection({ filterKey, page });
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savingItem, setSavingItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const previewBackRef = useRef(null);
  useEffect(() => {
    if (!embedded || !previewItem) return;
    document.documentElement.classList.add('finder-preview-page-open');
    previewBackRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPreviewItem(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.documentElement.classList.remove('finder-preview-page-open');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [embedded, previewItem]);
  const handleOpenSaveModal = (item) => {
    setSavingItem(item);
    setSaveModalOpen(true);
  };

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return LIBRARY_ROWS.filter((item) => {
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      if (scopeFilter !== 'all' && item.scope !== scopeFilter) return false;
      if (!normalizedKeyword) return true;
      return `${item.title} ${item.source} ${item.type}`.toLowerCase().includes(normalizedKeyword);
    });
  }, [keyword, scopeFilter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const pagedRows = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [activePage, filteredRows]);

  const finderRows = useMemo(() => filteredRows.map((item) => ({
    ...item,
    key: item.id,
    name: item.title,
    fileType: inferFileType(item.title),
    lastEdit: item.time,
    createdAt: item.time,
    comment: `${item.source} · ${item.scope}`,
    isFolder: false,
  })), [filteredRows]);

  return (
    <>
      {embedded ? (
        <AgentLibraryContent
          {...finderProps}
          rows={finderRows}
          onOpen={setPreviewItem}
          onSave={handleOpenSaveModal}
        />
      ) : (
      <div className="lucky-workspace-card lucky-library-view">
        <div className="lucky-page-header">
          <div>
            <div className="lucky-page-title">资源库</div>
          </div>
          <div className="lucky-toolbar">
            <Select
              aria-label="来源智能体"
              value={sourceFilter}
              options={SOURCE_OPTIONS}
              className="lucky-select"
              onChange={(value) => {
                setSourceFilter(value);
                setCurrentPage(1);
              }}
            />
            <Select
              aria-label="资源所属库"
              value={scopeFilter}
              options={SCOPE_OPTIONS}
              className="lucky-select"
              onChange={(value) => {
                setScopeFilter(value);
                setCurrentPage(1);
              }}
            />
            {!embedded && <Input
              allowClear
              value={keyword}
              className="lucky-search"
              placeholder="搜索"
              prefix={<SearchOutlined />}
              onChange={(event) => {
                setKeyword(event.target.value);
                setCurrentPage(1);
              }}
            />}
          </div>
        </div>

        <div className="lucky-library-table-scroll">
          <div className="lucky-library-table">
            <div className="lucky-library-row lucky-library-row-header">
              <div className="lucky-library-cell col-name">名称</div>
              <div className="lucky-library-cell col-source">来源</div>
              <div className="lucky-library-cell col-type">类型</div>
              <div className="lucky-library-cell col-time">时间</div>
              <div className="lucky-library-cell col-view">查看</div>
              <div className="lucky-library-cell col-action">操作</div>
            </div>

            {filteredRows.length === 0 && <Empty description="暂无匹配的智能体产物" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            {pagedRows.map((item) => (
              <div key={item.id} className="lucky-library-row">
                <div className="lucky-library-cell col-name lucky-library-name" title={item.title}>
                  {item.title}
                </div>
                <div className="lucky-library-cell col-source">{item.source}</div>
                <div className="lucky-library-cell col-type">
                  <Tag className={`lucky-type-tag ${item.type === '文档' ? 'is-document' : ''}`}>
                    {item.type}
                  </Tag>
                </div>
                <div className="lucky-library-cell col-time">{item.time}</div>
                <div className="lucky-library-cell col-view">
                  <button
                    type="button"
                    className="lucky-link-button"
                    onClick={() => setPreviewItem(item)}
                  >
                    查看详情
                  </button>
                </div>
                <div className="lucky-library-cell col-action">
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        {
                          key: 'save-to-library',
                          label: '另存到资料库',
                        },
                      ],
                      onClick: ({ key }) => {
                        if (key === 'save-to-library') handleOpenSaveModal(item);
                      },
                    }}
                    placement="bottomRight"
                  >
                    <Button
                      type="text"
                      size="small"
                      className="lucky-row-action"
                      aria-label={`操作：${item.title}`}
                      icon={<EllipsisOutlined />}
                    />
                  </Dropdown>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lucky-table-footer">
          <div className="lucky-table-meta">
            第 {activePage} / {totalPages} 页
          </div>
          <div className="lucky-pagination">
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  type="button"
                  className={`lucky-page-btn ${page === activePage ? 'is-active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              type="button"
              className="lucky-page-btn lucky-page-next"
              disabled={activePage >= totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
      )}
      <ResourceLibrarySaveModal
        open={saveModalOpen}
        item={savingItem}
        onClose={() => {
          setSaveModalOpen(false);
          setSavingItem(null);
        }}
        onSaved={(result) => {
          onSaved?.(result);
          const { libraryName, name } = result;
          message.success(`已将「${name}」另存到${libraryName}`);
        }}
      />
      {embedded ? previewItem && (
        <div className="finder-preview-modal-backdrop" role="presentation">
          <section className="finder-preview-modal" role="dialog" aria-modal="true" aria-labelledby="finder-agent-preview-title">
            <header className="finder-preview-modal-header">
              <div className="finder-preview-modal-navigation">
                <button ref={previewBackRef} type="button" className="finder-preview-modal-back" aria-label="返回智能体产物" onClick={() => setPreviewItem(null)}>
                  <LeftOutlined />
                </button>
                <div className="finder-preview-modal-breadcrumb">
                  <button type="button" onClick={() => setPreviewItem(null)}>智能体</button>
                  <span className="finder-preview-modal-breadcrumb-segment is-current"><RightOutlined /><strong>{previewItem.name}</strong></span>
                </div>
              </div>
              <div className="finder-preview-modal-actions">
                <button type="button" className="finder-preview-modal-action" title="另存到资料库" aria-label="另存到资料库" onClick={() => handleOpenSaveModal(previewItem)}>
                  <DownloadOutlined />
                </button>
              </div>
            </header>
            <div className="finder-preview-modal-body">
              <div className="finder-preview-page-content">
                <h1 id="finder-agent-preview-title">{previewItem.name}</h1>
                <div className="finder-preview-page-meta">
                  <span>{previewItem.source}</span><span>{previewItem.scope}</span><span>{previewItem.time}</span>
                </div>
                <div className="finder-preview-page-canvas">
                  <div className="finder-preview-content"><AgentLibraryPreview item={previewItem} standalone /></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : <Modal
        open={Boolean(previewItem)}
        title="智能体产物详情"
        footer={null}
        onCancel={() => setPreviewItem(null)}
      >
        {previewItem && (
          <dl className="lucky-resource-details">
            <dt>名称</dt><dd>{previewItem.title}</dd>
            <dt>来源智能体</dt><dd>{previewItem.source}</dd>
            <dt>类型</dt><dd>{previewItem.type}</dd>
            <dt>所属库</dt><dd>{previewItem.scope}</dd>
            <dt>生成时间</dt><dd>{previewItem.time}</dd>
          </dl>
        )}
      </Modal>}
    </>
  );
}
