import { Elysia, t } from 'elysia'
import { auth } from '@middlewares/auth'
import { menuController } from './menu.controller'
import { uuidObj } from '@utils/types/uuid'

export const menuRoutes = new Elysia({ prefix: '/menus' })
	.use(menuController({ name: "mc" }))
	.use(auth)
	.guard({
		isAuthenticated: true
	})
	// 1.1 - Get user's menus
	.get("/", async ({ mc }) => {
		return await mc.getUserMenus();
	})
	// 1.2 - Create new menu
	.post("/", async ({ mc, body }) => {
		return await mc.createMenu(body.name);
	}, {
		body: t.Object({
			name: t.String()
		})
	})
	// Menu specific route
	.group("/:menuId", {
		params: t.Object({
			menuId: uuidObj
		})
	}, app => app
			// 1.3 - Get menu details
			.get("/", async ({ params, mc, error }) => {
				return await mc.getMenuDetails(params.menuId);
			})
			// 1.4 - Add item to menu
			.post("/items", async ({ params, body, mc }) => {
				await mc.addItemToMenu(params.menuId, body.id);
				return {
					message: "Successfully added item."
				}
			}, {
				body: t.Object({
					id: t.Integer()
				})
			})
			// 1.5 - Remove item from menu
			.delete("/items/:itemId", async ({ params, mc }) => {
				await mc.deleteItemFromMenu(params.menuId, params.itemId);
				return {
					message: "Successfully deleted item."
				}
			}, {
				params: t.Object({
					itemId: t.Integer()
				})
			})
	)
