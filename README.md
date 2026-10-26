# Shopkit

Orders, stock and payments API for small shops. No dependencies, it runs on Node 24.

```bash
SESSION_SECRET=dev-secret npm start
npm test
```

## Layout

| Folder | What's there |
|---|---|
| `src/lib` | Money, pagination, dates and retries, shared by everything |
| `src/auth` | Password hashing and session tokens |
| `src/users`, `src/products`, `src/orders`, `src/payments` | One folder per domain: a `repo.ts` for SQL, a `service.ts` for the rules |
| `src/http` | The router and the routes, no business rules in here |

## Conventions

- Money is always an integer in the currency's minor units (cents, or yen). Use `src/lib/money.ts`, never floats.
- Routes call services, services call repos. Only repos write SQL, always with parameters.
- Every date is stored and compared in UTC.
