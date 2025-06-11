import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { uuidTObj } from '@utils/types/typebox/uuid'
import MenuRepository, { tMenu, tNewMenu } from '@features/menu/menu.repository'
import { tTimeless } from '@utils/types/typebox/timeless'
import { asUser } from '@config/drizzle/query-wrappers'

export const menuRoutes = new Elysia({ prefix: '/menus' })
	.decorate("menuRepo", new MenuRepository())
	.use(authMiddleware)
	.guard({ isAuthenticated: true })
	// 1.1 - Get user's menus
	.get("/", async ({ menuRepo, user }) => 
		asUser(user?.id, menuRepo.index()))
	// 1.2 - Create new menu
	.post("/", async ({ menuRepo, body, user }) => 
		asUser(user?.id, menuRepo.create({ ownerId: user!.id, ...body })),
		{ 
			body: t.Omit(tTimeless<typeof tNewMenu>(tNewMenu), ["ownerId"]) 
		})
	// Menu specific route
	.group("/:menuId", { params: t.Object({ menuId: uuidTObj }) }, app => app
			// 1.3 - Get menu details
			.get("/", async ({ params, menuRepo, user }) => 
				asUser(user?.id, menuRepo.get(params.menuId)))
			// 1.4 - Add item to menu
			.post("/items", async ({ params, body, menuRepo, user }) =>
				asUser(user?.id, menuRepo.$addItemToMenu(body.itemId, params.menuId)),
				{ 
					body: t.Object({ itemId: t.Integer() }) 
				})
			// 1.5 - Remove item from menu
			.delete("/items/:itemId", async ({ params, menuRepo, user }) => {
				await asUser(user?.id, menuRepo.$removeItemFromMenu(params.itemId, params.menuId))
				return {
					message: "Successfully deleted item."
				}
				}, { 
					params: t.Object({ itemId: t.Integer() }) 
				})
	)
