import db from '@config/drizzle/db'
import Repository from '@utils/types/repository'
import { UUID } from '@utils/types/typebox/uuid'
import { eq, sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { Timeless } from '@utils/types/typebox/timeless'
import { projSelect } from '@config/drizzle/query-wrappers'
import { SelectProjection } from '@utils/types/drizzle/queries'
import { accountsTable } from '@config/drizzle/tables/accounts.table'
import { ParsedOAuth2Tokens } from '@utils/parseOAuthTokens'
import UserRepository, { NewUser, User } from '@features/user/user.repository'
import { randomUUIDv7 } from 'bun'
import { NeonTransaction } from 'drizzle-orm/neon-http'
import { usersTable } from '@config/drizzle/tables/users.table'

export type Account = typeof accountsTable.$inferSelect
export type NewAccount = typeof accountsTable.$inferInsert
export const tAccount = createSelectSchema(accountsTable);
export const tNewAccount = createInsertSchema(accountsTable);

type AccountsProjection = SelectProjection<typeof accountsTable>;

class AccountRepository extends Repository<typeof accountsTable> {
    index(projection?: AccountsProjection) {
        return projSelect<typeof accountsTable>(projection).from(accountsTable).$dynamic();
    }

    get(id: UUID, projection?: AccountsProjection) {
        return projSelect<typeof accountsTable>(projection).from(accountsTable).where(eq(accountsTable.id, id)).$dynamic();
    }

    create(account: Timeless<NewAccount>) {
        return db.insert(accountsTable).values(account).returning().$dynamic();
    }

    update(account: Partial<NewAccount> & Pick<Account, "id">) {
        return db.update(accountsTable).set(account).where(eq(accountsTable.id, account.id)).$dynamic();
    }

    remove(id: UUID) {
        return db.delete(accountsTable).where(eq(accountsTable.id, id)).$dynamic();
    }

    async $createOAuthAccount(
        provider: string, 
        tokens: ParsedOAuth2Tokens, 
        userInfo: Partial<Omit<Timeless<User>, "id">> & Pick<User, "email" | "emailVerified">
    ) {
        const userRepo = new UserRepository();
        
        // Get existing user's id
        const [ firstRow ] = await userRepo.$getByEmail(userInfo.email);

        const userId = firstRow?.id as string ?? randomUUIDv7();
        // Format user and account objects
		const user: NewUser = {
			id: userId,
			...userInfo
		}
		const account: NewAccount = {
			id: randomUUIDv7(),
			userId: userId,
			providerId: provider,
			...tokens
		}

        const result = await db.batch([
            userRepo.create(user).onConflictDoUpdate({ target: usersTable.id, set: user }),
            this.create(account).onConflictDoUpdate({ target: [accountsTable.providerId, accountsTable.userId], set: account })
        ])

        return userId;
    }
}

export default AccountRepository;