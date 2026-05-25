import axios from 'axios';

/**
 * 文件上传 API：调用后端 /api/file/upload，由后端代理上传到阿里云 OSS。
 *
 * 后端 OSS 配置见 application.yml 的 app.oss 段。
 * 当 OSS 未启用时（开发场景），后端会兜底写入 ./uploads 并返回 /uploads/xxx。
 */
const http = axios.create({ baseURL: '/api/file' });

export const fileApi = {
  /**
   * 上传单个文件
   * @param {File} file
   * @param {string} biz - 业务目录（resource-lib | cert-bg | cert-record ...）
   * @param {(p: number) => void} [onProgress]
   * @returns {Promise<{ url, fileName, size, mime, storage }>}
   */
  upload: (file, biz = 'common', onProgress) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('biz', biz);
    return http
      .post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      })
      .then((r) => r.data);
  },

  ossStatus: () => http.get('/oss-status').then((r) => r.data),
};

export default fileApi;
