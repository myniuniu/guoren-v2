import { useState } from 'react';
import {
  CheckCircleFilled,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  UpOutlined,
} from '@ant-design/icons';
import './TenantSelectPage.css';

const PRIMARY_TENANTS = [
  {
    key: 'beijing-guoren',
    name: '北京国人通教育科技有限公司',
    shortName: '北',
    owner: '张洪磊',
    verified: true,
    tone: 'blue',
  },
  {
    key: 'feishu-developer',
    name: '飞书开发者体验企业',
    owner: '张洪磊',
    verified: true,
    tone: 'feishu',
  },
  {
    key: 'guoren-education',
    name: '国人通教育科技有限公司',
    shortName: '国',
    owner: '张洪磊',
    verified: false,
    tone: 'blue',
  },
];

const MORE_TENANTS = [
  { key: 'guoren-ai-lab', name: '国人通 AI 教学实验室', shortName: 'AI', owner: '张洪磊', verified: true, tone: 'blue' },
  { key: 'teacher-dev', name: '教师发展中心', shortName: '师', owner: '张洪磊', verified: false, tone: 'cyan' },
  { key: 'training-cloud', name: '培训云演示组织', shortName: '云', owner: '张洪磊', verified: false, tone: 'purple' },
  { key: 'product-demo', name: '产品体验企业', shortName: '产', owner: '张洪磊', verified: true, tone: 'green' },
  { key: 'ops-demo', name: '运营演示空间', shortName: '运', owner: '张洪磊', verified: false, tone: 'orange' },
];

function TenantLogo({ tenant }) {
  if (tenant.tone === 'feishu') {
    return (
      <span className="tenant-logo tenant-logo-feishu" aria-hidden="true">
        <span />
      </span>
    );
  }

  return (
    <span className={`tenant-logo tenant-logo-${tenant.tone || 'blue'}`} aria-hidden="true">
      {tenant.shortName || tenant.name.slice(0, 1)}
    </span>
  );
}

function TenantSelectPage({ onBack, onSelectTenant }) {
  const [expanded, setExpanded] = useState(false);
  const tenants = expanded ? [...PRIMARY_TENANTS, ...MORE_TENANTS] : PRIMARY_TENANTS;

  return (
    <main className="tenant-select-page">
      <section className="tenant-select-card" aria-label="选择企业或组织">
        <button type="button" className="tenant-back-button" onClick={onBack}>
          <LeftOutlined />
          <span>返回</span>
        </button>

        <div className="tenant-select-heading">
          <h1>你可进入以下企业</h1>
          <p>
            <strong>+86153******56</strong>
            已在以下企业或组织绑定了账号，你可进入以下任一企业或组织
          </p>
        </div>

        <div className="tenant-list">
          {tenants.map((tenant) => (
            <button
              key={tenant.key}
              type="button"
              className="tenant-row"
              onClick={() => onSelectTenant?.(tenant)}
            >
              <TenantLogo tenant={tenant} />
              <span className="tenant-copy">
                <span className="tenant-name" title={tenant.name}>{tenant.name}</span>
                <span className="tenant-meta">
                  <span>{tenant.owner}</span>
                  {tenant.verified ? (
                    <span className="tenant-verified">
                      <CheckCircleFilled />
                      已认证
                    </span>
                  ) : null}
                </span>
              </span>
              <RightOutlined className="tenant-row-arrow" />
            </button>
          ))}
        </div>

        <button
          type="button"
          className="tenant-more-button"
          onClick={() => setExpanded((current) => !current)}
        >
          <span>{expanded ? '收起其他企业' : '展示其他 5 个企业'}</span>
          {expanded ? <UpOutlined /> : <DownOutlined />}
        </button>
      </section>
    </main>
  );
}

export default TenantSelectPage;
