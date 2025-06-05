import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { messageResponseObj } from '@utils/types/typebox/messageResponse'
import ItemRepository, { tNewItem } from '@features/item/item.repository'
import { tTimeless } from '@utils/types/typebox/timeless'
import { tNewItemOption } from '@features/item/itemOption.repository'

export const itemRoutes = new Elysia({ prefix: "/items" })
	.decorate("itemRepo", new ItemRepository())
	.use(authMiddleware)
	.guard({ isAuthenticated: true })
	// 2.1 - Get user's items
	.get("/", async ({ itemRepo }) => itemRepo.index())
	// 2.2 - Create new item
	.post("/", async ({ body, itemRepo }) => itemRepo.create(body),
		{ body: tTimeless<typeof tNewItem>(tNewItem) })
	// Item specific routes
	.group("/:itemId", { params: t.Object({ itemId: t.Integer() }) }, app => app
		// 2.3 - Delete item
		.delete("/", async ({ params, itemRepo }) => {
			await itemRepo.remove(params.itemId);
			return { message: "Successfully deleted items." }
		})
		// 2.4 - Update item
		.put("/", async ({ params, body, itemRepo }) => itemRepo.update({ id: params.itemId, ...body }),
			{ body: t.Partial(tNewItem) })
		// OPTIONS
		// 2.5 - Create option
		.post("/options", async ({ params, body, itemRepo }) => itemRepo.$options.create({ parentItemId: params.itemId, ...body }),
			{ body: t.Omit(tTimeless<typeof tNewItemOption>(tNewItemOption), ["parentItemId"]) })
		// 2.6 - Remove option
		.delete("/options/:optId", async ({params, itemRepo }) => {
			await itemRepo.$options.remove(params.optId);
			return { message: "Successfully deleted options from item." }
		},
			{ params: t.Object({ optId: t.Integer() }) })
		// 2.7 - Update option
		.put("/options/:optId", async ({ params, body, itemRepo }) => {
			return await ic.updateOption(params.optId, body);
		}, {
			params: t.Object({
				optId: t.Integer()
			}),
			body: t.Partial(t.Omit(itemOptionTObj, [...ignoredKeys, "item_id"])),
			response: itemOptionTObj
		})
		// SELECTIONS
		// 2.8 - Create selection
		.post("/selections", async ({  params, body, itemRepo }) => {
			return await ic.createSelection(params.itemId, body);
		}, {
			body: t.Object({
				parent_option: t.Nullable(t.Integer()),
				label: t.String(),
				price: t.Integer(),
				is_default: t.Boolean()
			}),
			response: itemSelectTObj
		})
		// 2.9 - Delete selections
		.delete("/selections", async ({  body, itemRepo }) => {
			await ic.deleteSelections(body)
			return {
				message: "Successfully deleted selections."
			}
		}, {
			body: t.Array(t.Integer()),
			response: messageResponseObj
		})
		// 2.10 - Update selection
		.put("/selections/:selId", async ({ params, body, itemRepo }) => {
			return await ic.updateSelection(params.selId, body);
		}, {
			params: t.Object({
				selId: t.Integer()
			}),
			body: t.Partial(t.Omit(itemSelectTObj, ignoredKeys)),
			response: itemSelectTObj
		})
	)