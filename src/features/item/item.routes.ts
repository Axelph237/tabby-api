import { Elysia, t } from 'elysia'
import { auth } from '../../middlewares/auth'
import { ignoredKeys, itemDetailsObj, itemObj, itemOptionObj, itemSelectObj } from '../../+types/schema'
import { messageResponseObj } from '../../utils/types/messageResponse'
import { itemController } from './item.controller'


export const ItemRoutes = new Elysia({ prefix: "/items" })
	.use(itemController({
		name: "ic"
	}))
	.use(auth)
	.guard({
		isAuthenticated: true
	})
	// 2.1 - Get user's items
	.get("/", async ({ ic }) => {
		return await ic.getItems();
	}, {
		response: t.Array(itemDetailsObj)
	})
	// 2.2 - Create new item
	.post("/", async ({ body, ic }) => {
		// @ts-ignore
		return await ic.createItem(body);
	}, {
		body: t.Omit(itemObj, ignoredKeys),
		response: t.Integer()
	})
	// 2.3 - Delete items
	.delete("/", async ({ body, ic }) => {
		await ic.deleteItems(body);
		return {
			message: "Successfully deleted items."
		}
	}, {
		body: t.Array(t.Integer()),
		response: messageResponseObj
	})
	// Item specific routes
	.group("/:itemId", {
		params: t.Object({
			itemId: t.Integer()
		})
	}, app => app
			// 2.4 - Update item
			.put("/", async ({ params, body, ic }) => {
				return await ic.updateItem(params.itemId, body);
			}, {
				body: t.Partial(t.Omit(itemObj, ignoredKeys)),
				response: itemObj
			})

			// OPTIONS
			// 2.5 - Create option
			.post("/options", async ({ params, body, ic}) => {
				// @ts-ignore
				return await ic.createOption(params.itemId, body);
			},{
				body: t.Omit(itemOptionObj, ignoredKeys),
				response: itemOptionObj
			})
			// 2.6 - Remove options
			.delete("/options", async ({body, ic }) => {
				await ic.deleteOptions(body);
				return {
					message: "Successfully deleted options from item."
				}
			}, {
				body: t.Array(t.Integer()),
				response: messageResponseObj
			})
			// 2.7 - Update option
			.put("/options/:optionId", async ({ params, body, ic }) => {
				return await ic.updateOption(params.optionId, body);
			}, {
				params: t.Object({
					optionId: t.Integer()
				}),
				body: t.Partial(t.Omit(itemOptionObj, ignoredKeys)),
				response: itemOptionObj
			})

			// SELECTIONS
			// 2.8 - Create selection
			.post("/selections", async ({  params, body, ic }) => {
				return await ic.createSelection(params.itemId, body);
			}, {
				body: t.Object({
					parent_option: t.Nullable(t.Integer()),
					label: t.String(),
					price: t.Integer(),
					is_default: t.Boolean()
				}),
				response: itemSelectObj
			})
			// 2.9 - Delete selections
			.delete("/selections", async ({  body, ic }) => {
				await ic.deleteSelections(body)
				return {
					message: "Successfully deleted selections."
				}
			}, {
				body: t.Array(t.Integer()),
				response: messageResponseObj
			})
			// 2.10 - Update selection
			.put("/selections/:selId", async ({ params, body, ic }) => {
				return await ic.updateSelection(params.selId, body);
			}, {
				params: t.Object({
					selId: t.Integer()
				}),
				body: t.Partial(t.Omit(itemSelectObj, ignoredKeys)),
				response: itemSelectObj
			})
	)