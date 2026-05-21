import { Select, Button, Tag, Space, Popconfirm } from 'antd';
import { PlusOutlined, SendOutlined } from '@ant-design/icons';
import './VersionPanel.css';

function VersionPanel({ versions, currentVersion, onCreateVersion, onPublishVersion, onSwitchVersion }) {
  const isDraft = currentVersion?.status === 'draft';

  return (
    <div className="version-panel">
      <div className="version-panel-left">
        <Select
          value={currentVersion?.id}
          onChange={onSwitchVersion}
          className="version-select"
          popupMatchSelectWidth={false}
        >
          {versions.map((v) => (
            <Select.Option key={v.id} value={v.id}>
              <span className="version-option">
                <span>{v.name}</span>
                <Tag
                  color={v.status === 'published' ? 'green' : 'orange'}
                  className="version-tag"
                >
                  {v.status === 'published' ? '已发布' : '草稿'}
                </Tag>
              </span>
            </Select.Option>
          ))}
        </Select>
        {currentVersion && (
          <Tag color={isDraft ? 'orange' : 'green'} className="current-version-tag">
            {isDraft ? '草稿' : '已发布'}
          </Tag>
        )}
      </div>
      <div className="version-panel-right">
        <Space size={8}>
          {isDraft && (
            <Popconfirm
              title="确认发布"
              description="发布后该版本的资料将不可修改，确认发布？"
              onConfirm={() => onPublishVersion(currentVersion.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                className="publish-btn"
              >
                发布版本
              </Button>
            </Popconfirm>
          )}
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={onCreateVersion}
            className="new-version-btn"
          >
            新建版本
          </Button>
        </Space>
      </div>
    </div>
  );
}

export default VersionPanel;
