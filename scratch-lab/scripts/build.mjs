import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const labRoot = path.resolve(scriptDir, '..');
const workspaceRoot = path.resolve(labRoot, '..');
const outputDir = path.resolve(workspaceRoot, 'public', 'scratch-lab');

function resolveScratchGuiRoot() {
  try {
    return path.dirname(require.resolve('scratch-gui/package.json'));
  } catch (error) {
    throw new Error(
      'scratch-gui is not installed. Run `npm run scratch-lab:install` from the project root first.',
    );
  }
}

async function hasIndexHtml(dir) {
  if (!existsSync(dir)) return false;
  try {
    const stat = await fs.stat(path.join(dir, 'index.html'));
    return stat.isFile();
  } catch {
    return false;
  }
}

async function copyDirectory(source, target) {
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(target, { recursive: true });
  await fs.cp(source, target, { recursive: true });
}

async function main() {
  const scratchGuiRoot = resolveScratchGuiRoot();
  const candidates = [
    path.join(scratchGuiRoot, 'build'),
    path.join(scratchGuiRoot, 'dist'),
    path.join(scratchGuiRoot, 'www'),
    scratchGuiRoot,
  ];

  let sourceDir = null;
  for (const candidate of candidates) {
    if (await hasIndexHtml(candidate)) {
      sourceDir = candidate;
      break;
    }
  }

  if (!sourceDir) {
    throw new Error(
      [
        `scratch-gui was found at ${scratchGuiRoot}, but no prebuilt Scratch editor index.html was found.`,
        'Build the Scratch GUI package first, then rerun `npm run scratch-lab:build`.',
        'Expected one of these folders to contain index.html:',
        ...candidates.map((candidate) => `- ${candidate}`),
      ].join('\n'),
    );
  }

  await copyDirectory(sourceDir, outputDir);
  console.log(`[scratch-lab] Copied Scratch editor from ${sourceDir} to ${outputDir}`);
}

main().catch((error) => {
  console.error(`[scratch-lab] ${error.message}`);
  process.exit(1);
});
