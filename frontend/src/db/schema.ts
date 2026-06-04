import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('frontend_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
