import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import formCreate from '@form-create/element-ui'
import FcDesigner from '@form-create/designer'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })
app.use(formCreate)
app.use(FcDesigner)
app.use(router)
app.mount('#app')
