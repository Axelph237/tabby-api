import { Static, t } from 'elysia'
import { sql, SQL } from 'bun'
import { Value } from '@sinclair/typebox/value'
import {
	UUID,
	uuidObj,
	Menu,
	menuObj,
	Item,
	ItemOption,
	ItemDetails,
	ItemSelection,
	itemObj,
	itemDetailsObj,
	itemOptionObj,
	itemSelectObj,
	CartDetails,
	CartItemDetails,
	cartDetailsObj,
	cartItemDetailsObj, Order, OrderLineItem,
} from '../+types/schema'
import { ServiceError } from '../+types/errors'
import { dbConnectionUri } from '../database'

// Service garbage collection if module closes
const registry = new FinalizationRegistry((db: SQL) => db.close())
export class PgsqlService {
	private static instance: PgsqlService
	private readonly db: SQL

	private constructor() {
		this.db = new SQL(dbConnectionUri);

		this.db.connect().then((db) => {
			console.log('[PGService] Connected to database.')
		})

		registry.register(this, this.db)
	}

	static getInstance(): PgsqlService {
		if (!PgsqlService.instance) {
			PgsqlService.instance = new PgsqlService()
		}
		return PgsqlService.instance
	}

	// ---- QUERY FUNCTIONS
	// 1.1
	private basicMenu = t.Object({
		id: uuidObj,
		name: t.String(),
	})
	getMenu = async (
		menuId: UUID,
		ownerId: UUID
	): Promise<Static<typeof this.basicMenu>> => {
		try {
			const [menu] = await this.db`
				SELECT id, name
				FROM menus
				WHERE id = ${menuId} AND created_by = ${ownerId}
			`
			Value.Assert(this.basicMenu, menu)

			return menu
		} catch (e) {
			throw new ServiceError('Failed to get menu', e)
		}
	}

	// 1.2
	getItemsFromMenu = async (
		menuId: UUID
	): Promise<ItemDetails[]> => {
		try {
			// Function abstracted for better management
			const result = await this
				.db`SELECT * FROM get_items_from_menu(${menuId})`

			Value.Assert(t.Array(itemDetailsObj), result)

			return result
		} catch (e) {
			throw new ServiceError('Failed to get items from menu.', e)
		}
	}

	// 1.3
	private menuList = t.Array(menuObj)
	getUserMenus = async (
		userId: UUID
	): Promise<Static<typeof this.menuList>> => {
		try {
			const result = await this.db`
				SELECT *
				FROM menus
				WHERE created_by = ${userId}`

			Value.Assert(this.menuList, result)

			return result
		} catch (e) {
			throw new ServiceError("Failed to get user's menus.", e)
		}
	}

	// 1.4
	createMenu = async (name: string, userId: UUID): Promise<Menu> => {
		try {
			const [menu] = await this.db`
				INSERT INTO menus (name, created_by)
				VALUES (${name}, ${userId})
				RETURNING *`

			Value.Assert(menuObj, menu)
			return menu
		} catch (e) {
			throw new ServiceError('Failed to create new menu.', e)
		}
	}

	// 1.4
	addItemToMenu = async (
		menuId: UUID,
		itemId: number,
		ownerId: UUID
	): Promise<void> => {
		try {
			await this.db`
				WITH valid_item AS (
					SELECT id FROM items
					WHERE id = ${itemId} AND created_by = ${ownerId}
				), valid_menu AS (
				    SELECT id FROM menus
				 	WHERE id = ${menuId} AND created_by = ${ownerId}
				)
				INSERT INTO items_to_menus (item_id, menu_id)
				VALUES (
				    (SELECT id FROM valid_item),
				    (SELECT id FROM valid_menu)
				);`;
		} catch (e) {
			throw new ServiceError('Failed to add existing item to menu.', e)
		}
	}

	/**
	 * Removes an item's relation to a menu. Does not delete the item itself.
	 * @param menuId - The menu to delete the item from.
	 * @param itemId - The item to delete.
	 * @param ownerId - The owner of the item and menu
	 * @returns true if the operation was successful, null if there was an error.
	 */
	deleteItemFromMenu = async (
		menuId: UUID,
		itemId: number,
		ownerId: UUID
	): Promise<void> => {
		try {
			this.db`
                WITH valid_item AS (
                    SELECT id FROM items
                    WHERE id = ${itemId} AND created_by = ${ownerId}
                ), valid_menu AS (
                    SELECT id FROM menus
                    WHERE id = ${menuId} AND created_by = ${ownerId}
                )
				DELETE FROM items_to_menus 
				    WHERE item_id = (SELECT id FROM valid_item)
				    AND menu_id = (SELECT id FROM valid_menu);`;
		} catch (e) {
			throw new ServiceError('Failed to delete item from menu.', e)
		}
	}

	getUserItems = async (
		userId: UUID
	): Promise<ItemDetails[]> => {
		try {
			// Function abstracted for better management
			const result = await this
				.db`SELECT * FROM get_user_items(${userId})`
			Value.Assert(t.Array(itemDetailsObj), result)

			return result
		} catch (e) {
			throw new ServiceError("Failed to get the user's items.", e)
		}
	}

	createItem = async (
		userId: UUID,
		item: Omit<Item, 'id' | 'created_by' | 'created_at'>
	): Promise<number> => {
		try {
			const fullItem = {
				...item,
				created_by: userId,
			}

			const [resultItem] = await this
				.db`INSERT INTO items ${sql(fullItem)} RETURNING id;`
			Value.Assert(t.Integer(), resultItem.id)

			return resultItem.id
		} catch (e) {
			throw new ServiceError('Failed to create new item.', e)
		}
	}

	deleteItems = async (
		userId: UUID,
		itemIds: number[]
	): Promise<void> => {
		try {
			await this
				.db`DELETE FROM items WHERE created_by = ${userId} AND id = ANY ${itemIds};`
		} catch (e) {
			throw new ServiceError('Failed to delete item.', e)
		}
	}

	updateItem = async (
		userId: UUID,
		itemId: number,
		updateVals: Partial<Omit<Item, "id" | "created_by" | "created_at">>
	): Promise<Item> => {
		try {
			const [item] = await this
				.db`UPDATE items SET ${sql(updateVals)} WHERE created_by = ${userId} AND id = ${itemId} RETURNING *;`

			Value.Assert(itemObj, item)
			return item
		} catch (e) {
			throw new ServiceError('Failed to update item.', e)
		}
	}

	createOption = async (
		userId: UUID,
		itemId: number,
		newOpt: Omit<ItemOption, 'id' | 'created_by' | 'item_id'>
	): Promise<ItemOption> => {
		try {
			const fullOpt = {
				...newOpt,
				created_by: userId,
				item_id: itemId,
			}
			const [option] = await this
				.db`INSERT INTO item_options ${sql(fullOpt)} RETURNING *;`

			Value.Assert(itemOptionObj, option)
			return option
		} catch (e) {
			throw new ServiceError('Failed to create new option on item.', e)
		}
	}

	deleteOptions = async (
		userId: UUID,
		itemId: number,
		optionIds: number[]
	): Promise<void> => {
		try {
			await this.db`DELETE FROM item_options 
       			WHERE created_by = ${userId}
       			  AND item_id = ${itemId}
       			  AND id = ANY ${optionIds} RETURNING label, item_id;`
		} catch (e) {
			throw new ServiceError('Failed to delete option on item.', e)
		}
	}

	updateOption = async (
		userId: UUID,
		itemId: number,
		optionId: number,
		updates: Partial<ItemOption>
	): Promise<ItemOption> => {
		try {
			const [updated] = await this
				.db`UPDATE item_options SET ${sql(updates)}
				WHERE created_by = ${userId}
					AND item_id = ${itemId}
					AND id = ${optionId}
				RETURNING *;`

			return updated
		} catch (e) {
			throw new ServiceError('Failed to update option on item.', e)
		}
	}

	createSelection = async (
		userId: UUID,
		optionId: number | null,
		selection: Omit<ItemSelection, 'id' | 'created_by' | 'option_id'>
	): Promise<ItemSelection> => {
		try {
			const fullSel = {
				...selection,
				created_by: userId,
				option_id: optionId,
			}

			const [sel] = await this
				.db`INSERT INTO item_option_selections ${sql(fullSel)} RETURNING *;`

			Value.Assert(itemSelectObj, sel)
			return sel
		} catch (e) {
			throw new ServiceError('Failed to create new option selection.', e)
		}
	}

	deleteSelections = async (
		userId: UUID,
		selectionIds: number[]
	): Promise<void> => {
		try {
			const result = await this.db`
				DELETE FROM item_option_selections
				WHERE created_by = ${userId}
					AND id = ANY ${selectionIds};`;
		} catch (e) {
			throw new ServiceError('Failed to delete option selection.', e)
		}
	}

	updateSelection = async (
		userId: UUID,
		selectionId: number,
		updates: Partial<Omit<ItemSelection, "id" | "created_by" | "created_at">>
	): Promise<ItemSelection> => {
		try {
			const [updated] = await this.db`
				UPDATE item_option_selections SET ${sql(updates)}
				WHERE created_by = ${userId}
					AND id = ${selectionId}
				RETURNING *;`

			return updated
		} catch (e) {
			throw new ServiceError('Failed to update option selection.', e)
		}
	}

	// ORDERS
	/**
	 * 3.1 - Gets a list of all orders for a given session.
	 * @param sessionId - The session id to search for orders on.
	 * @param userId - The user trying to access the orders. Must be an admin on the session.
	 */
	getOrders = async (
		sessionId: UUID,
		userId: UUID
	): Promise<Order[]> => {
		try {
			return await this.db`
				WITH valid_session AS (
				    SELECT sessions.id
				    FROM public.sessions
				    JOIN menus ON menus.id = sessions.menu_id
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
	}

	/**
	 * 3.2 - Creates a new order, validating cart cost before insertion.
	 */
	createOrder = async (
		guest: string,
		orderId: number,
		placed_at: Date,
		items: Omit<OrderLineItem, "id" | "order_id" | "unit_price">[]
	): Promise<void> => {
		try {
			await this.db``;
		}
		catch (e) {
			throw new ServiceError("Failed to create new order.", e);
		}
	}


	/**
	 * 3.3 - Cancels an order in the session.
	 */
	cancelOrder = async (
		sessionId: UUID, 
		orderId: number
	): Promise<void> => {
		try {
			
		}
		catch (e) {
			throw new ServiceError("Failed to cancel order.", e);
		}
	}


	// getCartDetails = async (
	// 	userId: UUID,
	// 	menuId: UUID
	// ): Promise<CartDetails> => {
	// 	try {
	// 		const [cart] = await this
	// 			.db`SELECT * FROM get_cart_details(${userId}, ${menuId});`
	//
	// 		Value.Assert(cartDetailsObject, cart)
	// 		return cart
	// 	} catch (e) {
	// 		throw new ServiceError('Failed to get cart details.', e)
	// 	}
	// }
	//
	// createCart = async (userId: UUID, menuId: UUID): Promise<CartDetails> => {
	// 	try {
	// 		const [cart] = await this.db`
	// 			INSERT INTO carts (created_by, menu_id)
	// 			VALUES (${userId}, ${menuId})
	// 			ON CONFLICT DO NOTHING
	// 			RETURNING id, created_at, created_by, menu_id, 0 as total_cost, '[]'::json as cart_items
	// 		`
	//
	// 		Value.Assert(cartDetailsObject, cart)
	// 		return cart
	// 	} catch (e) {
	// 		throw new ServiceError('Failed to create new cart.', e)
	// 	}
	// }
	//
	// // TODO fix to use correct function
	// getItemsInCart = async (cartId: number): Promise<CartItemDetails[]> => {
	// 	try {
	// 		const result = await this
	// 			.db`SELECT * FROM get_cart_items(${cartId});`
	//
	// 		Value.Assert(t.Array(cartItemDetailsObject), result)
	// 		return result
	// 	} catch (e) {
	// 		throw new ServiceError('Failed to get items in cart.', e)
	// 	}
	// }
	//
	// addItemToCart = async (
	// 	cartId: number,
	// 	itemId: number,
	// 	count: number,
	// 	selections?: number[]
	// ): Promise<CartItemDetails> => {
	// 	try {
	// 		const basePriceQ = this.db`
	// 					SELECT base_price
	// 				    FROM items
	// 				    WHERE id = ${itemId}`
	//
	// 		// Use more advanced query if there are selections on the cart item
	// 		const unitPriceQ =
	// 			selections && selections.length > 0
	// 				? this.db`
	// 					SELECT COALESCE(SUM(price), 0) + ${basePriceQ}
	// 					FROM item_option_selections AS ios
	// 					WHERE ios.id IN ${sql(selections)}`
	// 				: basePriceQ
	//
	// 		await this.db.begin(async (tx) => {
	// 			// Insert the new item
	// 			const [newId] = await tx`
	// 				INSERT INTO cart_items (cart_id, item_id, count, unit_price)
	// 				VALUES (${cartId}, ${itemId}, ${count}, (${unitPriceQ}));`
	//
	// 			// Insert selections if they exist
	// 			if (selections && selections.length > 0) {
	// 				// Format selections for insertion into table
	// 				const selObjs = []
	// 				for (const sel of selections)
	// 					selObjs.push({
	// 						cart_item_id: newId,
	// 						option_selection: sel,
	// 					})
	//
	// 				await tx`INSERT INTO cart_item_selections ${sql(selObjs)}`
	// 			}
	// 		})
	//
	// 		// TODO use correct function
	// 		const [cartItem] = await this
	// 			.db`SELECT * FROM get_cart_items(${cartId});`
	// 		Value.Assert(cartItemDetailsObject, cartItem)
	// 		return cartItem
	// 	} catch (e) {
	// 		throw new ServiceError('Failed to add item to cart.', e)
	// 	}
	// }
	//
	// updateItemInCartCount = async (cartItemId: number, count: number): Promise<{ id: number, new_count: number, was_deleted: boolean }> => {
	// 	try {
	// 		const [deletedDetails] = await this.db`
	// 			WITH updated AS (
	// 				UPDATE cart_items
	// 				SET count = count + ${count}
	// 				WHERE id = ${cartItemId}
	// 				RETURNING id, count
	// 			), deleted AS (
	// 				DELETE FROM cart_items AS ci
	// 				WHERE id = ${cartItemId}
	// 					AND count + ${count} <= 0
	// 				RETURNING *
	// 			)
	// 			SELECT
	// 				COALESCE(u.id, d.id) AS id,
	// 				COALESCE(u.count, 0) AS new_count,
	// 				(d.id IS NOT NULL) AS was_deleted
	// 			FROM updated AS u
	// 			FULL OUTER JOIN deleted AS d ON u.id = d.id;`
	// 		return deletedDetails;
	// 	} catch (e) {
	// 		throw new ServiceError('Failed to delete item from cart.', e)
	// 	}
	// }
}
