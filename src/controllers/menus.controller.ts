import { Elysia } from 'elysia'
import {PGService} from "../services/postgres.service";

export const MenusController = new Elysia({ prefix: '/menus' })
	.derive(() => {
		return {
			db: PGService.getInstance()
		}
	})
	.get("/", () => "menus")
	// 1.1
	.get("/:menuId", async ({ params, db }) => {
		await db.getMenu(params.menuId);
	})
	// 1.2
	.get("/:menuId/items", async ({ params, db }) => {
		await db.getItemsFromMenu(params.menuId);
	})
