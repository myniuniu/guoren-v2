import { Button, Alert, Space } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { isElectronRuntime, openDesktopUrl } from './desktop';

export default function DesktopServiceNotice({ title, serviceName, serviceUrl, extraText }) {
  if (!isElectronRuntime()) {
    return null;
  }

  return (
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      message={title}
      description={(
        <Space direction="vertical" size={8}>
          <span>
            桌面版没有内置 <strong>{serviceName}</strong>。使用相关功能前，请先启动：
            <code style={{ marginLeft: 6 }}>{serviceUrl}</code>
          </span>
          {extraText ? <span>{extraText}</span> : null}
          <div>
            <Button
              size="small"
              icon={<ExportOutlined />}
              onClick={() => openDesktopUrl(serviceUrl)}
            >
              打开服务地址
            </Button>
          </div>
        </Space>
      )}
    />
  );
}
