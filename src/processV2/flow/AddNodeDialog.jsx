import React from 'react';
import { Modal } from 'antd';

const NODE_OPTIONS = [
  { type: 'approval', icon: '审', color: '#ff8c41', name: '审批人', desc: '由指定的成员对申请进行审批' },
  { type: 'cc', icon: '抄', color: '#36cfc9', name: '抄送人', desc: '将申请通知给指定的成员' },
  { type: 'condition', icon: '条', color: '#722ed1', name: '条件分支', desc: '根据不同条件流转到不同分支' },
];

export default function AddNodeDialog({ open, onClose, onConfirm }) {
  return (
    <Modal title="添加节点" open={open} onCancel={onClose} footer={null} width={420} zIndex={1200}>
      <div className="pdv2-add-list">
        {NODE_OPTIONS.map((opt) => (
          <div key={opt.type} className="pdv2-add-item" onClick={() => onConfirm(opt.type)}>
            <div className="pdv2-add-icon" style={{ background: opt.color }}>{opt.icon}</div>
            <div className="pdv2-add-info">
              <div className="pdv2-add-name">{opt.name}</div>
              <div className="pdv2-add-desc">{opt.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
