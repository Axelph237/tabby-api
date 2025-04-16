import { Elysia } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { ServiceError } from '@utils/types/serviceError'
import { sql } from 'bun'
import { UUID } from '@utils/types/uuid'
import { Order, OrderLineItem } from './order.validation'

interface ControllerConfig {
	name?: string
}

export const orderController = (init?: ControllerConfig) => new Elysia({
	name: init?.name ?? "orderController"
})
	.use(authMiddleware)
	.resolve(({ user }) => {
		const userId = user?.id ?? null;

		return {
			[init?.name ?? "orderController"]: {
				/**
				 * 3.1 - Gets a list of all orders for a given session.
				 * @param sessionId - The session id to search for orders on.
				 */
				getOrders: async (
					sessionId: UUID
				): Promise<Order[]> => {
					try {
						return await sql`
							WITH valid_session AS (
							    SELECT sessions.id
							    FROM public.sessions
							    JOIN public.menus ON menus.id = sessions.menu_id
							    WHERE created_by = ${userId} 
							      AND sessions.id = ${sessionId}
							)
							SELECT *
							FROM public.orders
							WHERE session_id = (SELECT id FROM valid_session);`;
					}
					catch (e) {
						throw new ServiceError("Failed to get session's orders.", e);
					}
				},

				/**
				 * 3.2 - Creates a new order, validating cart cost before insertion.
				 * @param guest - The name of the guest placing the order.
				 * @param sessionId - The session id for the order to be created on.
				 * @param placedAt - The time the order was placed.
				 * @param items - The line items in the order.
				 */
				createOrder: async (
					guest: string,
					sessionId: UUID,
					placedAt: Date,
					items: Omit<OrderLineItem, "id" | "order_id" | "unit_price">[]
				): Promise<number> => {
					try {
						return await sql.begin(async tx => {
							// Create order
							const [order] = await tx`
								INSERT INTO public.orders (guest_name, session_id, placed_at, status)
								VALUES (${guest}, ${sessionId}, ${placedAt}, 'placed')
								RETURNING id, order_num;`;
							console.log("Inserting line items")
							// Insert items
							await tx`
								INSERT INTO public.order_line_items ${sql(
                                        items.map(v => ({
                                            item_id: v.item_id,
                                            count: v.count,
                                            selections: v.selections.length != 0 ? v.selections : null,
                                            order_id: order.id
                                        }))
								)};`;

							console.log("Done inserting items")
							return order.order_num;
						});
					}
					catch (e) {
						throw new ServiceError("Failed to create new order.", e);
					}
				},

				/**
				 * 3.3 - Cancels an order in the session.
				 * @param orderId - The order to cancel.
				 */
				cancelOrder: async (
					orderId: number
				): Promise<void> => {
					try {
						await sql`
							WITH user_sessions AS (
							    SELECT session_id as id
							    FROM public.session_admins
							    WHERE user_id = ${userId}
							)
							UPDATE public.orders AS o
							SET status = 'canceled'
							WHERE id = ${orderId}
								AND EXISTS (
									SELECT 1
									FROM user_sessions AS us
									WHERE us.id = o.session_id
								);`;
					}
					catch (e) {
						throw new ServiceError("Failed to cancel order.", e);
					}
				}



			}
		}
	})
	.as("plugin")
