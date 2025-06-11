import db from '@config/drizzle/db'
import Repository from '@utils/types/repository'
import { UUID } from '@utils/types/typebox/uuid'
import { eq } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { Timeless } from '@utils/types/typebox/timeless'
import { _projSelect } from '@config/drizzle/query-wrappers'
import { SelectProjection } from '@utils/types/drizzle/queries'
import { usersTable } from '@config/drizzle/tables/users.table'

export type User = typeof usersTable.$inferSelect
export type NewUser = typeof usersTable.$inferInsert
export const tUser = createSelectSchema(usersTable);
export const tNewUser = createInsertSchema(usersTable);

type UsersProjection = SelectProjection<typeof usersTable>;

class UserRepository extends Repository<typeof usersTable> {
    index(projection?: UsersProjection) {
        return _projSelect<typeof usersTable>(projection).from(usersTable).$dynamic();
    }

    get(id: UUID, projection?: UsersProjection) {
        return _projSelect<typeof usersTable>(projection).from(usersTable).where(eq(usersTable.id, id)).$dynamic();
    }

    create(user: Timeless<NewUser>) {
        return db.insert(usersTable).values(user).returning().$dynamic();
    }

    update(user: Partial<NewUser> & Pick<User, "id">) {
        return db.update(usersTable).set(user).where(eq(usersTable.id, user.id)).$dynamic();
    }

    remove(id: UUID) {
        return db.delete(usersTable).where(eq(usersTable.id, id)).$dynamic();
    }
}

export default UserRepository;