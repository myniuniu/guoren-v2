import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import formCreate from '@form-create/element-ui'
import FcDesigner from '@form-create/designer'
import App from './App.vue'
import router from './router'
import GrCarousel from './components/GrCarousel.vue'
import GrImageList from './components/GrImageList.vue'

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })
app.use(formCreate)
app.use(FcDesigner)
app.use(router)
app.component('GrCarousel', GrCarousel)
app.component('GrImageList', GrImageList)
// 注册到 form-create 渲染器
formCreate.component('GrCarousel', GrCarousel)
formCreate.component('GrImageList', GrImageList)
app.mount('#app')
