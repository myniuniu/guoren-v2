import { Button, Progress, Tag } from 'antd';
import {
  ArrowRightOutlined,
  BankOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClusterOutlined,
  ExperimentOutlined,
  ReadOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { SOLUTION_SHOWROOM_ROOMS } from './showroomData';
import './SolutionShowroomPortal.css';

function RoomIcon({ roomId }) {
  const iconMap = {
    'tongda-ai-literacy-teaching': <ReadOutlined />,
    'tongda-agent-platform': <ThunderboltOutlined />,
    'k12-service-platform': <BankOutlined />,
    'teacher-development-platform': <TeamOutlined />,
    'smart-continuing-education': <ClusterOutlined />,
    'teacher-portfolio-platform': <SafetyCertificateOutlined />,
  };
  return iconMap[roomId] || <ExperimentOutlined />;
}

function SolutionShowroomPortal({ onOpenRoom }) {
  const roomCount = SOLUTION_SHOWROOM_ROOMS.length;
  const tenantCount = new Set(SOLUTION_SHOWROOM_ROOMS.map((item) => item.tenantId)).size;
  const moduleCount = new Set(SOLUTION_SHOWROOM_ROOMS.flatMap((item) => item.modules)).size;
  const firstRoom = SOLUTION_SHOWROOM_ROOMS[0];

  return (
    <main className="solution-showroom-portal">
      <section className="showroom-portal-hero">
        <div className="showroom-portal-copy">
          <div className="showroom-eyebrow">解决方案样板间</div>
          <h1>面向业务场景的样板间门户</h1>
          <p>
            汇集通答人工智能通识教学、智能体平台、中小学服务、教师发展、智慧继教和教师档案袋样板，进入后查看对应租户的模块、流程与运营视图。
          </p>
          <div className="showroom-hero-actions">
            <Button type="primary" icon={<RocketOutlined />} onClick={() => onOpenRoom?.(firstRoom)}>
              进入首个样板
            </Button>
            <span className="showroom-hero-note">
              <CheckCircleOutlined />
              {roomCount} 个样板间已就绪
            </span>
          </div>
        </div>

        <div className="showroom-portal-overview" aria-label="样板间概览">
          <div className="showroom-overview-row">
            <span>样板间</span>
            <strong>{roomCount}</strong>
          </div>
          <div className="showroom-overview-row">
            <span>样板租户</span>
            <strong>{tenantCount}</strong>
          </div>
          <div className="showroom-overview-row">
            <span>覆盖模块</span>
            <strong>{moduleCount}</strong>
          </div>
          <div className="showroom-overview-progress">
            <span>门户完整度</span>
            <Progress percent={100} showInfo={false} size="small" />
          </div>
        </div>
      </section>

      <section className="showroom-room-grid" aria-label="样板间入口">
        {SOLUTION_SHOWROOM_ROOMS.map((room) => (
          <button
            key={room.id}
            type="button"
            className={`showroom-room-card showroom-room-${room.tone}`}
            style={{ '--showroom-accent': room.accent }}
            onClick={() => onOpenRoom?.(room)}
          >
            <span className="showroom-room-topline">
              <span className="showroom-room-icon">
                <RoomIcon roomId={room.id} />
              </span>
              <span className="showroom-room-stage">{room.stage}</span>
            </span>

            <span className="showroom-room-main">
              <span>
                <span className="showroom-room-title">{room.solutionName}</span>
                <span className="showroom-room-desc">{room.description}</span>
              </span>
              <span className="showroom-room-enter" aria-hidden="true">
                <ArrowRightOutlined />
              </span>
            </span>

            <span className="showroom-room-tenant">
              <BankOutlined />
              <span>{room.tenantName}</span>
              <small>{room.region} · {room.tenantType}</small>
            </span>

            <span className="showroom-room-metrics">
              {room.metrics.map((metric) => (
                <span key={metric.label}>
                  <strong>{metric.value}</strong>
                  <small>{metric.label}</small>
                </span>
              ))}
            </span>

            <span className="showroom-room-modules">
              {room.modules.slice(0, 5).map((moduleName) => (
                <Tag key={moduleName}>{moduleName}</Tag>
              ))}
              {room.modules.length > 5 ? <Tag>+{room.modules.length - 5}</Tag> : null}
            </span>
          </button>
        ))}
      </section>

      <section className="showroom-operation-band" aria-label="样板间运营视图">
        <div className="showroom-band-title">
          <BookOutlined />
          <span>样板间运营总览</span>
        </div>
        <div className="showroom-band-items">
          {SOLUTION_SHOWROOM_ROOMS.map((room) => (
            <div key={room.id} className="showroom-band-item" style={{ '--showroom-accent': room.accent }}>
              <span>{room.signal}</span>
              <strong>{room.operations[0]?.value}</strong>
              <small>{room.operations[0]?.label}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default SolutionShowroomPortal;
