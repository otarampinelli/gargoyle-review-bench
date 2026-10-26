import { openDb, type Db } from '../src/db.ts';
import { insertProduct, type Product } from '../src/products/repo.ts';
import { insertUser, type User } from '../src/users/repo.ts';

export function seed(): { db: Db; user: User; other: User; mug: Product; shirt: Product } {
  const db = openDb();
  const user = insertUser(db, { email: 'ana@example.com', name: 'Ana Souza', passwordHash: 'x:y' });
  const other = insertUser(db, { email: 'bo@example.com', name: 'Bo', passwordHash: 'x:y' });
  const mug = insertProduct(db, { sku: 'MUG-1', name: 'Mug', priceMinor: 1250, currency: 'USD', stock: 3 });
  const shirt = insertProduct(db, { sku: 'TEE-1', name: 'Shirt', priceMinor: 2000, currency: 'USD', stock: 10 });
  return { db, user, other, mug, shirt };
}
