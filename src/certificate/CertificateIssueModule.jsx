import { useState } from 'react';
import { Drawer } from 'antd';
import CertificateIssueList from './CertificateIssueList';
import CertificateIssueBatchDetail from './CertificateIssueBatchDetail';
import CertificateIssueTest from './CertificateIssueTest';

/**
 * 证书发放模块壳：在 list / detail 两态间切换；
 * 新建发放使用 Drawer 弹出嵌入 CertificateIssueTest。
 */
const CertificateIssueModule = () => {
  const [view, setView] = useState('list'); // list | detail
  const [activeBatch, setActiveBatch] = useState(null);
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);

  // 外层充满父容器（App.jsx 下 app-layout 为 flex row，子项需 flex:1 才能占满右侧）
  const wrapperStyle = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' };

  if (view === 'detail' && activeBatch) {
    return (
      <div style={wrapperStyle}>
        <CertificateIssueBatchDetail
          batch={activeBatch}
          onBack={() => {
            setActiveBatch(null);
            setView('list');
          }}
        />
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <CertificateIssueList
        onCreate={() => setNewDrawerOpen(true)}
        onOpen={(batch) => {
          setActiveBatch(batch);
          setView('detail');
        }}
      />
      <Drawer
        title="新建证书发放"
        open={newDrawerOpen}
        onClose={() => setNewDrawerOpen(false)}
        width="90%"
        destroyOnClose
        styles={{ body: { padding: 0, background: '#f5f7fa' } }}
      >
        <CertificateIssueTest
          embedded
          onBack={() => setNewDrawerOpen(false)}
          onSubmitted={(batch) => {
            setNewDrawerOpen(false);
            if (batch?.id) {
              setActiveBatch(batch);
              setView('detail');
            }
          }}
        />
      </Drawer>
    </div>
  );
};

export default CertificateIssueModule;
