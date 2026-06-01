import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Alert,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { DMS_DOC_TYPES, formatFileSize, dmsTagApi } from './api';
import { fileApi } from '../api/fileApi';

const { TextArea } = Input;
const { Dragger } = Upload;

/**
 * DMS 文档表单弹窗（新建 / 编辑）
 *
 * - 标签 Select 改为 mode="tags"，options 来自远端 dmsTagApi.list（首次打开缓存）
 * - 编辑模式下若替换了主文件，启用「变更说明 changeLog」字段
 */
export default function DmsDocumentForm({
  open,
  onClose,
  onSubmit,
  mode = 'create',
  initialData = null,
  loading = false,
}) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [originalFileUrl, setOriginalFileUrl] = useState(null);

  // 当前 fileList 与原始 fileUrl 不同 → 视为替换
  const fileChanged =
    mode === 'edit' && originalFileUrl && fileList[0]?.url && fileList[0].url !== originalFileUrl;

  // 加载标签 options（每次 open 触发一次）
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const list = await dmsTagApi.list('usage');
        setTagOptions(
          (list || []).map((t) => ({
            value: t.name,
            label: t.usageCount ? `${t.name} (${t.usageCount})` : t.name,
          })),
        );
      } catch {
        // 静默
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialData) {
      form.setFieldsValue({
        title: initialData.title,
        docType: initialData.docType,
        tags: Array.isArray(initialData.tags)
          ? initialData.tags
          : (initialData.tags || '').split(',').filter(Boolean),
        description: initialData.description,
        changeLog: '',
      });
      setOriginalFileUrl(initialData.fileUrl || null);
      if (initialData.fileUrl) {
        setFileList([
          {
            uid: 'exist',
            name: initialData.fileName || '已上传文件',
            status: 'done',
            url: initialData.fileUrl,
            size: initialData.fileSize,
            mime: initialData.mime,
          },
        ]);
      } else {
        setFileList([]);
      }
    } else {
      form.resetFields();
      setFileList([]);
      setOriginalFileUrl(null);
    }
  }, [open, mode, initialData, form]);

  const handleUpload = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;
    setUploading(true);
    try {
      const result = await fileApi.upload(file, 'dms', (percent) => {
        onProgress({ percent });
      });
      const item = {
        uid: file.uid,
        name: result.fileName || file.name,
        status: 'done',
        url: result.url,
        size: result.size,
        mime: result.mime,
        response: result,
      };
      setFileList([item]);
      onSuccess(result, file);
    } catch (err) {
      message.error('文件上传失败: ' + (err?.message || ''));
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (file) => {
    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const f = fileList[0];
      const tagsStr = Array.isArray(values.tags) ? values.tags.join(',') : (values.tags || '');
      onSubmit({
        title: values.title,
        docType: values.docType,
        tags: tagsStr,
        description: values.description,
        fileUrl: f?.url,
        fileName: f?.name,
        fileSize: f?.size,
        mime: f?.mime,
        changeLog: fileChanged ? values.changeLog || '' : undefined,
      });
    } catch {
      // 校验失败
    }
  };

  return (
    <Modal
      title={mode === 'edit' ? '编辑文档' : '新建文档'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading || uploading}
      width={640}
      destroyOnHidden
      okText="保存"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          name="title"
          label="文档标题"
          rules={[{ required: true, message: '请输入文档标题' }]}
        >
          <Input placeholder="如：员工差旅报销管理办法 v2" maxLength={120} />
        </Form.Item>

        <Form.Item
          name="docType"
          label="文档类型"
          rules={[{ required: true, message: '请选择文档类型' }]}
        >
          <Select placeholder="请选择类型" options={DMS_DOC_TYPES} />
        </Form.Item>

        <Form.Item name="tags" label="标签">
          <Select
            mode="tags"
            allowClear
            showSearch
            placeholder="选择已有标签或输入新标签后回车"
            tokenSeparators={[',', ' ']}
            options={tagOptions}
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <TextArea rows={3} placeholder="选填，可补充文档背景与摘要" maxLength={500} />
        </Form.Item>

        <Form.Item label="附件">
          <Dragger
            customRequest={handleUpload}
            fileList={fileList}
            onRemove={handleRemoveFile}
            maxCount={1}
            multiple={false}
            showUploadList={{ showPreviewIcon: false, showDownloadIcon: false }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              单文件上传；编辑时替换文件将自动归档为新版本
            </p>
          </Dragger>
          {fileList[0]?.size != null && (
            <div style={{ marginTop: 6, color: '#8a8f99', fontSize: 12 }}>
              文件大小：{formatFileSize(fileList[0].size)}
            </div>
          )}
        </Form.Item>

        {fileChanged && (
          <>
            <Alert
              type="info"
              showIcon
              message="检测到附件已替换，保存时会把原文件归档为历史版本。"
              style={{ marginBottom: 12 }}
            />
            <Form.Item
              name="changeLog"
              label="变更说明"
              rules={[{ required: true, message: '请填写本次变更说明' }]}
            >
              <TextArea
                rows={2}
                placeholder="如：根据 2024Q4 财务制度更新附录 B"
                maxLength={500}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
