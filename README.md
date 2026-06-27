# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Electron Desktop Shell

This repo now includes a desktop shell for the main app.

### Development

```bash
npm run dev:desktop
```

This starts Vite and then launches Electron against the dev server.

### Build

```bash
npm run build:desktop
```

This builds the web app first and then packages a macOS desktop app into `release/`.

### External services not bundled

The Electron shell only packages the main Vite app. These services still need to be started separately when you use related modules:

- `http://localhost:8080` for backend `/api`
- `http://localhost:5176` for `workflow-designer`
- `http://127.0.0.1:5177` for `amis-designer`
- `http://localhost:8443` for `code-server`
