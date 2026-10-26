import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { verifySessionToken } from '../auth/sessions.ts';
import type { Config } from '../config.ts';
import { ClientError } from '../errors.ts';

const MAX_BODY_BYTES = 1024 * 1024;

export interface Context {
  url: URL;
  params: Record<string, string>;
  body: unknown;
  /** set on routes that need a session */
  userId: number;
}

export interface Reply {
  status: number;
  body?: unknown;
}

export type Handler = (ctx: Context) => Promise<Reply> | Reply;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  auth: boolean;
  handler: Handler;
}

export class Router {
  readonly #routes: Route[] = [];

  add(method: string, path: string, handler: Handler, options: { auth?: boolean } = {}): void {
    const keys: string[] = [];
    const source = path.replace(/:(\w+)/g, (_, key: string) => {
      keys.push(key);
      return '([^/]+)';
    });
    this.#routes.push({ method, pattern: new RegExp(`^${source}$`), keys, auth: options.auth ?? true, handler });
  }

  match(method: string, pathname: string): { route: Route; params: Record<string, string> } | undefined {
    for (const route of this.#routes) {
      const found = route.method === method && route.pattern.exec(pathname);
      if (found) {
        const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(found[i + 1]!)]));
        return { route, params };
      }
    }
    return undefined;
  }
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) {
      throw new ClientError(413, 'request body too large');
    }
    chunks.push(chunk as Buffer);
  }
  if (size === 0) {
    return undefined;
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ClientError(400, 'body is not valid JSON');
  }
}

function send(res: ServerResponse, reply: Reply): void {
  res.writeHead(reply.status, { 'content-type': 'application/json' });
  res.end(reply.body === undefined ? '' : JSON.stringify(reply.body));
}

function sessionUser(req: IncomingMessage, config: Config): number | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return undefined;
  }
  return verifySessionToken(header.slice('Bearer '.length), config.sessionSecret);
}

export function startServer(router: Router, config: Config): Server {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const found = router.match(req.method ?? 'GET', url.pathname);
      if (!found) {
        return send(res, { status: 404, body: { error: 'not found' } });
      }
      const userId = sessionUser(req, config);
      if (found.route.auth && userId === undefined) {
        return send(res, { status: 401, body: { error: 'sign in first' } });
      }
      const body = await readJson(req);
      send(res, await found.route.handler({ url, params: found.params, body, userId: userId ?? 0 }));
    } catch (error) {
      if (error instanceof ClientError) {
        return send(res, { status: error.status, body: { error: error.message } });
      }
      console.error(error);
      send(res, { status: 500, body: { error: 'internal error' } });
    }
  });
  server.listen(config.port);
  return server;
}
