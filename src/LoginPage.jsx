import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Form, Input, message } from 'antd';
import {
  BarChartOutlined,
  CheckCircleFilled,
  HeartFilled,
  ThunderboltFilled,
} from '@ant-design/icons';
import heroStack from './assets/hero.png';
import './LoginPage.css';

const LOGIN_TABS = [
  { key: 'account', label: '账号密码登录' },
  { key: 'phone', label: '手机号登录' },
];

function LoginPage({ onLogin }) {
  const [loginType, setLoginType] = useState('phone');
  const [agreementChecked, setAgreementChecked] = useState(true);
  const [captchaSeed, setCaptchaSeed] = useState(0);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [form] = Form.useForm();
  const codeTimerRef = useRef(null);

  const captchaText = useMemo(() => {
    const samples = ['3 MR t', '6 JQ k', '9 HD p', '2 VX m'];
    return samples[captchaSeed % samples.length];
  }, [captchaSeed]);

  const handleGetCode = () => {
    if (codeCountdown > 0) return;
    setCodeCountdown(60);
    message.success('验证码已发送（原型）');
    if (codeTimerRef.current) {
      window.clearInterval(codeTimerRef.current);
    }
    codeTimerRef.current = window.setInterval(() => {
      setCodeCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(codeTimerRef.current);
          codeTimerRef.current = null;
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  useEffect(() => () => {
    if (codeTimerRef.current) {
      window.clearInterval(codeTimerRef.current);
    }
  }, []);

  const handleSubmit = async () => {
    if (!agreementChecked) {
      message.warning('请先阅读并同意用户协议和隐私政策');
      return;
    }

    try {
      await form.validateFields();
      onLogin?.({ loginType });
    } catch {
      // Ant Design will surface field-level validation.
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero" aria-label="AI 原生培训">
        <div className="login-hero-scene">
          <div className="login-hero-headline">
            <h1>AI原生培训</h1>
            <p>AI技术驱动的培训，效果更好，体验更智能</p>
          </div>

          <div className="login-orbit-scene" aria-hidden="true">
            <div className="login-orbit login-orbit-one" />
            <div className="login-orbit login-orbit-two" />
            <div className="login-ai-core">AI</div>
            <img src={heroStack} alt="" className="login-ai-stack" />
          </div>

          <div className="login-feature-bubble login-feature-bubble-left">
            <span className="login-feature-icon">
              <HeartFilled />
            </span>
            <span>AI让学习更懂我，内容和节奏刚刚好！</span>
          </div>
          <div className="login-feature-bubble login-feature-bubble-top">
            <span className="login-feature-icon">
              <ThunderboltFilled />
            </span>
            <span>AI实时支持，学习中问题立刻解决！</span>
          </div>
          <div className="login-feature-bubble login-feature-bubble-right">
            <span className="login-feature-icon">
              <BarChartOutlined />
            </span>
            <span>AI驱动效果追踪，成长看得见！</span>
          </div>

          <div className="login-learner login-learner-primary">
            <div className="login-learner-head" />
            <div className="login-learner-body" />
            <div className="login-learner-laptop" />
          </div>
          <div className="login-learner login-learner-secondary">
            <div className="login-learner-head" />
            <div className="login-learner-body" />
          </div>
          <div className="login-learner login-learner-coach">
            <div className="login-learner-head" />
            <div className="login-learner-body" />
          </div>

          <div className="login-hero-pill">
            <CheckCircleFilled />
            <span>更懂学员 | 更个性化 | 更高效 | 更有效果</span>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-label="登录">
        <div className="login-card">
          <div className="login-title-block">
            <p>欢迎来到</p>
            <h2>通答人工智能教学平台</h2>
          </div>

          <div className="login-tab-list" role="tablist" aria-label="登录方式">
            {LOGIN_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={loginType === tab.key}
                className={`login-tab ${loginType === tab.key ? 'is-active' : ''}`}
                onClick={() => {
                  setLoginType(tab.key);
                  form.resetFields();
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Form form={form} className="login-form" layout="vertical" requiredMark={false} onFinish={handleSubmit}>
            {loginType === 'account' ? (
              <>
                <Form.Item name="account" rules={[{ required: true, message: '请输入账号' }]}>
                  <Input size="large" placeholder="手机号或邮箱" />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                  <Input.Password size="large" placeholder="请输入密码" />
                </Form.Item>
                <div className="login-code-row">
                  <Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }]}>
                    <Input size="large" placeholder="请输入验证码" />
                  </Form.Item>
                  <button
                    type="button"
                    className="login-captcha"
                    onClick={() => setCaptchaSeed((current) => current + 1)}
                    aria-label="刷新图形验证码"
                  >
                    {captchaText}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="login-code-row">
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                    ]}
                  >
                    <Input size="large" placeholder="请输入手机号" />
                  </Form.Item>
                  <Button size="large" className="login-code-button" onClick={handleGetCode} disabled={codeCountdown > 0}>
                    {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
                  </Button>
                </div>
                <Form.Item name="smsCode" rules={[{ required: true, message: '请输入验证码' }]}>
                  <Input size="large" placeholder="请输入验证码" />
                </Form.Item>
              </>
            )}

            <Button type="primary" htmlType="submit" size="large" className="login-submit">
              立即登录
            </Button>
          </Form>

          <Checkbox checked={agreementChecked} onChange={(event) => setAgreementChecked(event.target.checked)} className="login-agreement">
            我已阅读并同意
            <button type="button" className="login-link-button">用户协议</button>
            和
            <button type="button" className="login-link-button">隐私政策</button>
          </Checkbox>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
