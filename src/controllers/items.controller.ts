import { Elysia, t } from 'elysia'
import { PgsqlService } from '../services/psql.service'
import { jwtCheckerPlugin } from '../plugins/jwt-checker.plugin'
import { ignoredKeys, itemDetailsObj, itemObj, itemOptionObj, itemSelectObj } from '../+types/schema'
import { messageResponseObj } from '../+types/responses'


export const ItemsController = new Elysia({ prefix: "/items" })
	.use(jwtCheckerPlugin)
	.guard({
		isAuthenticated: true
	})
	.derive(() => {
		return {
			db: PgsqlService.getInstance()
		}
	})
	// 2.1 - Get user's items
	.get("/", async ({ user, db }) => {
		return await db.getUserItems(user.id);
	}, {
		response: t.Array(itemDetailsObj)
	})
	// 2.2 - Create new item
	.post("/", async ({ body, user, db }) => {
		// @ts-ignore
		return await db.createItem(user.id, body);
	}, {
		body: t.Omit(itemObj, ignoredKeys),
		response: t.Integer()
	})
	// 2.3 - Delete items
	.delete("/", async ({ body, user, db }) => {
		await db.deleteItems(user.id, body);
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
			.put("/", async ({ params, body, user, db }) => {
				return await db.updateItem(user.id, params.itemId, body);
			}, {
				body: t.Partial(t.Omit(itemObj, ignoredKeys)),
				response: itemObj
			})

			// OPTIONS
			// 2.5 - Create option
			.post("/options", async ({ params, body, user, db}) => {
				// @ts-ignore
				return await db.createOption(user.id, params.itemId, body);
			},{
				body: t.Omit(itemOptionObj, ignoredKeys),
				response: itemOptionObj
			})
			// 2.6 - Remove options
			.delete("/options", async ({ params, body, user, db }) => {
				await db.deleteOptions(user.id, params.itemId, body);
				return {
					message: "Successfully deleted options from item."
				}
			}, {
				body: t.Array(t.Integer()),
				response: messageResponseObj
			})
			// 2.7 - Update option
			.put("/options/:optionId", async ({ params, body, user, db }) => {
				return await db.updateOption(user.id, params.itemId, params.optionId, body);
			}, {
				params: t.Object({
					optionId: t.Integer()
				}),
				body: t.Partial(t.Omit(itemOptionObj, ignoredKeys)),
				response: itemOptionObj
			})

			// SELECTIONS
			// 2.8 - Create selection
			.post("/selections", async ({ params, body, user, db }) => {
				return await db.createSelection(user.id, body.parent_option, body.selection);
			}, {
				body: t.Object({
					parent_option: t.Nullable(t.Integer()),
					selection: t.Object({
						label: t.String(),
						price: t.Integer(),
						is_default: t.Boolean()
					})
				}),
				response: itemSelectObj
			})
			// 2.9 - Delete selections
			.delete("/selections", async ({ params, body, user, db }) => {
				await db.deleteSelections(user.id, body)
				return {
					message: "Successfully deleted selections."
				}
			}, {
				body: t.Array(t.Integer()),
				response: messageResponseObj
			})
			// 2.10 - Update selection
			.put("/selections/:selId", async ({ params, body, user, db }) => {
				return await db.updateSelection(user.id, params.selId, body);
			}, {
				params: t.Object({
					selId: t.Integer()
				}),
				body: t.Partial(t.Omit(itemSelectObj, ignoredKeys)),
				response: itemSelectObj
			})
	)