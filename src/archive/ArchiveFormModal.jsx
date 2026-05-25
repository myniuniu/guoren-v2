import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Button,
  Space,
  message,
  Typography,
} from 'antd';
import {
  UploadOutlined,
  InboxOutlined,
  FileOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { ARCHIVE_TYPES } from './api';
import { fileApi } from '../api/fileApi';

const { TextArea } = Input;
const { Text } = Typography;
const { Dragger } = Upload;

/**
 * 档案提交表单弹窗
 * mode: 'create' | 'edit'
 */
export default function ArchiveFormModal({
  open,
  onClose,
  onSubmit,
  mode = 'create',
  initialData = null,
  loading = false,
  currentUser,
  currentUserName,
}) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        form.setFieldsValue({
          title: initialData.title,
          archiveType: initialData.archiveType,
          description: initialData.description,
        });
        // 恢复附件列表
        if (initialData.attachments?.length) {
          setFileList(
            initialData.attachments.map((att, idx) => ({
              uid: att.uid || `att_${idx}`,
              name: att.fileName || att.name,
              status: 'done',
              url: att.url,
              size: att.size,
              mime: att.mime,
              response: att,
            }))
          );
        } else {
          setFileList([]);
        }
      } else {
        form.resetFields();
        setFileList([]);
      }
    }
  }, [open, mode, initialData, form]);

  const handleUpload = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;
    setUploading(true);
    try {
      const result = await fileApi.upload(file, 'archive', (percent) => {
        onProgress({ percent });
      });
      const fileItem = {
        uid: file.uid,
        name: result.fileName || file.name,
        status: 'done',
        url: result.url,
        size: result.size,
        mime: result.mime,
        response: result,
      };
      setFileList((prev) => [...prev, fileItem]);
      onSuccess(result, file);
    } catch (err) {
      message.error('文件上传失败: ' + err.message);
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
      if (fileList.length === 0) {
        message.warning('请至少上传一个档案附件');
        return;
      }
      const attachments = fileList.map((f) => ({
        uid: f.uid,
        fileName: f.name,
        name: f.name,
        url: f.url || f.response?.url,
        size: f.size || f.response?.size,
        mime: f.mime || f.response?.mime,
      }));
      onSubmit({
        ...values,
        applicant: currentUser,
        applicantName: currentUserName,
        attachments,
      });
    } catch (err) {
      // validation error
    }
  };

  return (
    <Modal
      title={mode === 'edit' ? '编辑档案' : '提交档案'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText={mode === 'edit' ? '保存草稿' : '保存草稿'}
      cancelText="取消"
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label="档案名称"
          rules={[{ required: true, message: '请输入档案名称' }]}
        >
          <Input placeholder="如：张三-学历证书" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="archiveType"
          label="档案类型"
          rules={[{ required: true, message: '请选择档案类型' }]}
        >
          <Select placeholder="请选择类型" options={ARCHIVE_TYPES} />
        </Form.Item>

        <Form.Item name="description" label="备注说明">
          <TextArea rows={3} placeholder="选填，可补充说明档案内容" maxLength={500} />
        </Form.Item>

        <Form.Item label="附件上传" required>
          <Dragger
            customRequest={handleUpload}
            fileList={fileList}
            onRemove={handleRemoveFile}
            multiple
            showUploadList={{
              showPreviewIcon: false,
              showDownloadIcon: false,
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 PDF、Word、Excel、图片等多种格式，可批量上传
            </p>
          </Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
}
