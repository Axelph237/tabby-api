import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { menuController } from './menu.controller'
import { uuidTObj } from '@utils/types/uuid'
import { menuTObj } from '@features/menu/menu.validation'

export const menuRoutes = new Elysia({ prefix: '/menus' })
	.use(menuController({ name: "mc" }))
	.use(authMiddleware)
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
		body: t.Omit(menuTObj, ["id", "created_at", "created_by"])
	})
	// Menu specific route
	.group("/:menuId", {
		params: t.Object({
			menuId: uuidTObj
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
