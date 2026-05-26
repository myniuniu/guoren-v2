import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeleteOutlined } from '@ant-design/icons';
import FieldRenderer from './FieldRenderer';

function SortableField({ field, isSelected, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { source: 'canvas' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-field${isSelected ? ' selected' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect(field); }}
      {...attributes}
      {...listeners}
    >
      <FieldRenderer field={field} />
      <span className="canvas-field-delete" onClick={(e) => { e.stopPropagation(); onRemove(field.id); }}>
        <DeleteOutlined />
      </span>
    </div>
  );
}

export default function FormCanvas({ fields, selectedId, onSelect, onRemove }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop' });

  return (
    <div className="form-canvas-outer">
      <div
        ref={setNodeRef}
        className={`form-canvas-phone${isOver ? ' drag-over' : ''}`}
        onClick={() => onSelect(null)}
      >
        {fields.length === 0 && (
          <div className="canvas-empty">
            <span>将左侧组件拖入此处</span>
          </div>
        )}
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.map((field) => (
            <SortableField
              key={field.id}
              field={field}
              isSelected={selectedId === field.id}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
