import { useState } from 'react';
import {
  CloseOutlined,
  PlusOutlined,
  PushpinFilled,
  PushpinOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import './KnowledgeSpaceModule.css';

const knowledgeSpaces = [
  { id: 'ai-literacy', title: '人工智能通识课', color: 'lemon', pinned: true },
  { id: 'haha-123', title: '哈哈哈123', color: 'rose', pinned: true },
  { id: 'class-evaluation', title: '课堂评价', color: 'rose', pinned: false },
  { id: 'research-math', title: '教研-数学', color: 'rose', pinned: false },
  { id: 'higher-education', title: '高教-教研', color: 'lemon', pinned: false },
  { id: 'basic-education', title: '基教-教研', color: 'sky', pinned: false },
  { id: 'space-teaching', title: '知识空间-教学', color: 'lavender', pinned: false },
  { id: 'space-001', title: '知识空间001', color: 'honey', pinned: false },
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

function KnowledgeSpaceCard({ item, onOpenSettings }) {
  const PinIcon = item.pinned ? PushpinFilled : PushpinOutlined;

  return (
    <article className={`ks-card ks-card-${item.color}`}>
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

function KnowledgeSpaceCreateModal({
  description,
  name,
  open,
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
  formDescription,
  formName,
  memberKeyword,
  open,
  onActiveTabChange,
  onClose,
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [memberKeyword, setMemberKeyword] = useState('');
  const pinnedSpaces = spaces.filter((item) => item.pinned);

  const openSettings = (item) => {
    setSelectedSpace(item);
    setFormName(item.title);
    setFormDescription(item.description || '');
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
          ? { ...item, title: nextName, description: formDescription }
          : item
      )));
      setSelectedSpace((current) => current ? {
        ...current,
        title: nextName,
        description: formDescription,
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
        description={createDescription}
        name={createName}
        open={createOpen}
        onClose={closeCreateModal}
        onDescriptionChange={setCreateDescription}
        onNameChange={setCreateName}
        onSave={saveCreateSpace}
      />
      {settingsOpen ? (
        <KnowledgeSpaceSettingsModal
          activeTab={activeTab}
          formDescription={formDescription}
          formName={formName}
          memberKeyword={memberKeyword}
          open={settingsOpen}
          onActiveTabChange={setActiveTab}
          onClose={closeSettings}
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
