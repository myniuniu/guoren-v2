import { Button } from 'antd';
import { PlusOutlined, StarFilled, StarOutlined } from '@ant-design/icons';

export default function ResourceLibraryTagPicker({
  item,
  tagDefs,
  quickTagDefs,
  tagGroups,
  activeGroupFilter,
  listScrollActive,
  onGroupFilterChange,
  onListScroll,
  onToggleItemTagSelection,
  onQuickTagToggle,
  onCreateTag,
}) {
  const itemKey = item?.key || null;
  const itemTagIds = item?.tags || [];
  const activeTagGroup = activeGroupFilter === 'all'
    ? null
    : tagGroups.find((group) => group.id === activeGroupFilter) || null;
  const activeTagGroupTagIds = activeTagGroup ? new Set(activeTagGroup.tagIds || []) : null;
  const visibleQuickTagDefs = activeTagGroupTagIds
    ? quickTagDefs.filter((tag) => activeTagGroupTagIds.has(tag.id))
    : quickTagDefs;
  const visibleTagDefs = activeTagGroupTagIds
    ? tagDefs.filter((tag) => activeTagGroupTagIds.has(tag.id))
    : tagDefs;
  const selectedTags = itemTagIds.map((tagId) => (
    tagDefs.find((tag) => tag.id === tagId)
    || { id: tagId, name: tagId, color: '#8e8e93' }
  ));

  return (
    <div className="rl-tag-picker">
      <div className="rl-tag-picker-title">编辑标签</div>
      <div className="rl-tag-picker-selected">
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <span key={tag.id} className="rl-tag-picker-token">
              <span className="rl-tag-dot" style={{ background: tag.color }} />
              <span>{tag.name}</span>
            </span>
          ))
        ) : (
          <span className="rl-tag-picker-placeholder">选择或新建标签</span>
        )}
      </div>
      {tagGroups.length > 0 && (
        <>
          <div className="rl-tag-picker-section-title rl-tag-picker-section-title-filter">按标签组筛选</div>
          <div className="rl-tag-picker-group-list">
            <button
              type="button"
              className={`rl-tag-picker-group-chip ${activeGroupFilter === 'all' ? 'rl-tag-picker-group-chip-active' : ''}`}
              onClick={() => onGroupFilterChange('all')}
            >
              全部
            </button>
            {tagGroups.map((group) => {
              const matchCount = tagDefs.filter((tag) => (group.tagIds || []).includes(tag.id)).length;
              return (
                <button
                  key={group.id}
                  type="button"
                  className={`rl-tag-picker-group-chip ${activeGroupFilter === group.id ? 'rl-tag-picker-group-chip-active' : ''}`}
                  onClick={() => onGroupFilterChange(group.id)}
                >
                  <span className="rl-tag-picker-group-chip-dot" style={{ background: group.color || '#1677ff' }} />
                  <span>{group.name}</span>
                  <span className="rl-tag-picker-group-chip-count">{matchCount}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
      <div className="rl-tag-picker-section-title">快捷标签</div>
      <div className="rl-tag-picker-quick-hint">设为快捷标签后，会显示在当前资料库的文件菜单顶部，方便快速打标。</div>
      {visibleQuickTagDefs.length > 0 ? (
        <div className="rl-tag-picker-quick-list">
          {visibleQuickTagDefs.map((tag) => {
            const checked = itemTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                className={`rl-tag-picker-quick-chip ${checked ? 'rl-tag-picker-quick-chip-active' : ''}`}
                onClick={() => {
                  if (!itemKey) return;
                  onToggleItemTagSelection(itemKey, tag.id, checked);
                }}
              >
                <span className="rl-tag-dot" style={{ background: tag.color }} />
                <span>{tag.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rl-tag-picker-quick-empty">
          {activeTagGroup
            ? `标签组「${activeTagGroup.name}」下暂无快捷标签。`
            : '将常用标签设为快捷标签后，这里可以一键给文件打标签。'}
        </div>
      )}
      <div className="rl-tag-picker-section-title">全部标签</div>
      <div
        className={`rl-tag-picker-list ${listScrollActive ? 'rl-tag-picker-list-scroll-active' : ''}`}
        onScroll={onListScroll}
      >
        {visibleTagDefs.length > 0 ? (
          visibleTagDefs.map((tag) => {
            const checked = itemTagIds.includes(tag.id);
            return (
              <div
                key={tag.id}
                className={`rl-tag-picker-row ${checked ? 'rl-tag-picker-row-checked' : ''}`}
                onClick={() => {
                  if (!itemKey) return;
                  onToggleItemTagSelection(itemKey, tag.id, checked);
                }}
              >
                <span className="rl-tag-dot" style={{ background: tag.color }} />
                <span className="rl-tag-picker-row-name">{tag.name}</span>
                <button
                  type="button"
                  className={`rl-tag-picker-row-quick-btn ${tag.quick ? 'rl-tag-picker-row-quick-btn-active' : ''}`}
                  title={tag.quick ? '取消快捷标签' : '设为快捷标签'}
                  aria-label={tag.quick ? `取消快捷标签：${tag.name}` : `设为快捷标签：${tag.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onQuickTagToggle(tag.id, !tag.quick);
                  }}
                >
                  {tag.quick ? <StarFilled /> : <StarOutlined />}
                </button>
                {checked && <span className="rl-tag-picker-row-check">✓</span>}
              </div>
            );
          })
        ) : (
          <div className="rl-tag-picker-empty">
            {activeTagGroup
              ? `标签组「${activeTagGroup.name}」下暂无可选标签。`
              : '当前资料库暂无可选标签。'}
          </div>
        )}
      </div>
      <div className="rl-tag-picker-actions">
        <Button size="small" icon={<PlusOutlined />} onClick={onCreateTag}>
          新建标签
        </Button>
      </div>
    </div>
  );
}
