import { Button, ColorPicker, Drawer, Form, Input, Modal, Select, Upload, message } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import { fileApi } from '../api/fileApi';
import AddResourceDialog from './AddResourceDialog.jsx';
import ResourceParseStatus from './ResourceParseStatus.jsx';
import { inferFileType } from './resourceLibStore';
import ResourceLibraryTagPicker from './ResourceLibraryTagPicker.jsx';

export default function ResourceLibraryOverlays({
  tagPicker,
  addTag,
  createEntry,
  resourceImport,
  parseDrawer,
}) {
  const handleCreateEntryFilePrefill = async (file) => {
    const inferred = inferFileType(file.name);
    createEntry.form.setFieldsValue({ name: file.name, fileType: inferred });
    const hide = message.loading('上传中...', 0);
    try {
      const result = await fileApi.upload(file, 'resource-lib');
      createEntry.form.setFieldsValue({ url: result.url, size: result.size, mime: result.mime });
      hide();
      message.success('上传成功');
    } catch {
      hide();
      message.error('上传失败');
    }
    return false;
  };

  return (
    <>
      <Modal
        title="编辑标签"
        open={tagPicker.open}
        onCancel={tagPicker.onClose}
        footer={null}
        destroyOnClose
        width={320}
      >
        {tagPicker.item && (
          <ResourceLibraryTagPicker
            item={tagPicker.item}
            tagDefs={tagPicker.tagDefs}
            quickTagDefs={tagPicker.quickTagDefs}
            tagGroups={tagPicker.tagGroups}
            activeGroupFilter={tagPicker.groupFilter}
            listScrollActive={tagPicker.listScrollActive}
            onGroupFilterChange={tagPicker.onGroupFilterChange}
            onListScroll={tagPicker.onListScroll}
            onToggleItemTagSelection={tagPicker.onToggleItemTagSelection}
            onQuickTagToggle={tagPicker.onQuickTagToggle}
            onCreateTag={tagPicker.onCreateTag}
          />
        )}
      </Modal>

      <Modal
        title="新建自定义标签"
        open={addTag.open}
        onCancel={addTag.onClose}
        onOk={addTag.onConfirm}
        okText="创建"
        cancelText="取消"
        destroyOnClose
        width={360}
      >
        <Form layout="vertical">
          <Form.Item label="标签名称">
            <Input value={addTag.name} onChange={(event) => addTag.onNameChange(event.target.value)} placeholder="例如：重要、待审核" />
          </Form.Item>
          <Form.Item label="标签颜色">
            <ColorPicker value={addTag.color} onChange={addTag.onColorChange} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={createEntry.type === 'folder' ? '新建文件夹' : '新建资料'}
        open={createEntry.open}
        onCancel={createEntry.onClose}
        onOk={createEntry.onConfirm}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={createEntry.form} layout="vertical" preserve={false}>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder={createEntry.type === 'folder' ? '请输入文件夹名称' : '请输入资料名称'} />
          </Form.Item>
          {createEntry.type === 'file' && (
            <>
              <Form.Item label="文件类型" name="fileType" tooltip="留空则按文件名后缀自动识别">
                <Select
                  allowClear
                  placeholder="自动识别"
                  options={[
                    { value: 'pdf', label: 'PDF' },
                    { value: 'pptx', label: 'PPT' },
                    { value: 'docx', label: 'Word' },
                    { value: 'xlsx', label: 'Excel' },
                    { value: 'image', label: '图片' },
                    { value: 'video', label: '视频' },
                    { value: 'audio', label: '音频' },
                    { value: 'other', label: '其他' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="本地上传（可选）">
                <Upload beforeUpload={handleCreateEntryFilePrefill} maxCount={1}>
                  <Button icon={<FileAddOutlined />}>选择文件</Button>
                </Upload>
              </Form.Item>
              <Form.Item name="url" hidden><Input /></Form.Item>
              <Form.Item name="size" hidden><Input /></Form.Item>
              <Form.Item name="mime" hidden><Input /></Form.Item>
            </>
          )}
          <div className="rl-add-tip">将创建到：<b>{createEntry.currentFolderName}</b></div>
        </Form>
      </Modal>

      <AddResourceDialog
        open={resourceImport.open}
        onClose={resourceImport.onClose}
        onUpload={resourceImport.onUpload}
      />

      <Drawer
        open={parseDrawer.open}
        onClose={parseDrawer.onClose}
        placement="right"
        width={1180}
        destroyOnClose
        styles={{
          header: { display: 'none' },
          body: { padding: 0 },
        }}
      >
        <ResourceParseStatus onBack={parseDrawer.onClose} />
      </Drawer>
    </>
  );
}
