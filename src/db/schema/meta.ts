/* eslint-disable sort-keys-fix/sort-keys-fix */
import { json, pgTable, varchar } from 'drizzle-orm/pg-core';

import { generateId } from '@/libs/id';

export const meta = pgTable('meta', {
  id: varchar('id', { length: 30 })
    .$defaultFn(() => generateId())
    .primaryKey(),
  avatar: varchar('avatar', { length: 10 }),
  description: varchar('description', { length: 500 }),
  title: varchar('title', { length: 255 }),
  tags: json('tags').$type<string[]>().notNull(),
});

export type Meta = typeof meta.$inferSelect;
