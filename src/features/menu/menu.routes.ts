import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { uuidTObj } from '@utils/types/typebox/uuid'
import MenuRepository, { tMenu, tNewMenu } from '@features/menu/menu.repository'
import { tTimeless } from '@utils/types/typebox/timeless'

export const menuRoutes = new Elysia({ prefix: '/menus' })
	.decorate("menuRepo", new MenuRepository())
	.use(authMiddleware)
	.guard({ isAuthenticated: true })
	// 1.1 - Get user's menus
	.get("/", async ({ menuRepo }) => menuRepo.index())
	// 1.2 - Create new menu
	.post("/", async ({ menuRepo, body }) => menuRepo.create(body),
		{ body: tTimeless<typeof tNewMenu>(tNewMenu) })
	// Menu specific route
	.group("/:menuId", { params: t.Object({ menuId: uuidTObj }) }, app => app
			// 1.3 - Get menu details
			.get("/", async ({ params, menuRepo }) => menuRepo.get(params.menuId))
			// 1.4 - Add item to menu
			.post("/items", async ({ params, body, menuRepo }) => {
				await menuRepo.$addItemToMenu(body.itemId, params.menuId);
				return {
					message: "Successfully added item."
				}
			}, { body: t.Object({ itemId: t.Integer() }) })
			// 1.5 - Remove item from menu
			.delete("/items/:itemId", async ({ params, menuRepo }) => {
				await menuRepo.$removeItemFromMenu(params.itemId, params.menuId)
				return {
					message: "Successfully deleted item."
				}
			}, { params: t.Object({ itemId: t.Integer() }) })
	)
