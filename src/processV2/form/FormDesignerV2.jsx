import React, { useState, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import ComponentMenu from './ComponentMenu';
import FormCanvas from './FormCanvas';
import PropertyPanel from './PropertyPanel';
import { createFieldSchema } from './fieldDefs';
import './FormDesignerV2.css';

export default function FormDesignerV2({ value = [], onChange }) {
  const [fields, setFieldsRaw] = useState(value || []);
  const [selectedId, setSelectedId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const setFields = useCallback((newFields) => {
    const arr = typeof newFields === 'function' ? newFields(fields) : newFields;
    setFieldsRaw(arr);
    onChange && onChange(arr);
  }, [fields, onChange]);

  const selectedField = fields.find((f) => f.id === selectedId) || null;
  const handleSelect = useCallback((field) => { setSelectedId(field ? field.id : null); }, []);
  const handleRemove = useCallback((fieldId) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    if (selectedId === fieldId) setSelectedId(null);
  }, [selectedId, setFields]);
  const handlePropertyChange = useCallback((updatedField) => {
    setFields((prev) => prev.map((f) => (f.id === updatedField.id ? updatedField : f)));
  }, [setFields]);

  const handleDragStart = useCallback((event) => {
    const data = event.active.data?.current;
    if (data?.source === 'menu') {
      setActiveItem({ label: data.label, icon: data.icon });
    } else {
      const f = fields.find((x) => x.id === event.active.id);
      setActiveItem(f ? { label: f.label, icon: '' } : null);
    }
  }, [fields]);

  const handleDragEnd = useCallback((event) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data?.current;
    if (activeData?.source === 'menu') {
      const newField = createFieldSchema(activeData.type);
      if (over.id === 'canvas-drop') {
        setFields((prev) => [...prev, newField]);
      } else {
        setFields((prev) => {
          const idx = prev.findIndex((f) => f.id === over.id);
          if (idx >= 0) { const a = [...prev]; a.splice(idx, 0, newField); return a; }
          return [...prev, newField];
        });
      }
      setSelectedId(newField.id);
      return;
    }
    if (activeData?.source === 'canvas' && active.id !== over.id && over.id !== 'canvas-drop') {
      setFields((prev) => {
        const oldIdx = prev.findIndex((f) => f.id === active.id);
        const newIdx = prev.findIndex((f) => f.id === over.id);
        if (oldIdx < 0 || newIdx < 0) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }, [setFields]);

  return (
    <div className="form-designer-v2">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <ComponentMenu />
        <FormCanvas fields={fields} selectedId={selectedId} onSelect={handleSelect} onRemove={handleRemove} />
        <PropertyPanel field={selectedField} onChange={handlePropertyChange} />
        <DragOverlay dropAnimation={null}>
          {activeItem ? (
            <div className="menu-item" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: '#fff' }}>
              <span className="menu-item-icon">{activeItem.icon}</span>
              <span className="menu-item-label">{activeItem.label}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
