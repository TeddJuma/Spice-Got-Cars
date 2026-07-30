import server from '../dist/server/server.js';
import { readFile } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = join(__dirname, '..', 'dist', 'client');

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getStaticFile(urlPathname) {
  return new Promise((resolve) => {
    const cleanPath = urlPathname.startsWith('/') ? urlPathname.slice(1) : urlPathname;
    
    if (!cleanPath || cleanPath.includes('..')) {
      resolve(null);
      return;
    }

    const ext = extname(cleanPath).toLowerCase();
    if (!ext || !MIME_TYPES[ext]) {
      resolve(null);
      return;
    }

    const filePath = join(STATIC_DIR, cleanPath);
    readFile(filePath)
      .then((file) => {
        resolve({ file, contentType: MIME_TYPES[ext] });
      })
      .catch(() => resolve(null));
  });
}

export default async function (req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] ?? 'https';
    const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost';
    const url = new URL(req.url, `${protocol}://${host}`);

    console.error('[vercel] request:', req.method, url.pathname);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.set(key, value);
      }
    }

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const body = hasBody
      ? new ReadableStream({
          start(controller) {
            req.on('data', (chunk) => controller.enqueue(chunk));
            req.on('end', () => controller.close());
            req.on('error', (err) => controller.error(err));
          },
        })
      : undefined;

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
      duplex: hasBody ? 'half' : undefined,
    });

    if (req.method === 'GET') {
      const staticFile = await getStaticFile(url.pathname);
      if (staticFile) {
        res.statusCode = 200;
        res.setHeader('Content-Type', staticFile.contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.write(staticFile.file);
        res.end();
        return;
      }
    }

    console.error('[vercel] proxying to SSR:', req.method, url.pathname);

    let response;
    try {
      response = await server.fetch(request);
    } catch (err) {
      console.error('[vercel] server fetch failed:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Internal Server Error');
      return;
    }

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }

    res.end();
  } catch (err) {
    console.error('[vercel] handler error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Internal Server Error');
  }
}
