import { Elysia, t } from 'elysia'
import {PgsqlService} from "../services/postgres.service";
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
	.get("/", async () => {
		return "user\'s menus"
	})
	// 1.2 - Create new menu
	.post("/", async () => {
		return "created new menu"
	})
	// Menu specific route
	.group("/:menuId", {
		params: t.Object({
			menuId: uuidObject
		})
	}, app =>
		app
			// 1.3 - Get menu details
			.get("/", async ({ params, db }) => {
				await db.getMenu(params.menuId);
			})
			// 1.5 - Add item to menu
			.post("/items", async ({ params, db }) => {

			})
			// 1.6 - Remove item from menu
			.delete("/items", async ({ params, db }) => {

			})
	)
