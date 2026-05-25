# 证书模版设计与发放（端到端）

## 目标
- 复用主应用风格，新增 `证书模版` 与 `证书发放测试` 两个菜单入口
- 前端 fabric.js 拖拽设计器：上传背景图 + 拖放文本/图片/动态字段
- 后端 Spring Boot 持久化模版（参考现有 `form` 子模块）+ Java Graphics2D 服务端渲染证书图
- 测试发放入口：选模版 → 录入/批量导入数据 → 调用后端渲染接口 → 预览/下载 PNG

## 技术选型
- 前端设计器：**fabric.js v6.7.1** 的 `<canvas>` 画布，对象级拖拽/缩放/旋转/属性面板、JSON 序列化
- 后端渲染：Java `BufferedImage` + `Graphics2D`（JDK 自带，零额外依赖），输出 PNG
- 后端持久化：MyBatis-Plus + H2（沿用 `form` 子模块结构），底图存服务器本地 `uploads/certificates/` + 静态资源映射
- 前端调用：通过 `/api/certificate/**` 走已配置的 vite 代理（`vite.config.js` 已代理 `/api` → `:8080`）
- 路由切换：沿用 `App.jsx` 中 `currentPage` 模式（不引入 react-router）

## 文件结构（新增）
### 前端：`src/certificate/`
```
src/certificate/
├── CertificateModule.jsx          # 模版列表（CRUD 入口）
├── CertificateModule.css
├── CertificateDesigner.jsx        # 设计器（左工具栏 + 中心 fabric 画布 + 右属性面板）
├── CertificateDesigner.css
├── CertificateIssueTest.jsx       # 发放测试页（选模版 + 录入数据 + 预览/下载）
├── CertificateIssueTest.css
├── api.js                         # axios 调用 /api/certificate/**
└── fields.js                      # 内置动态字段建议项（姓名/课程/成绩/日期/证书编号）
```

### 后端：`leave-workflow-backend/src/main/java/com/guoren/workflow/certificate/`
```
certificate/
├── controller/CertificateTemplateController.java   # CRUD + 上传底图 + 渲染
├── service/CertificateTemplateService.java         # 模版 CRUD + 渲染编排
├── service/CertificateRenderService.java           # Graphics2D 渲染
├── mapper/CertificateTemplateMapper.java           # MyBatis-Plus Mapper
├── entity/CertificateTemplate.java                 # 实体
├── dto/CertificateTemplateDTO.java                 # 保存/更新入参
└── dto/IssueRequestDTO.java                        # 发放渲染入参
```
配套：在 `WebConfig.java` 增加 `addResourceHandlers` 映射 `/uploads/**` 到本地 `uploads/`；在 `schema.sql` 增加 `certificate_template` 表。

## 后端 API（`/api/certificate`）
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/certificate/upload` | 上传底图，返回 `{ url: "/uploads/certificates/xxx.png" }` |
| POST | `/api/certificate/template` | 新建模版（body: CertificateTemplateDTO） |
| PUT  | `/api/certificate/template/{id}` | 更新模版 |
| GET  | `/api/certificate/template/list` | 列表（可带 keyword） |
| GET  | `/api/certificate/template/{id}` | 模版详情 |
| DELETE | `/api/certificate/template/{id}` | 软删 |
| POST | `/api/certificate/issue/render` | 渲染单张证书：body `{ templateId, data:{ fieldKey:value } }`，返回 PNG 字节流（`Content-Type: image/png`） |
| POST | `/api/certificate/issue/render-batch` | 批量：body `{ templateId, dataList:[...] }`，返回 `[{ name, base64 }]` 便于前端预览/下载 |

## 后端渲染服务：`CertificateRenderService.render(template, data)`
1. `BufferedImage img = new BufferedImage(width, height, TYPE_INT_ARGB)`
2. `Graphics2D g = img.createGraphics();` 开抗锯齿 `RenderingHints.VALUE_TEXT_ANTIALIAS_ON`
3. 若 `bg_url` 非空：`ImageIO.read(new File(uploadDir + bgRelativePath))`，`g.drawImage(bg, 0, 0, width, height, null)`；否则填充白色
4. 解析 `canvas_json.objects[]`，按对象 `type` 处理：
   - `i-text` / `text`：取 `left/top/fontSize/fill/fontFamily/fontWeight/textAlign`；若 `elementType=='field'`，文本替换为 `data.get(fieldKey)`（缺失则用 `field.sample`，再缺失则空串）；fabric 中 left/top 默认对应**对象左上角**，绘制时 `y = top + fontSize`（baseline 对齐）；按 `textAlign` 调整 x
   - `image`：从对象 src 解析为本地路径或 base64 → `g.drawImage`
5. `g.dispose(); ImageIO.write(img, "PNG", outputStream)`
6. 字体回退：默认尝试 `Microsoft YaHei` → `PingFang SC` → 系统逻辑字体 `SansSerif`，避免中文乱码

## 静态资源与上传
- `application.yml` 新增 `app.upload.dir: ./uploads`
- `WebConfig.addResourceHandlers` 映射 `/uploads/**` → `file:./uploads/`
- `CertificateTemplateController.upload(MultipartFile)`：写入 `uploadDir/certificates/{uuid}.{ext}`，返回相对 URL

## 主应用接入：`src/App.jsx`
1. 引入图标 `FileImageOutlined`、`SendOutlined` 与新组件
2. `iconBarItems` 末尾新增：
   - `{ key: 'certificate', icon: <FileImageOutlined />, label: '证书模版' }`
   - `{ key: 'certificate-issue', icon: <SendOutlined />, label: '证书发放测试' }`
3. `handleIconBarClick` 与 `currentPage` 三元渲染分支同步增加两项
4. 渲染：`currentPage === 'certificate' ? <CertificateModule /> : currentPage === 'certificate-issue' ? <CertificateIssueTest /> : ...`

## 数据模型
### 表：`certificate_template`（schema.sql 新增）
```sql
CREATE TABLE IF NOT EXISTS certificate_template (
  id           VARCHAR(36) PRIMARY KEY,
  tpl_key      VARCHAR(64) NOT NULL UNIQUE,
  name         VARCHAR(128) NOT NULL,
  bg_url       VARCHAR(512),         -- /uploads/certificates/xxx.png 相对路径
  width        INT  DEFAULT 1123,
  height       INT  DEFAULT 794,
  fields_json  CLOB,                 -- [{key,label,sample}, ...]
  canvas_json  CLOB,                 -- fabric.Canvas.toJSON(...) 结果（含字段坐标/字体/颜色）
  thumbnail    CLOB,                 -- 缩略图 dataURL（前端保存时生成）
  create_by    VARCHAR(64),
  create_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted      TINYINT DEFAULT 0
);
```

### 实体 `CertificateTemplate.java`
参照 `FormDefinition.java`：`@Data + @TableName("certificate_template") + @TableId(IdType.ASSIGN_UUID) + @TableLogic` 字段 `deleted`

### fabric 画布对象约定
- 动态字段：`fabric.IText`，附加自定义属性 `elementType:'field'`、`fieldKey:'studentName'`，文字显示为 `{{label}}`
- 静态文本：`fabric.IText` + `elementType:'text'`
- 图片/背景：`fabric.Image`；底图采用**独立 `bg_url` 字段**而非画布对象（便于后端单独加载）
- `toJSON` 白名单参数 `['elementType','fieldKey']` 让自定义属性参与序列化

## 设计器：`CertificateDesigner.jsx`
- 通过 `useEffect` 挂载 `new fabric.Canvas(canvasRef.current, { width, height, backgroundColor:'#fff' })`，存入 `useRef`
- 顶栏：模版名称输入、`保存`、`返回`
- 左侧工具栏按钮：
  - `插入文本` → `canvas.add(new fabric.IText('双击编辑', { elementType:'text', ... }))`
  - `插入动态字段`（下拉 fields）→ `IText('{{label}}', { elementType:'field', fieldKey })`
  - `插入图片`（上传 → `/api/certificate/upload` → `fabric.Image.fromURL`）
  - `上传背景图`：上传到后端，记录 `bgUrl`，前端 `canvas.setBackgroundImage(absUrl)` 仅作设计预览
  - `管理动态字段` → 弹窗维护 `fields[]`（key/label/sample）
- 中心画布区：fabric 自带选中/拖动/缩放/旋转控件；监听 `Delete` 键 `canvas.remove(canvas.getActiveObject())`
- 右侧属性面板：通过 `canvas.on('selection:created'|'selection:updated'|'selection:cleared')` 同步选中对象；属性面板修改 → `obj.set({...}); canvas.requestRenderAll()`
  - 文本/字段：内容（字段类禁用）/ 绑定字段（仅字段类）/ 字号 / 颜色 / 加粗 / 对齐 / 字体
  - 图片：替换 / 锁定比例缩放 / 不透明度
  - 无选中：画布尺寸（调用 `canvas.setDimensions`）/ 背景图替换/清除
- 保存（调用 `POST/PUT /api/certificate/template`）：
  ```js
  const payload = {
    name, width, height, bgUrl,
    fields,                                           // 字段定义
    canvasJson: canvas.toJSON(['elementType','fieldKey']),
    thumbnail: canvas.toDataURL({ format:'png', multiplier:0.3 })
  };
  ```

## 模版列表：`CertificateModule.jsx`（参考 `LeaveModule` 风格）
- antd `Table`：列 = 缩略图（`thumbnail`）、名称、字段数、更新时间、操作
- 数据源：`GET /api/certificate/template/list`
- 操作：编辑（进入设计器）、删除（`Popconfirm` → `DELETE /api/certificate/template/{id}`）、预览（Modal 显示 thumbnail）
- 顶部按钮：`新建证书模版`

## 发放测试：`CertificateIssueTest.jsx`
- 步骤式布局（antd `Steps` 或 Tab）：
  1. 选模版（`Select`，调用 `GET /api/certificate/template/list`）
  2. 录入数据：
     - 单条：根据模版 `fields` 动态生成 antd `Form` 项
     - 批量：`Input.TextArea` 粘贴 CSV（首行字段 key），实时解析为表格
  3. 预览：左侧记录列表，右侧渲染选中那张证书
  4. 下载：单张 `下载 PNG`、批量 `批量下载`
- 渲染逻辑（统一走后端，确保设计与发放 100% 一致）：
  - 单张：`POST /api/certificate/issue/render`，`responseType: 'blob'` → 转 `URL.createObjectURL` 注入 `<img>` 预览，下载用 `<a download>`
  - 批量：`POST /api/certificate/issue/render-batch`，返回 `[{ name, base64 }]`，前端逐个触发下载

## 前端 API 客户端：`src/certificate/api.js`
```js
import axios from 'axios';
const api = axios.create({ baseURL: '/api/certificate' });
export const templateApi = {
  list: (params) => api.get('/template/list', { params }),
  detail: (id)  => api.get(`/template/${id}`),
  create: (data)=> api.post('/template', data),
  update: (id, data) => api.put(`/template/${id}`, data),
  remove: (id)  => api.delete(`/template/${id}`),
  upload: (file) => { const fd = new FormData(); fd.append('file', file); return api.post('/upload', fd); },
  render: (body) => api.post('/issue/render', body, { responseType: 'blob' }),
  renderBatch: (body) => api.post('/issue/render-batch', body),
};
export const DEFAULT_FIELDS = [
  { key:'studentName', label:'姓名', sample:'张三' },
  { key:'courseName',  label:'课程', sample:'人工智能通识' },
  { key:'score',       label:'成绩', sample:'95' },
  { key:'issueDate',   label:'发证日期', sample:'2025-05-24' },
  { key:'certNo',      label:'证书编号', sample:'CERT-20250524-001' },
];
```

## 依赖变更
### 前端 `package.json`
- 新增 `"fabric": "6.7.1"`（精确锁版本）、`"axios": "^1.7.9"`（运行 `npm install fabric@6.7.1 axios`）
### 后端 `pom.xml`
- 无需新增依赖（Graphics2D、ImageIO、MultipartFile 均为 Spring Boot Starter Web + JDK 自带）

## 验证方式
1. 启动后端：`cd leave-workflow-backend && ./start.sh`（或 mvn spring-boot:run）
2. 启动前端：`npm install fabric axios && npm run dev`
3. 侧栏「证书模版」→ 新建 → 上传底图 → 放置「姓名」字段与文本 → 保存（落库 + bg 落 `uploads/certificates/`）
4. 侧栏「证书发放测试」→ 选模版 → 录入数据 → 调用后端 `/issue/render` → 预览/下载 PNG
5. 批量 CSV 2-3 行 → `/issue/render-batch` → 列表逐个预览/下载

## 不做的事
- 不做 OSS 接入（演示阶段用本地 `uploads/`，部署时可替换为 OSS）
- 不做批量 ZIP 下载（保留接口扩展位）
- 不做二维码生成（可后续用 zxing 在 Graphics2D 中追加）
- 不改动现有 `workflow-designer` Vue 工程