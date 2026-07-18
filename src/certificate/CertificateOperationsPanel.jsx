import { Card, Tag } from 'antd';
import {
  BulbOutlined,
  ExperimentOutlined,
  FileProtectOutlined,
  GiftOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import './CertificateModule.css';

const CERTIFICATE_SCENARIOS = [
  {
    key: 'training',
    title: '培训结业',
    icon: <ReadOutlined />,
    tag: '研习社',
    desc: '果仁入门课、模块专题课、管理员课程完成后独立发放结业或认证证书。',
  },
  {
    key: 'beta',
    title: '内测官',
    icon: <ExperimentOutlined />,
    tag: '内测',
    desc: '有效反馈、复测通过、关键问题发现等贡献可生成内测官证书。',
  },
  {
    key: 'ugc',
    title: 'UGC 贡献',
    icon: <BulbOutlined />,
    tag: '共创',
    desc: '自主分享、模板贡献、案例收录后，可由运营方发放贡献证书。',
  },
  {
    key: 'practice',
    title: '最佳实践',
    icon: <TrophyOutlined />,
    tag: '沉淀',
    desc: '优秀案例进入资料区、资历库或研习社后，形成最佳实践贡献凭证。',
  },
  {
    key: 'redeem',
    title: '积分兑换',
    icon: <GiftOutlined />,
    tag: '兑换时关联',
    desc: '证书与我的积分解耦，仅当用户兑换证书权益时，才由兑换记录触发发放。',
  },
];

const ISSUE_MODES = [
  { title: '规则自动发放', desc: '课程完成、认证通过、内测达标后由证书模块生成批次。' },
  { title: '运营主动发放', desc: '月度评选、专项活动、优秀案例沉淀后由运营方批量发放。' },
  { title: '兑换触发发放', desc: '积分系统只传递证书权益兑换结果，证书归档仍由证书模块负责。' },
];

export default function CertificateOperationsPanel({ compact = false, className = '' }) {
  return (
    <Card className={`cert-ops-panel ${compact ? 'is-compact' : ''} ${className}`}>
      <div className="cert-ops-header">
        <div className="cert-ops-heading">
          <div className="cert-ops-title">
            <FileProtectOutlined />
            果仁运营证书体系
          </div>
          <div className="cert-ops-subtitle">
            证书作为独立模块管理，用于果仁系统培训结业、管理员认证、内测官、UGC 贡献和最佳实践凭证；不放入“我的积分”档案，不作为公司级资质、绩效或薪酬依据。
          </div>
        </div>
        <div className="cert-ops-tags">
          <Tag color="purple">独立证书模块</Tag>
          <Tag color="blue">兑换时才关联积分</Tag>
        </div>
      </div>

      <div className="cert-ops-flow">
        {ISSUE_MODES.map((mode) => (
          <div className="cert-ops-flow-node" key={mode.title}>
            <div className="cert-ops-flow-title">
              <SafetyCertificateOutlined />
              {mode.title}
            </div>
            <div className="cert-ops-flow-desc">{mode.desc}</div>
          </div>
        ))}
      </div>

      <div className="cert-ops-scenario-grid">
        {CERTIFICATE_SCENARIOS.map((scenario) => (
          <div className="cert-ops-scenario" key={scenario.key}>
            <div className="cert-ops-scenario-icon">{scenario.icon}</div>
            <div className="cert-ops-scenario-body">
              <div className="cert-ops-scenario-title">
                <span>{scenario.title}</span>
                <Tag>{scenario.tag}</Tag>
              </div>
              <div className="cert-ops-scenario-desc">{scenario.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
