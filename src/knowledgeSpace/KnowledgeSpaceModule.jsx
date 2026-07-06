import { useState } from 'react';
import {
  CloseOutlined,
  PlusOutlined,
  PushpinFilled,
  PushpinOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import './KnowledgeSpaceModule.css';

const knowledgeSpaces = [
  { id: 'ai-literacy', title: '人工智能通识课', color: 'lemon', pinned: true, coverId: 'space-stars' },
  { id: 'haha-123', title: '哈哈哈123', color: 'rose', pinned: true, coverId: 'galaxy' },
  { id: 'class-evaluation', title: '课堂评价', color: 'rose', pinned: false, coverId: 'blue-lines' },
  { id: 'research-math', title: '教研-数学', color: 'rose', pinned: false, coverId: 'green-lines' },
  { id: 'higher-education', title: '高教-教研', color: 'lemon', pinned: false, coverId: 'sphere' },
  { id: 'basic-education', title: '基教-教研', color: 'sky', pinned: false, coverId: 'navy-stripes' },
  { id: 'space-teaching', title: '知识空间-教学', color: 'lavender', pinned: false, coverId: 'sky-grid' },
  { id: 'space-001', title: '知识空间001', color: 'honey', pinned: false, coverId: 'desk-light' },
];

const candidateMembers = [
  { id: 'hya', name: 'hya', avatar: 'h', tone: 'blue' },
  { id: 'wangwu', name: 'wangwu', avatar: 'w', tone: 'blue' },
  { id: 'czh', name: 'czh', avatar: 'c', tone: 'blue' },
  { id: 'jin', name: '金林峰', avatar: '金', tone: 'blue' },
  { id: 'zhang', name: '张洪磊', avatar: '张', tone: 'blue' },
  { id: 'guoren', name: '国人通', avatar: '国', tone: 'purple' },
];

const permissionRoleTabs = [
  { key: 'admin', label: '管理员', addLabel: '添加管理员', defaultPermission: '可管理', pickerRole: '空间管理员' },
  { key: 'editor', label: '可编辑的成员', addLabel: '添加成员', defaultPermission: '可编辑', pickerRole: '可编辑成员' },
  { key: 'reader', label: '可阅读的成员', addLabel: '添加成员', defaultPermission: '可阅读', pickerRole: '可阅读成员' },
];

const permissionUsers = [
  { id: 'zhang', name: '张洪磊', group: '架构组', role: 'admin' },
];

const spaceColorCycle = ['lemon', 'rose', 'sky', 'lavender', 'honey'];
const coverCategories = [
  { key: 'all', label: '全部' },
  { key: 'color', label: '色彩' },
  { key: 'office', label: '办公' },
  { key: 'tech', label: '科技' },
  { key: 'scene', label: '风景' },
];

const coverOptions = [
  { id: 'purple', category: 'color', background: 'linear-gradient(135deg, #8338ec 0%, #7c3aed 100%)' },
  { id: 'office-green', category: 'office', background: 'linear-gradient(135deg, #63d653 0%, #54c848 100%)' },
  { id: 'blue-lines', category: 'tech', background: 'linear-gradient(145deg, #0f2f58 0%, #143e73 48%, #09111f 100%), repeating-linear-gradient(130deg, rgba(120, 185, 255, 0.32) 0 1px, transparent 1px 16px)' },
  { id: 'horizon', category: 'scene', background: 'linear-gradient(180deg, #050914 0%, #0d1b2a 55%, #bcc8d0 56%, #6b7280 100%)' },
  { id: 'sphere', category: 'tech', background: 'radial-gradient(circle at 62% 66%, rgba(234, 243, 255, 0.72) 0 12%, transparent 13%), radial-gradient(circle at 62% 66%, rgba(36, 54, 79, 0.82) 0 28%, transparent 29%), linear-gradient(135deg, #010813 0%, #0e2035 100%)' },
  { id: 'black-wave', category: 'tech', background: 'radial-gradient(circle at 80% 10%, rgba(40, 83, 125, 0.45), transparent 38%), linear-gradient(135deg, #02040a 0%, #111827 100%)' },
  { id: 'sky-grid', category: 'office', background: 'linear-gradient(90deg, rgba(77, 163, 221, 0.18) 1px, transparent 1px), linear-gradient(180deg, rgba(77, 163, 221, 0.18) 1px, transparent 1px), linear-gradient(135deg, #f0fbff 0%, #d7eef7 100%)', backgroundSize: '14px 14px, 14px 14px, auto' },
  { id: 'earth', category: 'scene', background: 'radial-gradient(ellipse at 50% 96%, #d9a441 0 7%, #1f2937 8% 35%, transparent 36%), linear-gradient(180deg, #02030a 0%, #09111e 100%)' },
  { id: 'galaxy', category: 'scene', background: 'radial-gradient(ellipse at 64% 45%, rgba(86, 135, 214, 0.8), transparent 16%), radial-gradient(ellipse at 43% 54%, rgba(245, 230, 190, 0.7), transparent 11%), radial-gradient(circle at 22% 18%, #ffffff 0 1px, transparent 2px), radial-gradient(circle at 74% 30%, #ffffff 0 1px, transparent 2px), linear-gradient(135deg, #030712 0%, #0e2342 45%, #030712 100%)' },
  { id: 'space-stars', category: 'scene', background: 'radial-gradient(circle at 34% 20%, #ffffff 0 1px, transparent 2px), radial-gradient(circle at 76% 18%, #ffffff 0 1px, transparent 2px), radial-gradient(circle at 62% 72%, rgba(255, 214, 165, 0.82), transparent 10%), radial-gradient(ellipse at 52% 56%, rgba(118, 167, 255, 0.64), transparent 16%), linear-gradient(135deg, #030712 0%, #09162d 55%, #020617 100%)' },
  { id: 'green-lines', category: 'tech', background: 'repeating-linear-gradient(100deg, rgba(34, 197, 94, 0.45) 0 2px, transparent 2px 8px), linear-gradient(135deg, #03100a 0%, #092514 100%)' },
  { id: 'desk-light', category: 'office', background: 'radial-gradient(ellipse at 58% 82%, rgba(255, 122, 24, 0.7), transparent 18%), linear-gradient(180deg, #020617 0%, #0f172a 78%, #fdba74 100%)' },
  { id: 'navy-stripes', category: 'tech', background: 'repeating-linear-gradient(145deg, rgba(91, 141, 204, 0.24) 0 2px, transparent 2px 11px), linear-gradient(135deg, #061120 0%, #0c2a44 100%)' },
  { id: 'paper', category: 'office', background: 'radial-gradient(circle at 72% 62%, rgba(226, 232, 240, 0.74), transparent 24%), linear-gradient(135deg, #f8fafc 0%, #eceff4 100%)' },
  { id: 'blue-grid', category: 'tech', background: 'radial-gradient(circle at 28% 32%, rgba(56, 189, 248, 0.6), transparent 12%), repeating-linear-gradient(90deg, rgba(56, 189, 248, 0.16) 0 2px, transparent 2px 18px), linear-gradient(135deg, #020617 0%, #083344 100%)' },
  { id: 'black-neon', category: 'tech', background: 'linear-gradient(135deg, #020617 0%, #0f172a 72%, #000000 100%), linear-gradient(90deg, rgba(34, 211, 238, 0.4), transparent)' },
  { id: 'slate', category: 'color', background: 'linear-gradient(135deg, #475569 0%, #40534e 100%)' },
  { id: 'sunset', category: 'scene', background: 'linear-gradient(180deg, #172554 0%, #be185d 45%, #fb7185 100%)' },
  { id: 'soft-lines', category: 'office', background: 'repeating-radial-gradient(circle at 20% 20%, rgba(148, 163, 184, 0.24) 0 2px, transparent 2px 16px), linear-gradient(135deg, #f8fafc 0%, #e9eef7 100%)' },
  { id: 'sky-lines', category: 'scene', background: 'linear-gradient(135deg, #dbeafe 0%, #fff7ed 100%)' },
  { id: 'warm-gray', category: 'color', background: 'linear-gradient(135deg, #e7e5e4 0%, #d6d3d1 100%)' },
];

function getCoverById(coverId) {
  return coverOptions.find((item) => item.id === coverId) || coverOptions.find((item) => item.id === 'space-stars') || coverOptions[0];
}

function KnowledgeSpaceCard({ item, onOpenSettings }) {
  const PinIcon = item.pinned ? PushpinFilled : PushpinOutlined;
  const cover = item.cover || getCoverById(item.coverId);

  return (
    <article
      className={`ks-card ks-card-${item.color} ks-card-has-cover`}
      style={{
        background: cover.background,
        backgroundSize: cover.backgroundSize || 'cover',
      }}
    >
      <div className="ks-card-title" title={item.title}>{item.title}</div>
      <button
        type="button"
        className="ks-card-action"
        aria-label={item.pinned ? '取消置顶' : '置顶知识空间'}
        title={item.pinned ? '取消置顶' : '置顶知识空间'}
      >
        <PinIcon />
      </button>
      <button
        type="button"
        className="ks-card-drawer"
        onClick={() => onOpenSettings(item)}
      >
        知识空间设置
      </button>
    </article>
  );
}

function SectionTitle({ tone = 'blue', children }) {
  return (
    <div className="ks-section-title">
      <span className={`ks-section-mark ks-section-mark-${tone}`} />
      <span>{children}</span>
    </div>
  );
}

function CoverPicker({ cover, title, onCoverChange }) {
  const [category, setCategory] = useState('all');
  const activeCover = cover || getCoverById('space-stars');
  const visibleCovers = category === 'all'
    ? coverOptions
    : coverOptions.filter((item) => item.category === category);

  const randomizeCover = () => {
    const candidates = visibleCovers.length > 0 ? visibleCovers : coverOptions;
    const currentIndex = candidates.findIndex((item) => item.id === activeCover.id);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % candidates.length;
    onCoverChange(candidates[nextIndex]);
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      onCoverChange({
        id: `upload-${Date.now()}`,
        category: 'custom',
        background: `linear-gradient(180deg, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.16)), url("${reader.result}") center / cover no-repeat`,
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="ks-cover-setting">
      <div className="ks-cover-title">设置封面</div>
      <div className="ks-cover-panel">
        <div
          className="ks-cover-preview"
          style={{
            background: activeCover.background,
            backgroundSize: activeCover.backgroundSize || 'cover',
          }}
        >
          <span>{title?.trim() || '知识空间'}</span>
        </div>
        <div className="ks-cover-picker">
          <div className="ks-cover-toolbar">
            <div className="ks-cover-categories" role="tablist" aria-label="封面分类">
              {coverCategories.map((item) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={category === item.key}
                  className={`ks-cover-category ${category === item.key ? 'is-active' : ''}`}
                  key={item.key}
                  onClick={() => setCategory(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="ks-cover-actions">
              <button type="button" className="ks-cover-tool" onClick={randomizeCover}>
                <ReloadOutlined />
                <span>随机封面</span>
              </button>
              <label className="ks-cover-tool">
                <UploadOutlined />
                <span>上传</span>
                <input type="file" accept="image/*" onChange={handleUpload} />
              </label>
            </div>
          </div>
          <div className="ks-cover-grid">
            {visibleCovers.map((item) => (
              <button
                type="button"
                className={`ks-cover-swatch ${activeCover.id === item.id ? 'is-active' : ''}`}
                key={item.id}
                aria-label="选择封面"
                style={{
                  background: item.background,
                  backgroundSize: item.backgroundSize || 'cover',
                }}
                onClick={() => onCoverChange(item)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeSpaceCreateModal({
  cover,
  description,
  name,
  open,
  onCoverChange,
  onClose,
  onDescriptionChange,
  onNameChange,
  onSave,
}) {
  if (!open) return null;

  const saveDisabled = !name.trim();

  return (
    <div className="ks-modal-layer" role="presentation">
      <section className="ks-modal ks-create-modal" role="dialog" aria-modal="true" aria-labelledby="ks-create-modal-title">
        <header className="ks-modal-header">
          <h2 id="ks-create-modal-title">新建知识空间</h2>
          <button type="button" className="ks-modal-close" aria-label="关闭" onClick={onClose}>
            <CloseOutlined />
          </button>
        </header>

        <div className="ks-modal-tabs" role="tablist" aria-label="新建知识空间">
          <button
            type="button"
            role="tab"
            aria-selected="true"
            className="ks-modal-tab is-active"
          >
            基础信息
          </button>
        </div>

        <div className="ks-modal-body">
          <div className="ks-form">
            <label className="ks-field">
              <span className="ks-field-label">空间名称</span>
              <input
                autoFocus
                className="ks-text-input"
                value={name}
                placeholder="请输入知识空间名称"
                onChange={(event) => onNameChange(event.target.value)}
              />
            </label>
            <label className="ks-field">
              <span className="ks-field-label">空间简介</span>
              <textarea
                className="ks-textarea"
                value={description}
                placeholder="请输入知识空间简介"
                onChange={(event) => onDescriptionChange(event.target.value)}
              />
            </label>
            <CoverPicker cover={cover} title={name} onCoverChange={onCoverChange} />
          </div>
        </div>

        <footer className="ks-modal-footer">
          <button type="button" className="ks-save-btn" disabled={saveDisabled} onClick={onSave}>
            保存设置
          </button>
        </footer>
      </section>
    </div>
  );
}

function KnowledgeSpaceSettingsModal({
  activeTab,
  formCover,
  formDescription,
  formName,
  memberKeyword,
  open,
  onActiveTabChange,
  onClose,
  onCoverChange,
  onDescriptionChange,
  onMemberKeywordChange,
  onNameChange,
  onSave,
}) {
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState('recent');
  const [permissionRole, setPermissionRole] = useState('admin');
  const currentPermissionRole = permissionRoleTabs.find((item) => item.key === permissionRole) || permissionRoleTabs[0];
  const filteredCandidates = candidateMembers.filter((item) => {
    const keyword = memberKeyword.trim().toLowerCase();
    if (!keyword) return true;
    return item.name.toLowerCase().includes(keyword) || item.avatar.toLowerCase().includes(keyword);
  });
  const filteredPermissionUsers = permissionUsers.filter((item) => {
    const keyword = memberKeyword.trim().toLowerCase();
    if (item.role !== permissionRole) return false;
    if (!keyword) return true;
    return `${item.name} ${item.group}`.toLowerCase().includes(keyword);
  });

  if (!open) return null;

  return (
    <div className="ks-modal-layer" role="presentation">
      <section className="ks-modal" role="dialog" aria-modal="true" aria-labelledby="ks-modal-title">
        <header className="ks-modal-header">
          <h2 id="ks-modal-title">知识空间配置</h2>
          <button type="button" className="ks-modal-close" aria-label="关闭" onClick={onClose}>
            <CloseOutlined />
          </button>
        </header>

        <div className="ks-modal-tabs" role="tablist" aria-label="知识空间配置">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'basic'}
            className={`ks-modal-tab ${activeTab === 'basic' ? 'is-active' : ''}`}
            onClick={() => onActiveTabChange('basic')}
          >
            基础信息
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'members'}
            className={`ks-modal-tab ${activeTab === 'members' ? 'is-active' : ''}`}
            onClick={() => onActiveTabChange('members')}
          >
            成员设置
          </button>
        </div>

        <div className="ks-modal-body">
          {activeTab === 'basic' ? (
            <div className="ks-form">
              <label className="ks-field">
                <span className="ks-field-label">空间名称</span>
                <input
                  className="ks-text-input"
                  value={formName}
                  onChange={(event) => onNameChange(event.target.value)}
                />
              </label>
              <label className="ks-field">
                <span className="ks-field-label">空间简介</span>
                <textarea
                  className="ks-textarea"
                  value={formDescription}
                  placeholder="请输入知识空间简介"
                  onChange={(event) => onDescriptionChange(event.target.value)}
                />
              </label>
              <CoverPicker cover={formCover} title={formName} onCoverChange={onCoverChange} />
            </div>
          ) : (
            <div className="ks-members-panel">
              <div className="ks-permission-head">
                <div className="ks-permission-title">
                  <span>角色与权限</span>
                  <span className="ks-permission-help">?</span>
                </div>
                <div className="ks-existing-user-search">
                  <SearchOutlined />
                  <input
                    value={memberKeyword}
                    placeholder="搜索已有用户"
                    onChange={(event) => onMemberKeywordChange(event.target.value)}
                  />
                </div>
              </div>
              <div className="ks-permission-tabs" role="tablist" aria-label="角色与权限">
                {permissionRoleTabs.map((item) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={permissionRole === item.key}
                    className={`ks-permission-tab ${permissionRole === item.key ? 'is-active' : ''}`}
                    key={item.key}
                    onClick={() => setPermissionRole(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="ks-permission-toolbar">
                <div className="ks-default-permission">页面默认权限：{currentPermissionRole.defaultPermission}</div>
                <button type="button" className="ks-add-permission-member-btn" onClick={() => setMemberPickerOpen(true)}>
                  <PlusOutlined />
                  <span>{currentPermissionRole.addLabel}</span>
                </button>
              </div>
              <div className="ks-permission-user-list">
                {filteredPermissionUsers.map((member) => (
                  <div className="ks-permission-user-row" key={member.id}>
                    <span className="ks-permission-avatar" aria-hidden="true" />
                    <span className="ks-permission-user-info">
                      <span className="ks-permission-user-name">{member.name}</span>
                      <span className="ks-permission-user-group">{member.group}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {activeTab === 'basic' ? (
          <footer className="ks-modal-footer">
            <button type="button" className="ks-save-btn" onClick={onSave}>
              保存设置
            </button>
          </footer>
        ) : null}
        {memberPickerOpen ? (
          <div className="ks-member-picker-layer" role="presentation">
            <section className="ks-member-picker" role="dialog" aria-modal="true" aria-labelledby="ks-member-picker-title">
              <header className="ks-member-picker-header">
                <h3 id="ks-member-picker-title">选择成员</h3>
                <button
                  type="button"
                  className="ks-member-picker-close"
                  aria-label="关闭选择成员"
                  onClick={() => setMemberPickerOpen(false)}
                >
                  <CloseOutlined />
                </button>
              </header>
              <div className="ks-member-picker-main">
                <div className="ks-member-picker-left">
                  <div className="ks-member-picker-tabs" role="tablist" aria-label="成员来源">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={pickerTab === 'recent'}
                      className={`ks-member-picker-tab ${pickerTab === 'recent' ? 'is-active' : ''}`}
                      onClick={() => setPickerTab('recent')}
                    >
                      最近协作好友
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={pickerTab === 'org'}
                      className={`ks-member-picker-tab ${pickerTab === 'org' ? 'is-active' : ''}`}
                      onClick={() => setPickerTab('org')}
                    >
                      组织人员
                    </button>
                  </div>
                  <div className="ks-member-search">
                    <SearchOutlined />
                    <input
                      value={memberKeyword}
                      placeholder="搜索姓名、部门"
                      onChange={(event) => onMemberKeywordChange(event.target.value)}
                    />
                  </div>
                  <div className="ks-candidate-list">
                    {filteredCandidates.map((candidate) => (
                      <label className="ks-candidate-row" key={candidate.id}>
                        <input type="checkbox" checked disabled readOnly />
                        <span className={`ks-avatar ks-avatar-${candidate.tone}`}>{candidate.avatar}</span>
                        <span className="ks-candidate-name">{candidate.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <aside className="ks-member-picker-selected">
                  已选: 0人, 0个部门
                </aside>
              </div>
              <footer className="ks-member-picker-footer">
                <div className="ks-permission-line">
                  <span>以下成员将获得</span>
                  <strong className="ks-role-text">{currentPermissionRole.pickerRole}</strong>
                  <span>权限</span>
                </div>
                <button type="button" className="ks-member-confirm" disabled>
                  确 定
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function KnowledgeSpaceModule() {
  const [spaces, setSpaces] = useState(knowledgeSpaces);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createCover, setCreateCover] = useState(() => getCoverById('space-stars'));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCover, setFormCover] = useState(() => getCoverById('space-stars'));
  const [memberKeyword, setMemberKeyword] = useState('');
  const pinnedSpaces = spaces.filter((item) => item.pinned);

  const openSettings = (item) => {
    setSelectedSpace(item);
    setFormName(item.title);
    setFormDescription(item.description || '');
    setFormCover(item.cover || getCoverById(item.coverId));
    setActiveTab('basic');
    setMemberKeyword('');
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
  };

  const openCreateModal = () => {
    setCreateName('');
    setCreateDescription('');
    setCreateCover(getCoverById('space-stars'));
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
  };

  const saveCreateSpace = () => {
    const nextName = createName.trim();
    if (!nextName) return;

    setSpaces((currentSpaces) => {
      const color = spaceColorCycle[currentSpaces.length % spaceColorCycle.length];
      return [
        {
          id: `knowledge-space-${Date.now()}`,
          title: nextName,
          description: createDescription,
          color,
          cover: createCover,
          coverId: createCover.id,
          pinned: false,
        },
        ...currentSpaces,
      ];
    });
    closeCreateModal();
  };

  const saveSettings = () => {
    const nextName = formName.trim();
    if (selectedSpace?.id && nextName) {
      setSpaces((currentSpaces) => currentSpaces.map((item) => (
        item.id === selectedSpace.id
          ? { ...item, title: nextName, description: formDescription, cover: formCover, coverId: formCover.id }
          : item
      )));
      setSelectedSpace((current) => current ? {
        ...current,
        title: nextName,
        description: formDescription,
        cover: formCover,
        coverId: formCover.id,
      } : current);
    }
    closeSettings();
  };

  return (
    <main className="knowledge-space-module">
      <div className="ks-shell">
        <header className="ks-header">
          <h1>知识空间</h1>
        </header>

        <div className="ks-content">
          <button type="button" className="ks-create-card" onClick={openCreateModal}>
            <span className="ks-create-icon" aria-hidden="true">
              <PlusOutlined />
            </span>
            <span className="ks-create-copy">
              <span className="ks-create-title">新建知识空间</span>
              <span className="ks-create-subtitle">沉淀团队智慧，让知识创造价值</span>
            </span>
          </button>

          <section className="ks-section">
            <SectionTitle>置顶知识空间</SectionTitle>
            <div className="ks-grid ks-grid-pinned">
              {pinnedSpaces.map((item) => (
                <KnowledgeSpaceCard key={item.id} item={item} onOpenSettings={openSettings} />
              ))}
            </div>
          </section>

          <section className="ks-section ks-section-all">
            <SectionTitle tone="muted">全部知识空间 ({spaces.length})</SectionTitle>
            <div className="ks-grid">
              {spaces.map((item) => (
                <KnowledgeSpaceCard key={item.id} item={item} onOpenSettings={openSettings} />
              ))}
            </div>
          </section>
        </div>
      </div>
      <KnowledgeSpaceCreateModal
        cover={createCover}
        description={createDescription}
        name={createName}
        open={createOpen}
        onCoverChange={setCreateCover}
        onClose={closeCreateModal}
        onDescriptionChange={setCreateDescription}
        onNameChange={setCreateName}
        onSave={saveCreateSpace}
      />
      {settingsOpen ? (
        <KnowledgeSpaceSettingsModal
          activeTab={activeTab}
          formCover={formCover}
          formDescription={formDescription}
          formName={formName}
          memberKeyword={memberKeyword}
          open={settingsOpen}
          onActiveTabChange={setActiveTab}
          onClose={closeSettings}
          onCoverChange={setFormCover}
          onDescriptionChange={setFormDescription}
          onMemberKeywordChange={setMemberKeyword}
          onNameChange={setFormName}
          onSave={saveSettings}
        />
      ) : null}
    </main>
  );
}

export default KnowledgeSpaceModule;
