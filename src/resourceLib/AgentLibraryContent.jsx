import { useMemo, useState } from 'react';
import { Dropdown, Empty } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { getFileTypeLabel, renderFileIcon } from './resourceIcons.jsx';

export function AgentLibraryPreview({ item, standalone = false }) {
  return (
    <div className="finder-preview-body has-document-preview">
      <article className={`finder-preview-document ${standalone ? 'is-standalone-content' : ''}`}>
        {!standalone && <>
          <h1>{item.name}</h1>
          <div className="finder-preview-document-meta"><span>{getFileTypeLabel(item.fileType)}</span><span>{item.time}</span></div>
        </>}
        <section className="finder-preview-document-callout">
          <p>来源智能体：{item.source}</p>
          <p>所属库：{item.scope}</p>
        </section>
        {item.contentText && <section className="finder-preview-document-section"><p>{item.contentText}</p></section>}
      </article>
    </div>
  );
}

export default function AgentLibraryContent({
  rows,
  viewMode = 'detail',
  visibleCols = ['date', 'size', 'kind'],
  detailColWidths = { date: 120, size: 80, kind: 80 },
  nameColResized = false,
  columnDefinitions = [
    { key: 'date', label: '修改日期', sortable: true },
    { key: 'size', label: '大小', sortable: true },
    { key: 'kind', label: '种类', sortable: true },
  ],
  sortBy = 'name',
  sortOrder = 'asc',
  sortItems = (items) => items,
  onHeaderSort,
  onColumnResize,
  onColumnDragStart,
  onColumnDragOver,
  onColumnDrop,
  onColumnDragEnd,
  columnVisibilityMenu,
  renderCell,
  onOpen,
  onSave,
}) {
  const [selectedKey, setSelectedKey] = useState(null);
  const sortedRows = useMemo(() => sortItems(rows), [rows, sortItems]);
  const selectedItem = rows.find((item) => item.key === selectedKey);
  const nameStyle = nameColResized
    ? { width: detailColWidths.name, flex: 'none' }
    : { flex: 1, minWidth: 200 };
  const metaWidth = visibleCols.reduce((sum, key) => sum + (detailColWidths[key] || 100), 0);
  const menuFor = (item) => ({
    items: [
      { key: 'preview', label: '查看详情' },
      { key: 'save', label: '另存到资料库' },
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === 'preview') onOpen(item);
      if (key === 'save') onSave(item);
    },
  });
  const renderActions = (item, isColumn = false) => (
    <span
      className={isColumn ? 'finder-column-item-actions' : 'finder-file-row-actions'}
      style={isColumn ? undefined : { right: metaWidth + 32 }}
      onClick={(event) => event.stopPropagation()}
    >
      <Dropdown menu={menuFor(item)} trigger={['click']} overlayClassName="finder-liquid-glass-menu">
        <button type="button" className="finder-column-action-btn" aria-label={`更多操作：${item.name}`}>
          <MoreOutlined style={{ fontSize: 14 }} />
        </button>
      </Dropdown>
    </span>
  );
  const emptyState = (
    <div className="finder-empty">
      <Empty description="暂无匹配的智能体产物" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </div>
  );

  return (
    <div className={`finder-content-view finder-content-view-${viewMode}`}>
      {viewMode === 'column' ? (
        <div className="finder-column-scroll">
          <div className="finder-column">
            {sortedRows.length === 0 ? <div className="finder-column-empty">暂无匹配的智能体产物</div> : sortedRows.map((item) => (
              <Dropdown key={item.key} menu={menuFor(item)} trigger={['contextMenu']} overlayClassName="finder-liquid-glass-menu">
                <div
                  className={`finder-column-item ${selectedKey === item.key ? 'finder-column-item-active' : ''}`}
                  role="button"
                  tabIndex={0}
                  title={`${item.name}\n${item.source} · ${item.scope}`}
                  onClick={() => setSelectedKey(item.key)}
                  onDoubleClick={() => onOpen(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') onOpen(item);
                    if (event.key === ' ') { event.preventDefault(); setSelectedKey(item.key); }
                  }}
                >
                  <span className="finder-column-item-icon">{renderFileIcon(item.fileType, { fontSize: 16 })}</span>
                  <span className="finder-column-item-name">{item.name}</span>
                  {renderActions(item, true)}
                </div>
              </Dropdown>
            ))}
          </div>
          <div className="finder-column-preview">
            {selectedItem ? (
              <div className="finder-preview-content">
                <AgentLibraryPreview item={selectedItem} />
              </div>
            ) : <div className="finder-preview-empty">选择一个文件以查看预览</div>}
          </div>
        </div>
      ) : (
        <div className="finder-file-list">
          <Dropdown menu={columnVisibilityMenu} trigger={['contextMenu']} overlayClassName="finder-liquid-glass-menu">
            <div className="finder-detail-header">
              <span
                className={`finder-detail-col-name finder-detail-col-sortable ${sortBy === 'name' ? 'finder-detail-col-active' : ''}`}
                style={nameStyle}
                onClick={() => onHeaderSort?.('name')}
              >
                名称{sortBy === 'name' && <span className="finder-detail-col-arrow">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                <span className="finder-detail-col-resize-handle" onMouseDown={(event) => onColumnResize?.('name', event)} onClick={(event) => event.stopPropagation()} />
              </span>
              {visibleCols.map((key) => {
                const definition = columnDefinitions.find((column) => column.key === key);
                return (
                  <span
                    key={key}
                    className={`finder-detail-col-${key} ${definition?.sortable ? 'finder-detail-col-sortable' : ''} ${sortBy === key ? 'finder-detail-col-active' : ''}`}
                    style={{ width: detailColWidths[key] }}
                    draggable
                    onClick={() => definition?.sortable && onHeaderSort?.(key)}
                    onDragStart={(event) => onColumnDragStart?.(key, event)}
                    onDragOver={(event) => onColumnDragOver?.(key, event)}
                    onDrop={(event) => onColumnDrop?.(key, event)}
                    onDragEnd={onColumnDragEnd}
                  >
                    {definition?.label || key}{sortBy === key && <span className="finder-detail-col-arrow">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                    <span className="finder-detail-col-resize-handle" onMouseDown={(event) => onColumnResize?.(key, event)} onClick={(event) => event.stopPropagation()} />
                  </span>
                );
              })}
            </div>
          </Dropdown>
          {sortedRows.length === 0 ? emptyState : sortedRows.map((item) => (
            <Dropdown key={item.key} menu={menuFor(item)} trigger={['contextMenu']} overlayClassName="finder-liquid-glass-menu">
              <div
                className={`finder-file-row finder-file-row-detail ${selectedKey === item.key ? 'finder-file-row-selected' : ''}`}
                role="button"
                tabIndex={0}
                title={`${item.name}\n${item.source} · ${item.scope}`}
                onClick={() => setSelectedKey(item.key)}
                onDoubleClick={() => onOpen(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onOpen(item);
                  if (event.key === ' ') { event.preventDefault(); setSelectedKey(item.key); }
                }}
              >
                <span className="finder-detail-expand-icon" />
                <span className="finder-file-icon">{renderFileIcon(item.fileType, { fontSize: 18 })}</span>
                <span className="finder-file-name" style={nameStyle}>{item.name}</span>
                {renderActions(item)}
                {visibleCols.map((key) => (
                  <span key={key} className={`finder-detail-col-${key}`} style={{ width: detailColWidths[key] }}>
                    {renderCell?.(key, item) || '--'}
                  </span>
                ))}
              </div>
            </Dropdown>
          ))}
        </div>
      )}
    </div>
  );
}
