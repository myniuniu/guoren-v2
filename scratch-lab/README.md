# Scratch Lab

This folder isolates the official Scratch GUI from the main React 19 app.
Scratch GUI currently declares a React 16 peer dependency, so it should not be installed in the root project.

## Build local Scratch assets

Run these commands from the project root:

```bash
npm run scratch-lab:install
npm run scratch-lab:build
```

The build script copies the installed Scratch GUI web editor into:

```text
public/scratch-lab/
```

The main app loads the lab from:

```text
/scratch-lab/index.html
```
