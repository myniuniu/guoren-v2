-- 自定义表单服务端 H2 建表脚本（与 MySQL 兼容，仅 CLOB ↔ JSON 列类型差异）

CREATE TABLE IF NOT EXISTS form_definition (
  id              VARCHAR(36) PRIMARY KEY,
  form_key        VARCHAR(64) NOT NULL UNIQUE,
  name            VARCHAR(128) NOT NULL,
  category        VARCHAR(64),
  description     VARCHAR(512),
  latest_version  INT DEFAULT 0,
  status          VARCHAR(16) DEFAULT 'DRAFT',
  create_by       VARCHAR(64),
  create_time     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted         TINYINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS form_definition_version (
  id                VARCHAR(36) PRIMARY KEY,
  form_id           VARCHAR(36) NOT NULL,
  form_key          VARCHAR(64) NOT NULL,
  version           INT NOT NULL,
  schema_json       CLOB,
  list_config_json  CLOB,
  query_config_json CLOB,
  process_def_key   VARCHAR(64),
  published         TINYINT DEFAULT 0,
  publish_time      TIMESTAMP,
  create_by         VARCHAR(64),
  create_time       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_form_version UNIQUE(form_id, version)
);

CREATE TABLE IF NOT EXISTS form_data (
  id                  VARCHAR(36) PRIMARY KEY,
  form_key            VARCHAR(64) NOT NULL,
  form_version        INT NOT NULL,
  title               VARCHAR(256),
  status              VARCHAR(16) DEFAULT 'DRAFT',
  data_json           CLOB NOT NULL,
  process_def_key     VARCHAR(64),
  process_instance_id VARCHAR(64),
  create_by           VARCHAR(64),
  create_dept         VARCHAR(64),
  create_time         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted             TINYINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_form_data_key_status ON form_data(form_key, status);
CREATE INDEX IF NOT EXISTS idx_form_data_process    ON form_data(process_instance_id);

-- 证书模版表
CREATE TABLE IF NOT EXISTS certificate_template (
  id           VARCHAR(36) PRIMARY KEY,
  tpl_key      VARCHAR(64) NOT NULL UNIQUE,
  name         VARCHAR(128) NOT NULL,
  bg_url       CLOB,
  width        INT  DEFAULT 1123,
  height       INT  DEFAULT 794,
  fields_json  CLOB,
  canvas_json  CLOB,
  thumbnail    CLOB,
  create_by    VARCHAR(64),
  create_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted      TINYINT DEFAULT 0
);

-- v1.1: 证书模版版本表
CREATE TABLE IF NOT EXISTS certificate_template_version (
  id            VARCHAR(36) PRIMARY KEY,
  template_id   VARCHAR(36) NOT NULL,
  version_no    INT NOT NULL,
  snapshot_json CLOB,
  comment       VARCHAR(256),
  create_by     VARCHAR(64),
  create_time   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cert_tpl_ver ON certificate_template_version(template_id, version_no);

-- v1.1: 证书流水号规则表
CREATE TABLE IF NOT EXISTS certificate_seq (
  rule_key     VARCHAR(64) PRIMARY KEY,
  rule_pattern VARCHAR(128) NOT NULL,
  current_seq  BIGINT DEFAULT 0,
  update_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- v1.2: 证书发放批次表
CREATE TABLE IF NOT EXISTS certificate_issue_batch (
  id            VARCHAR(36) PRIMARY KEY,
  batch_name    VARCHAR(128) NOT NULL,
  template_id   VARCHAR(36) NOT NULL,
  template_name VARCHAR(128),
  format        VARCHAR(16) DEFAULT 'png',
  total_count   INT DEFAULT 0,
  success_count INT DEFAULT 0,
  remark        VARCHAR(512),
  status        VARCHAR(16) DEFAULT 'COMPLETED',
  create_by     VARCHAR(64),
  create_time   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted       TINYINT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cert_issue_batch_tpl ON certificate_issue_batch(template_id);
CREATE INDEX IF NOT EXISTS idx_cert_issue_batch_time ON certificate_issue_batch(create_time);

-- v1.2: 证书发放明细表
CREATE TABLE IF NOT EXISTS certificate_issue_record (
  id           VARCHAR(36) PRIMARY KEY,
  batch_id     VARCHAR(36) NOT NULL,
  template_id  VARCHAR(36) NOT NULL,
  cert_no      VARCHAR(128),
  recipient    VARCHAR(128),
  data_json    CLOB,
  file_name    VARCHAR(256),
  mime         VARCHAR(64),
  format       VARCHAR(16),
  file_base64  CLOB,
  status       VARCHAR(16) DEFAULT 'SUCCESS',
  error_msg    VARCHAR(512),
  create_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted      TINYINT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cert_issue_record_batch ON certificate_issue_record(batch_id);
CREATE INDEX IF NOT EXISTS idx_cert_issue_record_no ON certificate_issue_record(cert_no);
CREATE INDEX IF NOT EXISTS idx_cert_issue_record_recipient ON certificate_issue_record(recipient);

-- ============================================================
-- 流程设计 V2：配置项存储（替代 localStorage，支持版本管理）
-- ============================================================

-- 流程配置主表（保存最新草稿，每次编辑直接覆盖）
CREATE TABLE IF NOT EXISTS process_config (
  id               VARCHAR(36) PRIMARY KEY,
  process_key      VARCHAR(64) NOT NULL UNIQUE,
  name             VARCHAR(128) NOT NULL,
  process_group    VARCHAR(64),
  description      VARCHAR(512),
  icon             VARCHAR(256),
  -- 草稿数据（最新编辑内容）
  form_schema_json CLOB,
  flow_json        CLOB,
  settings_json    CLOB,
  -- 版本与状态
  latest_version   INT DEFAULT 0,
  status           VARCHAR(16) DEFAULT 'DRAFT',  -- DRAFT / PUBLISHED
  create_by        VARCHAR(64),
  create_time      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted          TINYINT DEFAULT 0
);

-- 流程配置版本快照表（每次发布生成一条不可变快照）
CREATE TABLE IF NOT EXISTS process_config_version (
  id                       VARCHAR(36) PRIMARY KEY,
  config_id                VARCHAR(36) NOT NULL,
  process_key              VARCHAR(64) NOT NULL,
  version                  INT NOT NULL,
  -- 快照数据（发布时刻的完整配置）
  form_schema_json         CLOB,
  flow_json                CLOB,
  settings_json            CLOB,
  bpmn_xml                 CLOB,
  -- Flowable 关联
  flowable_deployment_id   VARCHAR(64),
  flowable_process_def_id  VARCHAR(64),
  -- 发布信息
  published                TINYINT DEFAULT 0,
  publish_time             TIMESTAMP,
  create_by                VARCHAR(64),
  create_time              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_config_version UNIQUE(config_id, version)
);

CREATE INDEX IF NOT EXISTS idx_proc_cfg_key     ON process_config(process_key);
CREATE INDEX IF NOT EXISTS idx_proc_cfg_ver_key  ON process_config_version(process_key, version);
CREATE INDEX IF NOT EXISTS idx_proc_cfg_ver_dep  ON process_config_version(flowable_deployment_id);

-- ============================================================
-- DMS 文档管理：分类 + 文档（v1 骨架，版本/审批留至下一轮）
-- ============================================================

-- DMS 分类（树形，本轮仅建表，前端暂不展开管理 UI）
CREATE TABLE IF NOT EXISTS dms_category (
  id           VARCHAR(36) PRIMARY KEY,
  parent_id    VARCHAR(36),
  name         VARCHAR(128) NOT NULL,
  sort_no      INT DEFAULT 0,
  create_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted      TINYINT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_dms_cat_parent ON dms_category(parent_id);

-- DMS 文档主表（本轮：单文件 + 直存 url；下一轮再拆 dms_document_version）
CREATE TABLE IF NOT EXISTS dms_document (
  id            VARCHAR(36) PRIMARY KEY,
  doc_no        VARCHAR(64),
  title         VARCHAR(256) NOT NULL,
  category_id   VARCHAR(36),
  doc_type      VARCHAR(32),
  tags          VARCHAR(512),
  description   VARCHAR(1024),
  file_url      CLOB,
  file_name     VARCHAR(256),
  file_size     BIGINT,
  mime          VARCHAR(64),
  status        VARCHAR(16) DEFAULT 'DRAFT',
  latest_version INT DEFAULT 1,
  process_instance_id VARCHAR(64),
  create_by     VARCHAR(64),
  create_dept   VARCHAR(64),
  create_time   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted       TINYINT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_dms_doc_no    ON dms_document(doc_no);
CREATE INDEX IF NOT EXISTS idx_dms_doc_cat   ON dms_document(category_id);
CREATE INDEX IF NOT EXISTS idx_dms_doc_type  ON dms_document(doc_type);
CREATE INDEX IF NOT EXISTS idx_dms_doc_stat  ON dms_document(status);

-- v2: DMS 文档版本快照
CREATE TABLE IF NOT EXISTS dms_document_version (
  id           VARCHAR(36) PRIMARY KEY,
  document_id  VARCHAR(36) NOT NULL,
  version_no   INT NOT NULL,
  file_url     CLOB,
  file_name    VARCHAR(256),
  file_size    BIGINT,
  mime         VARCHAR(64),
  change_log   VARCHAR(512),
  create_by    VARCHAR(64),
  create_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dms_doc_ver_doc ON dms_document_version(document_id);

-- v2: DMS 标签字典
CREATE TABLE IF NOT EXISTS dms_tag (
  id           VARCHAR(36) PRIMARY KEY,
  name         VARCHAR(64) NOT NULL,
  color        VARCHAR(16),
  usage_count  INT DEFAULT 0,
  create_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted      TINYINT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_dms_tag_name ON dms_tag(name);

-- v2: DMS 文档-标签关联
CREATE TABLE IF NOT EXISTS dms_doc_tag (
  document_id  VARCHAR(36) NOT NULL,
  tag_id       VARCHAR(36) NOT NULL,
  PRIMARY KEY (document_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_dms_doc_tag_tag ON dms_doc_tag(tag_id);
