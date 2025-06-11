import db from '@config/drizzle/db'
import Repository from '@utils/types/repository'
import { UUID } from '@utils/types/typebox/uuid'
import { eq } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { Timeless } from '@utils/types/typebox/timeless'
import { _projSelect } from '@config/drizzle/query-wrappers'
import { SelectProjection } from '@utils/types/drizzle/queries'
import { sessionsTable } from '@config/drizzle/tables/sessions.table'

export type Session = typeof sessionsTable.$inferSelect
export type NewSession = typeof sessionsTable.$inferInsert
export const tSession = createSelectSchema(sessionsTable);
export const tNewSession = createInsertSchema(sessionsTable);

type SessionsProjection = SelectProjection<typeof sessionsTable>;

class SessionRepository extends Repository<typeof sessionsTable> {
    index(projection?: SessionsProjection) {
        return _projSelect(projection).from(sessionsTable).$dynamic();
    }

    get(id: UUID, projection?: SessionsProjection) {
        return _projSelect(projection).from(sessionsTable).where(eq(sessionsTable.id, id)).$dynamic();
    }

    create(session: Timeless<NewSession>) {
        return db.insert(sessionsTable).values(session).returning().$dynamic();
    }

    update(session: Partial<NewSession> & Pick<Session, "id">) {
        return db.update(sessionsTable).set(session).where(eq(sessionsTable.id, session.id)).$dynamic();
    }

    remove(id: UUID) {
        return db.delete(sessionsTable).where(eq(sessionsTable.id, id)).$dynamic();
    }
}

export default SessionRepository;