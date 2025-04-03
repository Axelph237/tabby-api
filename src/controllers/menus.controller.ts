import { Elysia, t } from 'elysia'
import {PgsqlService} from "../services/psql.service";
import { uuidObject } from '../+types/schema'
import { jwtCheckerPlugin } from '../plugins/jwt-checker.plugin'

export const MenusController = new Elysia({ prefix: '/menus' })
	.use(jwtCheckerPlugin)
	.guard({
		isAuthenticated: true
	})
	.derive(() => {
		return {
			db: PgsqlService.getInstance()
		}
	})
	// 1.1 - Get user's menus
	.get("/", async ({ user, db }) => {
		return await db.getUserMenus(user.id);
	})
	// 1.2 - Create new menu
	.post("/", async ({ user, db, body }) => {
		return await db.createMenu(body.name, user.id);
	}, {
		body: t.Object({
			name: t.String()
		})
	})
	// Menu specific route
	.group("/:menuId", {
		params: t.Object({
			menuId: uuidObject
		})
	}, app => app
			// 1.3 - Get menu details
			.get("/", async ({ params, user, db, error }) => {
				return await db.getMenu(params.menuId, user.id);
			})
			// 1.4 - Add item to menu
			.post("/items", async ({ params, body, user, db }) => {
				await db.addItemToMenu(params.menuId, body.id, user.id);
				return {
					message: "Successfully added item."
				}
			}, {
				body: t.Object({
					id: t.Integer()
				})
			})
			// 1.5 - Remove item from menu
			.delete("/items/:itemId", async ({ params, user, db }) => {
				await db.deleteItemFromMenu(params.menuId, params.itemId, user.id);
				return {
					message: "Successfully deleted item."
				}
			}, {
				params: t.Object({
					itemId: t.Integer()
				})
			})
	)
