import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { Value } from '@sinclair/typebox/value'
import { ServiceError } from '@utils/types/serviceError'
import { UUID } from '@utils/types/uuid'
import { Menu, menuTObj } from './menu.validation'
import { sql } from 'bun'

interface ControllerConfig {
	name?: string
}

export const menuController = (init?: ControllerConfig) => new Elysia({
	name: init?.name ?? "menuController"
})
	.use(authMiddleware)
	.resolve(({ user }) => {
		const userId = user?.id ?? null;

		return {
			[init?.name ?? "menuController"]: {
				// DEPRECATED
				getMenuDetails: async (
					menuId: UUID
				): Promise<Menu> => {
					try {
						const [menu] = await sql`
							SELECT *
							FROM public.menus
							WHERE id = ${menuId} AND created_by = ${userId};`;
						Value.Assert(menuTObj, menu);
						return menu;
					} catch (e) {
						throw new ServiceError('Failed to get menu', e);
					}
				},

				/**
				 * 1.1 - Get user's menus
				 */
				getUserMenus: async (): Promise<Menu[]> => {
					try {
						const [...result] = await sql`
							SELECT *
							FROM public.menus
							WHERE created_by = ${userId};`;
						Value.Assert(t.Array(menuTObj), result);

						return result;
					} catch (e) {
						throw new ServiceError("Failed to get user's menus.", e)
					}
				},

				/**
				 * 1.2 - Create a new menu.
				 * @param name - The name of the menu.
				 */
				createMenu: async (
					name: string
				): Promise<Menu> => {
					try {
						const [menu] = await sql`
							INSERT INTO public.menus (name, created_by)
							VALUES (${name}, ${userId})
							RETURNING *;`;
						Value.Assert(menuTObj, menu);
						return menu
					} catch (e) {
						throw new ServiceError('Failed to create new menu.', e)
					}
				},

				/**
				 * 1.4 - Adds an item to the menu.
				 * @param menuId - The menu to add the item to.
				 * @param itemId - The item to add.
				 */
				addItemToMenu: async (
					menuId: UUID,
					itemId: number
				): Promise<void> => {
					try {
						await sql`
							WITH valid_item AS (
								SELECT id FROM public.items
								WHERE id = ${itemId} AND created_by = ${userId}
							), valid_menu AS (
							    SELECT id FROM public.menus
							 	WHERE id = ${menuId} AND created_by = ${userId}
							)
							INSERT INTO public.items_to_menus (item_id, menu_id)
							VALUES (
							    (SELECT id FROM valid_item),
							    (SELECT id FROM valid_menu)
							);`;
					} catch (e) {
						throw new ServiceError('Failed to add existing item to menu.', e)
					}
				},

				/**
				 * 1.5 - Removes an item's relation to a menu. Does not delete the item itself.
				 * @param menuId - The menu to delete the item from.
				 * @param itemId - The item to delete.
				 * @returns true if the operation was successful, null if there was an error.
				 */
				deleteItemFromMenu: async (
					menuId: UUID,
					itemId: number
				): Promise<void> => {
					try {
						sql`
                			WITH valid_item AS (
                			    SELECT id FROM public.items
                			    WHERE id = ${itemId} AND created_by = ${userId}
                			), valid_menu AS (
                			    SELECT id FROM public.menus
                			    WHERE id = ${menuId} AND created_by = ${userId}
                			)
							DELETE FROM public.items_to_menus 
							    WHERE item_id = (SELECT id FROM valid_item)
							    AND menu_id = (SELECT id FROM valid_menu);`;
					} catch (e) {
						throw new ServiceError('Failed to delete item from menu.', e)
					}
				}
			}
		}
	})
	.as("plugin")
