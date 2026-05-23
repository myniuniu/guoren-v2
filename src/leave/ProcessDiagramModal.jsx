import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Modal, Spin, message, Space, Tag, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { leaveModuleApi } from './api';
import './ProcessDiagramModal.css';

// 设计器静态资源地址（vue-bpmn-designer 编译产物）
const DESIGNER_URL = 'http://localhost:5176/designer/index.html';

/**
 * 流程图查看 Modal：iframe 嵌入 vue-bpmn-designer，实例化后高亮已完成 / 进行中节点
 */
export default function ProcessDiagramModal({ open, processInstanceId, onClose }) {
  const iframeRef = useRef(null);
  const pendingRequests = useRef(new Map());
  const [modelerReady, setModelerReady] = useState(false);
  const [diagram, setDiagram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);

  // ============ postMessage 通信 ============
  const sendCommand = useCallback((type, payload = {}) => {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const timer = setTimeout(() => {
        pendingRequests.current.delete(id);
        reject(new Error(type + ' 操作超时'));
      }, 10000);
      pendingRequests.current.set(id, { resolve, reject, timer });
      iframeRef.current?.contentWindow?.postMessage({ type, id, ...payload }, '*');
    });
  }, []);

  useEffect(() => {
    const handler = (event) => {
      const data = event.data || {};
      const { type, id } = data;
      if (type === 'modeler-ready') {
        setModelerReady(true);
        return;
      }
      if (id && pendingRequests.current.has(id)) {
        const { resolve, reject, timer } = pendingRequests.current.get(id);
        clearTimeout(timer);
        pendingRequests.current.delete(id);
        if (data.success === false) {
          reject(new Error(data.error || type + ' 失败'));
        } else if (type === 'import-result') {
          data.success ? resolve(true) : reject(new Error(data.error || '导入XML失败'));
        } else {
          resolve(data);
        }
      }
    };
    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
      pendingRequests.current.forEach(({ timer }) => clearTimeout(timer));
      pendingRequests.current.clear();
    };
  }, []);

  // ============ 拉取流程图数据 ============
  const fetchDiagram = useCallback(async () => {
    if (!processInstanceId) return;
    setLoading(true);
    try {
      const data = await leaveModuleApi.getProcessDiagram(processInstanceId);
      setDiagram(data);
    } catch (err) {
      message.error('加载流程图数据失败：' + err.message);
      setDiagram(null);
    } finally {
      setLoading(false);
    }
  }, [processInstanceId]);

  useEffect(() => {
    if (open && processInstanceId) {
      setModelerReady(false);
      setDiagram(null);
      fetchDiagram();
    }
  }, [open, processInstanceId, fetchDiagram]);

  // ============ 渲染：modeler 就绪 + 数据就绪 → 导入 + 高亮 ============
  useEffect(() => {
    if (!open || !modelerReady || !diagram?.xml) return;
    let cancelled = false;
    (async () => {
      setRendering(true);
      try {
        // 进入查看模式（隐藏 palette 等编辑工具）
        try { await sendCommand('set-view-mode'); } catch { /* ignore */ }
        // 导入 XML
        await sendCommand('import-xml', { xml: diagram.xml });
        if (cancelled) return;
        // 高亮节点
        await sendCommand('highlight-nodes', {
          completedIds: diagram.completedActivityIds || [],
          activeIds: diagram.activeActivityIds || [],
          completedFlowIds: diagram.completedSequenceFlowIds || [],
        });
      } catch (err) {
        if (!cancelled) message.error('渲染流程图失败：' + err.message);
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, modelerReady, diagram, sendCommand]);

  const handleRefresh = () => {
    fetchDiagram();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width="80vw"
      title={
        <div className="pdm-title">
          <span>流程图</span>
          {diagram?.processDefinitionName && (
            <Tag color="blue" style={{ marginLeft: 8 }}>{diagram.processDefinitionName}</Tag>
          )}
          {diagram?.finished
            ? <Tag color="default" style={{ marginLeft: 4 }}>已结束</Tag>
            : <Tag color="processing" style={{ marginLeft: 4 }}>进行中</Tag>
          }
        </div>
      }
      footer={
        <Space>
          <div className="pdm-legend">
            <span className="pdm-legend-item">
              <i className="pdm-legend-dot pdm-legend-dot-completed" /> 已完成
            </span>
            <span className="pdm-legend-item">
              <i className="pdm-legend-dot pdm-legend-dot-active" /> 进行中
            </span>
          </div>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          <Button type="primary" onClick={onClose}>关闭</Button>
        </Space>
      }
      destroyOnClose
      className="process-diagram-modal"
      styles={{ body: { padding: 0, height: '70vh', position: 'relative' } }}
    >
      {(loading || rendering || !modelerReady) && (
        <div className="pdm-loading-mask">
          <Spin tip={!modelerReady ? '正在加载设计器...' : rendering ? '正在渲染流程图...' : '正在加载数据...'} />
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={DESIGNER_URL}
        className="pdm-iframe"
        title="流程图查看"
      />
    </Modal>
  );
}
