import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { FIELD_GROUPS } from './fieldDefs';

function DraggableItem({ type, label, icon }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `menu-${type}`,
    data: { type, label, icon, source: 'menu' },
  });

  return (
    <div
      ref={setNodeRef}
      className="menu-item"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...listeners}
      {...attributes}
    >
      <span className="menu-item-icon">{icon}</span>
      <span className="menu-item-label">{label}</span>
    </div>
  );
}

export default function ComponentMenu() {
  return (
    <div className="component-menu">
      <div className="menu-title">组件</div>
      {FIELD_GROUPS.map((group) => (
        <div key={group.name} className="menu-group">
          <div className="menu-group-title">{group.title}</div>
          <div className="menu-group-list">
            {group.fields.map((f) => (
              <DraggableItem key={f.type} type={f.type} label={f.label} icon={f.icon} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
