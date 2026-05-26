import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// dev 下给所有原生 HTML JSX 元素注入 data-src-file / data-src-line / data-src-col
// 供在线开发模块可视化编辑 “查看代码” 准确定位使用
const injectJsxSourceLoc = function ({ types: t }) {
  return {
    name: 'inject-jsx-source-loc',
    visitor: {
      JSXOpeningElement(path, state) {
        if (!path.node.name || path.node.name.type !== 'JSXIdentifier') return
        const name = path.node.name.name
        // 仅原生 HTML 元素（小写开头）
        if (!/^[a-z]/.test(name)) return
        const loc = path.node.loc
        if (!loc) return
        const file = state.filename || ''
        // 跳过 node_modules
        if (file.includes('/node_modules/')) return
        const has = (n) => path.node.attributes.some(a => a.type === 'JSXAttribute' && a.name && a.name.name === n)
        if (has('data-src-line')) return
        path.node.attributes.push(
          t.jsxAttribute(t.jsxIdentifier('data-src-file'), t.stringLiteral(file)),
          t.jsxAttribute(t.jsxIdentifier('data-src-line'), t.stringLiteral(String(loc.start.line))),
          t.jsxAttribute(t.jsxIdentifier('data-src-col'), t.stringLiteral(String(loc.start.column + 1))),
        )
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: mode === 'development' ? [injectJsxSourceLoc] : [],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
}))
