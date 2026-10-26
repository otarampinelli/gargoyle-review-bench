import type { Config } from '../config.ts';
import type { Db } from '../db.ts';
import { ClientError } from '../errors.ts';
import { parsePage } from '../lib/pagination.ts';
import { listOrdersForUser } from '../orders/repo.ts';
import { createOrder, getOrderForUser, type OrderLine } from '../orders/service.ts';
import type { PaymentGateway } from '../payments/gateway.ts';
import { payOrder } from '../payments/service.ts';
import { listProducts } from '../products/repo.ts';
import { login, register } from '../users/service.ts';
import { Router } from './server.ts';
import { id, object, string } from './validate.ts';

export function routes(db: Db, config: Config, gateway: PaymentGateway): Router {
  const router = new Router();

  router.add(
    'POST',
    '/users',
    async ({ body }) => {
      const input = object(body);
      const user = await register(db, {
        email: string(input, 'email'),
        name: string(input, 'name'),
        password: string(input, 'password'),
      });
      return { status: 201, body: { id: user.id, email: user.email, name: user.name } };
    },
    { auth: false },
  );

  router.add(
    'POST',
    '/sessions',
    async ({ body }) => {
      const input = object(body);
      const token = await login(db, config, string(input, 'email'), string(input, 'password'));
      if (!token) {
        throw new ClientError(401, 'wrong email or password');
      }
      return { status: 201, body: { token } };
    },
    { auth: false },
  );

  router.add('GET', '/products', ({ url }) => ({ status: 200, body: listProducts(db, parsePage(url.searchParams)) }), {
    auth: false,
  });

  router.add('POST', '/orders', ({ body, userId }) => {
    const lines = object(body).lines;
    if (!Array.isArray(lines)) {
      throw new ClientError(400, 'lines must be an array');
    }
    const order = createOrder(db, userId, lines as OrderLine[]);
    return { status: 201, body: order };
  });

  router.add('GET', '/orders', ({ url, userId }) => ({
    status: 200,
    body: listOrdersForUser(db, userId, parsePage(url.searchParams)),
  }));

  router.add('GET', '/orders/:id', ({ params, userId }) => ({
    status: 200,
    body: getOrderForUser(db, id(params.id, 'order'), userId),
  }));

  router.add('POST', '/orders/:id/pay', async ({ params, userId }) => ({
    status: 200,
    body: await payOrder(db, gateway, id(params.id, 'order'), userId),
  }));

  return router;
}
