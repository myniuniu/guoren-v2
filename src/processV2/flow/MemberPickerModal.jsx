import { useMemo, useState } from 'react';
import { Modal, Input, Avatar, Checkbox, Empty, Tag } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import './MemberPickerModal.css';

/** 模拟成员列表（后续可替换为后端 /api/workflow/users 接口） */
const MOCK_MEMBERS = [
  { id: 'u1', name: '张三', dept: '技术部', avatar: '' },
  { id: 'u2', name: '李四', dept: '产品部', avatar: '' },
  { id: 'u3', name: '王五', dept: '设计部', avatar: '' },
  { id: 'u4', name: '赵六', dept: '技术部', avatar: '' },
  { id: 'u5', name: '孙七', dept: '财务部', avatar: '' },
  { id: 'u6', name: '周八', dept: '人力资源部', avatar: '' },
  { id: 'u7', name: '吴九', dept: '技术部', avatar: '' },
  { id: 'u8', name: '郑十', dept: '销售部', avatar: '' },
  { id: 'u9', name: '钱一', dept: '市场部', avatar: '' },
  { id: 'u10', name: '陈二', dept: '技术部', avatar: '' },
];

/**
 * 成员选择弹窗
 *
 * @param {boolean}   open        是否打开
 * @param {Array}     selected    当前已选成员列表：[{id,name,dept?}]
 * @param {Function}  onClose     关闭回调
 * @param {Function}  onConfirm   确认回调：(selectedMembers) => void
 * @param {number}    max         最多可选数量，默认 25
 */
export default function MemberPickerModal({
  open,
  selected = [],
  onClose,
  onConfirm,
  max = 25,
}) {
  const [keyword, setKeyword] = useState('');
  const [picked, setPicked] = useState(selected || []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return MOCK_MEMBERS;
    return MOCK_MEMBERS.filter(
      (m) =>
        m.name.toLowerCase().includes(kw) ||
        (m.dept || '').toLowerCase().includes(kw),
    );
  }, [keyword]);

  const isPicked = (id) => picked.some((p) => p.id === id);

  const togglePick = (member) => {
    if (isPicked(member.id)) {
      setPicked((prev) => prev.filter((p) => p.id !== member.id));
      return;
    }
    if (picked.length >= max) {
      return;
    }
    setPicked((prev) => [...prev, member]);
  };

  const handleRemove = (id) => {
    setPicked((prev) => prev.filter((p) => p.id !== id));
  };

  const handleOk = () => {
    if (onConfirm) onConfirm(picked);
    if (onClose) onClose();
  };

  return (
    <Modal
      title="成员选择"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="确定"
      cancelText="取消"
      width={520}
      zIndex={1300}
      destroyOnClose
    >
      <div className="member-picker">
        {/* 搜索栏 */}
        <div className="member-picker-search">
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="搜索成员姓名或部门"
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {/* 主体：左列表 + 右已选 */}
        <div className="member-picker-body">
          {/* 左：成员列表 */}
          <div className="member-picker-list">
            <div className="member-picker-subtitle">成员列表（{filtered.length}）</div>
            <div className="member-picker-scroll">
              {filtered.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配成员" />
              ) : (
                filtered.map((m) => {
                  const checked = isPicked(m.id);
                  const disabled = !checked && picked.length >= max;
                  return (
                    <div
                      key={m.id}
                      className={`member-picker-item ${disabled ? 'disabled' : ''}`}
                      onClick={() => !disabled && togglePick(m)}
                    >
                      <Checkbox checked={checked} disabled={disabled} />
                      <Avatar
                        size={28}
                        icon={<UserOutlined />}
                        src={m.avatar || undefined}
                        className="member-picker-avatar"
                      />
                      <div className="member-picker-info">
                        <div className="member-picker-name">{m.name}</div>
                        <div className="member-picker-dept">{m.dept}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 右：已选 */}
          <div className="member-picker-chosen">
            <div className="member-picker-subtitle">
              已选（<span className="member-picker-count">{picked.length}/{max}</span>）
            </div>
            <div className="member-picker-chosen-list">
              {picked.length === 0 ? (
                <div className="member-picker-empty">暂未选择</div>
              ) : (
                picked.map((p) => (
                  <Tag
                    key={p.id}
                    closable
                    onClose={(e) => {
                      e.preventDefault();
                      handleRemove(p.id);
                    }}
                  >
                    <Avatar
                      size={18}
                      icon={<UserOutlined />}
                      src={p.avatar || undefined}
                      style={{ marginRight: 4, verticalAlign: 'middle' }}
                    />
                    {p.name}
                    {p.dept && <span style={{ color: '#999', marginLeft: 4 }}>· {p.dept}</span>}
                  </Tag>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
