import { Elysia, t } from 'elysia'
import { PGService } from '../services/postgres.service'


export const ItemsController = new Elysia({ prefix: "/items" })
	.derive(() => {
		return {
			db: PGService.getInstance()
		}
	})
	// 2.1 - Get user's items
	.get("/", async ({ params, db }) => {
		return "items"
	})
	// 2.2 - Create new item
	.post("/", async ({ params, body, db }) => {
		return "items"
	})
	// 2.3 - Delete items
	.delete("/", async ({ params, db }) => {
		return "items"
	})
	// Item specific routes
	.group("/:itemId", {
		params: t.Object({
			itemId: t.Integer()
		})
	}, app =>
		app
			// 2.4 - Update item
			.put("/", async ({ params, body, db }) => {
				return "items"
			})

			// OPTIONS
			// 2.5 - Create option
			.post("/options", async ({ params, body, db}) => {
				return "options"
			})
			// 2.6 - Remove options
			.delete("/options", async ({ params, body, db }) => {
				return "options"
			})
			// 2.7 - Update option
			.put("/options/:optionId", async ({ params, body, db }) => {
				return "options"
			})

			// SELECTIONS
			// 2.8 - Create selection
			.post("/selections", async ({ params, body, db }) => {
				return "selections"
			})
			// 2.9 - Delete selections
			.delete("/selections", async ({ params, body, db }) => {
				return "selections"
			})
			// 2.10 - Update selection
			.put("/selections/:selId", async ({ params, body, db }) => {
				return "selections"
			})
	)