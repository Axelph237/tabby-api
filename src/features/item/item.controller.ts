import { Elysia, t } from 'elysia'
import { auth } from '@middlewares/auth'
import { Value } from '@sinclair/typebox/value'
import { ServiceError } from '@utils/types/serviceError'
import { db } from '@config/db'
import { sql } from 'bun'
import {
	Item,
	ItemDetails,
	itemDetailsObj,
	itemObj,
	ItemOption,
	itemOptionObj,
	ItemSelection,
	itemSelectObj,
} from './item.validation'

interface ControllerConfig {
	name?: string
}

export const itemController = (init?: ControllerConfig) => new Elysia({
	name: init?.name ?? "itemController"
})
	.use(auth)
	.use(db({ name: "itemControllerPool" }))
	.resolve({ as: "scoped" }, ({ pool, user }) => {
		const userId = user?.id ?? null;

		return {
			[init?.name ?? "itemController"]: {
				/**
				 * 2.1 - Gets the items created by a given user.
				 */
				getItems: async (): Promise<ItemDetails[]> => {
					try {
						// Function abstracted for better management
						const result = await pool`
							SELECT * FROM public.get_user_items(${userId});`;
						Value.Assert(t.Array(itemDetailsObj), result)

						return result
					} catch (e) {
						throw new ServiceError("Failed to get the user's items.", e)
					}
				},

				/**
				 * 2.2 - Create a new item for the given user.
				 * @param item
				 */
				createItem: async (
					item: Omit<Item, 'id' | 'created_by' | 'created_at'>
				): Promise<number> => {
					try {
						const [resultItem] = await pool`
							INSERT INTO public.items ${sql({
								...item,
								created_by: userId,
							})} RETURNING id;`;
						Value.Assert(t.Integer(), resultItem.id)

						return resultItem.id
					} catch (e) {
						throw new ServiceError('Failed to create new item.', e)
					}
				},

				/**
				 * 2.3 - Delete item
				 * @param itemIds - The items to delete.
				 */
				deleteItems: async (
					itemIds: number[]
				): Promise<void> => {
					try {
						await pool`
							DELETE FROM public.items 
							WHERE created_by = ${userId} 
							  AND id = ANY ${itemIds};`;
					} catch (e) {
						throw new ServiceError('Failed to delete item.', e)
					}
				},

				/**
				 * 2.4 - Update an existing item.
				 * @param itemId - The item to update.
				 * @param updateVals - An object of item columns and their new values.
				 * 		`id`, `created_by`, and `created_at` cannot be updated.
				 */
				updateItem: async (
					itemId: number,
					updateVals: Partial<Omit<Item, "id" | "created_by" | "created_at">>
				): Promise<Item> => {
					try {
						const [item] = await pool`
							UPDATE public.items SET ${sql(updateVals)} 
							WHERE created_by = ${userId} 
							  AND id = ${itemId} RETURNING *;`;

						Value.Assert(itemObj, item)
						return item
					} catch (e) {
						throw new ServiceError('Failed to update item.', e)
					}
				},

				// OPTIONS
				/**
				 * 2.5 - Create a new option category.
				 * @param itemId - The item to add the option to.
				 * @param newOpt - The option to add.
				 * TODO ensure that the userId passed matches the user who created the item.
				 */
				createOption: async (
					itemId: number,
					newOpt: Omit<ItemOption, 'id' | 'created_by' | 'item_id'>
				): Promise<ItemOption> => {
					try {
						const [option] = await pool`
							INSERT INTO public.item_options ${sql({
								...newOpt,
								created_by: userId,
								item_id: itemId,
							})} RETURNING *;`;
						Value.Assert(itemOptionObj, option);

						return option
					} catch (e) {
						throw new ServiceError('Failed to create new option on item.', e)
					}
				},

				/**
				 * 2.6 - Removes the option category from the given item.
				 * @param optionIds - The options to delete.
				 */
				deleteOptions: async (
					optionIds: number[]
				): Promise<void> => {
					try {
						await pool`DELETE FROM public.item_options 
       						WHERE created_by = ${userId}
       			  			  AND id = ANY ${optionIds};`;
					} catch (e) {
						throw new ServiceError('Failed to delete option on item.', e)
					}
				},

				/**
				 * 2.7 - Updates a given option.
				 * @param optionId - The option to update.
				 * @param updates - An object of option columns and their new values.
				 * 		`id`, `created_by`, and `created_at` cannot be updated.
				 */
				updateOption: async (
					optionId: number,
					updates: Partial<ItemOption>
				): Promise<ItemOption> => {
					try {
						const [updated] = await pool`
							UPDATE public.item_options SET ${sql(updates)}
							WHERE created_by = ${userId}
							  AND id = ${optionId}
							RETURNING *;`;

						return updated
					} catch (e) {
						throw new ServiceError('Failed to update option on item.', e)
					}
				},

				// SELECTIONS
				/**
				 * 2.8 - Creates a new selection on the given item.
				 * @param itemId - The item to add the selection to.
				 * @param selection - The selection to add.
				 * TODO add a trigger on the selections table to ensure that selections are only created by the owner of the item.
				 */
				createSelection: async (
					itemId: number,
					selection: Omit<ItemSelection, "id" | "created_by" | "item_id">
				): Promise<ItemSelection> => {
					try {
						const [sel] = await pool`
							INSERT INTO public.item_selections ${sql({
								...selection,
								created_by: userId,
								item_id: itemId,
							})} RETURNING *;`
						Value.Assert(itemSelectObj, sel);
						return sel;
					} catch (e) {
						throw new ServiceError('Failed to create new option selection.', e)
					}
				},

				/**
				 * 2.9 - Remove the given selections.
				 * @param selectionIds - The selections to delete.
				 */
				deleteSelections: async (
					selectionIds: number[]
				): Promise<void> => {
					try {
						const result = await pool`
							DELETE FROM public.item_selections
							WHERE created_by = ${userId}
							  AND id = ANY ${selectionIds};`;
					} catch (e) {
						throw new ServiceError('Failed to delete option selection.', e)
					}
				},

				/**
				 * 2.10 - Update the given selection.
				 * @param selectionId - The selection to update.
				 * @param updates - An object of selection columns and their new values.
				 * 		`id`, `created_by`, and `created_at` cannot be updated.
				 */
				updateSelection: async (
					selectionId: number,
					updates: Partial<Omit<ItemSelection, "id" | "created_by" | "created_at">>
				): Promise<ItemSelection> => {
					try {
						const [updated] = await pool`
							UPDATE public.item_selections SET ${sql(updates)}
							WHERE created_by = ${userId}
							  AND id = ${selectionId}
							RETURNING *;`;
						return updated
					} catch (e) {
						throw new ServiceError('Failed to update option selection.', e)
					}
				}
			}
		}
	})
