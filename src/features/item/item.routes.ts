import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { messageResponseObj } from '@utils/types/typebox/messageResponse'
import ItemRepository, { tNewItem } from '@features/item/item.repository'
import { tTimeless } from '@utils/types/typebox/timeless'
import { tNewItemOption } from '@features/item/itemOption.repository'
import { tNewItemSelection } from '@features/item/itemSelection.repository'

const itemRepo = new Elysia()
	.decorate("itemRepo", new ItemRepository())

const optionRoutes = new Elysia({ prefix: "/options" })
	.use(itemRepo)
	.guard({ params: t.Object({ itemId: t.Integer() }) })
	// 2.5 - Create option
	.post("/", async ({ params, body, itemRepo }) => 
		itemRepo.$options.create({ parentItemId: params.itemId, ...body }),
	{ 
		body: t.Omit(tNewItemOption, ["parentItemId"]) 
	})
	// 2.6 - Remove option
	.delete("/:optId", async ({params, itemRepo }) => {
		await itemRepo.$options.remove(params.optId);
		return { message: "Successfully deleted options from item." }
	},	{ 
		params: t.Object({ optId: t.Integer() }) 
	})
	// 2.7 - Update option
	.put("/:optId", async ({ params, body, itemRepo }) => 
		itemRepo.$options.update({ id: params.optId, ...body }), 
	{
		params: t.Object({ optId: t.Integer() }),
		body: t.Partial(tNewItemOption)
	})

const selectionRoutes = new Elysia({ prefix: "/selections" })
	.use(itemRepo)
	.guard({ params: t.Object({ itemId: t.Integer() }) })
	// 2.8 - Create selection
	.post("/", async ({  params, body, itemRepo }) =>
		itemRepo.$options.$selections.create({ parentItemId: params.itemId, ...body }), 
	{
		body: t.Omit(tNewItemSelection, ["parentItemId"])
	})
	// 2.9 - Delete selection
	.delete("/:selId", async ({ params, itemRepo }) => {
		itemRepo.$options.$selections.remove(params.selId)
		return { message: "Successfully deleted selections." }
	}, {
		params: t.Object({ selId: t.Integer() }),
		response: messageResponseObj
	})
	// 2.10 - Update selection
	.put("/:selId", async ({ params, body, itemRepo }) => 
		itemRepo.$options.$selections.update({ id: params.selId, ...body }), 
	{
		params: t.Object({ selId: t.Integer() }),
		body: t.Partial(tNewItemSelection)
	})

export const itemRoutes = new Elysia({ prefix: "/items" })
	.use(itemRepo)
	.use(authMiddleware)
	.guard({ isAuthenticated: true })
	// 2.1 - Get user's items
	.get("/", async ({ itemRepo }) => 
		itemRepo.index()
	)
	// 2.2 - Create new item
	.post("/", async ({ body, itemRepo }) => 
		itemRepo.create(body),
		{ 
			body: tTimeless<typeof tNewItem>(tNewItem) 
		})
	// Item specific routes
	.group("/:itemId", { params: t.Object({ itemId: t.Integer() }) }, app => app
		// 2.3 - Delete item
		.delete("/", async ({ params, itemRepo }) => {
			await itemRepo.remove(params.itemId);
			return { message: "Successfully deleted items." }
		})
		// 2.4 - Update item
		.put("/", async ({ params, body, itemRepo }) => 
			itemRepo.update({ id: params.itemId, ...body }),
			{ 
				body: t.Partial(tNewItem) 
			})
		// OPTIONS
		.use(optionRoutes)
		// SELECTIONS
		.use(selectionRoutes)
	)