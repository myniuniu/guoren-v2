import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { createServer as createHttpServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { extname, resolve, sep } from 'node:path';

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function isPathInsideRoot(rootPath, targetPath) {
  return targetPath === rootPath || targetPath.startsWith(`${rootPath}${sep}`);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function pipeProxyRequest(req, res, backendUrl, requestUrl) {
  const transport = backendUrl.protocol === 'https:' ? httpsRequest : httpRequest;
  const proxyReq = transport(
    {
      protocol: backendUrl.protocol,
      hostname: backendUrl.hostname,
      port: backendUrl.port,
      method: req.method,
      path: `${requestUrl.pathname}${requestUrl.search}`,
      headers: {
        ...req.headers,
        host: backendUrl.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (error) => {
    console.error('[electron] backend proxy failed:', error);
    if (res.headersSent) {
      res.end();
      return;
    }
    sendJson(res, 502, {
      message: '无法连接后端服务',
      detail: backendUrl.origin,
    });
  });

  req.pipe(proxyReq);
}

async function serveStaticAsset(res, filePath, requestPathname) {
  const extension = extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[extension] || 'application/octet-stream';
  const cacheControl = requestPathname.startsWith('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
  });
  createReadStream(filePath).pipe(res);
}

async function resolveStaticFile(distRoot, requestPathname) {
  const relativePath = requestPathname === '/' ? 'index.html' : `.${requestPathname}`;
  const candidatePath = resolve(distRoot, relativePath);
  if (!isPathInsideRoot(distRoot, candidatePath)) {
    return null;
  }
  return (await fileExists(candidatePath)) ? candidatePath : null;
}

export async function startAppServer({ distDir, backendOrigin }) {
  const distRoot = resolve(distDir);
  const indexPath = resolve(distRoot, 'index.html');
  const backendUrl = new URL(backendOrigin);

  if (!(await fileExists(indexPath))) {
    throw new Error(`Missing renderer build output: ${indexPath}`);
  }

  const server = createHttpServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');

      if (requestUrl.pathname.startsWith('/api/')) {
        pipeProxyRequest(req, res, backendUrl, requestUrl);
        return;
      }

      const assetPath = await resolveStaticFile(distRoot, requestUrl.pathname);
      if (assetPath) {
        await serveStaticAsset(res, assetPath, requestUrl.pathname);
        return;
      }

      await serveStaticAsset(res, indexPath, '/index.html');
    } catch (error) {
      console.error('[electron] local app server failed:', error);
      if (!res.headersSent) {
        sendJson(res, 500, { message: '桌面端静态资源服务启动失败' });
      } else {
        res.end();
      }
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', rejectListen);
      resolveListen();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve desktop app server port.');
  }

  const origin = `http://127.0.0.1:${address.port}`;
  return {
    origin,
    close: () =>
      new Promise((resolveClose, rejectClose) => {
        server.close((error) => {
          if (error) {
            rejectClose(error);
            return;
          }
          resolveClose();
        });
      }),
  };
}
