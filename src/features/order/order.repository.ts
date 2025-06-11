import db from '@config/drizzle/db'
import Repository from '@utils/types/repository'
import { eq } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { Timeless } from '@utils/types/typebox/timeless'
import { projSelect } from '@config/drizzle/query-wrappers'
import { SelectProjection } from '@utils/types/drizzle/queries'
import { orderLineItemsTable, ordersTable } from '@config/drizzle/tables/orders.table'

export type Order = typeof ordersTable.$inferSelect
export type NewOrder = typeof ordersTable.$inferInsert
export const tOrder = createSelectSchema(ordersTable);
export const tNewOrder = createInsertSchema(ordersTable);

export type OrderLineItem = typeof orderLineItemsTable.$inferSelect
export type NewOrderLineItem = typeof orderLineItemsTable.$inferInsert
export const tOrderLineItem = createSelectSchema(orderLineItemsTable);
export const tNewOrderLineItem = createInsertSchema(orderLineItemsTable);

type OrderProjection = SelectProjection<typeof ordersTable>;

class OrderRepository extends Repository<typeof ordersTable> {
	index(projection?: OrderProjection) {
		return projSelect(projection).from(ordersTable).$dynamic();
	}

	get(id: number, projection?: OrderProjection) {
		return projSelect(projection).from(ordersTable).where(eq(ordersTable.id, id)).$dynamic();
	}

	create(order: Timeless<NewOrder>) {
		return db.insert(ordersTable).values(order).returning().$dynamic();
	}

	update(order: Partial<NewOrder> & Pick<Order, "id">) {
		return db.update(ordersTable).set(order).where(eq(ordersTable.id, order.id)).$dynamic();
	}

	remove(id: number) {
		return db.delete(ordersTable).where(eq(ordersTable.id, id)).$dynamic();
	}

	$setStatus(id: number, status: string) {
        return db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).$dynamic();
    }

    $place(order: Omit<Timeless<NewOrder>, "status"> & { items: NewOrderLineItem[] }) {
        const { items, ...orderDetails } = order;

        return db.transaction(async (tx) => {
            // Create order
            const insertResult = await tx.insert(ordersTable)
                .values({ status: "open", ...orderDetails})
                .returning({ id: ordersTable.id });
            
            const orderId = insertResult[0]?.id;
            if (!orderId)
                tx.rollback();
            
            // Insert items
            await tx.insert(orderLineItemsTable).values(items);

            // Set order status to "waiting"
            await tx.update(ordersTable).set({ status: "waiting" }).where(eq(ordersTable.id, orderId));

            // Return full order object
            return await tx.query.ordersTable.findFirst({
                where: eq(ordersTable.id, orderId),
                with: {
                    lineItems: true
                }
            })
        })
    }
}

export default OrderRepository;