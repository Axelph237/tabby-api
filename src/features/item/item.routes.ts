import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { messageResponseObj } from '@utils/types/typebox/messageResponse'
import ItemRepository, { Item, tNewItem } from '@features/item/item.repository'
import { tTimeless } from '@utils/types/typebox/timeless'
import { tNewItemOption } from '@features/item/item-option.repository'
import { tNewItemSelection } from '@features/item/item-selection.repository'
import { asUser, queryOne } from '@config/drizzle/query-wrappers'

const itemRepo = new Elysia()
	.decorate("itemRepo", new ItemRepository())

const optionRoutes = new Elysia({ prefix: "/options" })
	.use(itemRepo)
	.use(authMiddleware)
	.guard({ params: t.Object({ itemId: t.Integer() }), isAuthenticated: true })
	// 2.5 - Create option
	.post("/", async ({ params, body, itemRepo, user }) => 
		asUser(user?.id, itemRepo.$options.create({ parentItemId: params.itemId, ...body })),
	{ 
		body: t.Omit(tNewItemOption, ["parentItemId"]) 
	})
	// 2.6 - Remove option
	.delete("/:optId", async ({params, itemRepo, user }) => {
		await asUser(user?.id, itemRepo.$options.remove(params.optId));
		return { message: "Successfully deleted options from item." }
	},	{ 
		params: t.Object({ optId: t.Integer() }) 
	})
	// 2.7 - Update option
	.put("/:optId", async ({ params, body, itemRepo, user }) => 
		asUser(user?.id, itemRepo.$options.update({ id: params.optId, ...body })), 
	{
		params: t.Object({ optId: t.Integer() }),
		body: t.Partial(tNewItemOption)
	})

const selectionRoutes = new Elysia({ prefix: "/selections" })
	.use(itemRepo)
	.use(authMiddleware)
	.guard({ params: t.Object({ itemId: t.Integer() }), isAuthenticated: true })
	// 2.8 - Create selection
	.post("/", async ({  params, body, itemRepo, user }) =>
		asUser(user?.id, itemRepo.$options.$selections.create({ parentItemId: params.itemId, ...body })), 
	{
		body: t.Omit(tNewItemSelection, ["parentItemId"])
	})
	// 2.9 - Delete selection
	.delete("/:selId", async ({ params, itemRepo, user }) => {
		await asUser(user?.id, itemRepo.$options.$selections.remove(params.selId))
		return { message: "Successfully deleted selections." }
	}, {
		params: t.Object({ selId: t.Integer() }),
		response: messageResponseObj
	})
	// 2.10 - Update selection
	.put("/:selId", async ({ params, body, itemRepo, user }) => 
		asUser(user?.id, itemRepo.$options.$selections.update({ id: params.selId, ...body })), 
	{
		params: t.Object({ selId: t.Integer() }),
		body: t.Partial(tNewItemSelection)
	})

export const itemRoutes = new Elysia({ prefix: "/items" })
	.use(itemRepo)
	.use(authMiddleware)
	.guard({ isAuthenticated: true })
	// 2.1 - Get user's items
	.get("/", async ({ itemRepo, user, query }) => {
		// console.log(query)
		const result = await asUser<{ selections: {}[] }[]>(user?.id, itemRepo.index())
		console.log(result);
		return result;
	})
	// 2.2 - Create new item
	.post("/", async ({ body, itemRepo, user, error }) => {
		if (user) {
			return queryOne(asUser<Item[]>(user.id, itemRepo.create({ ...body, ownerId: user.id })))
		}
		throw error(401, "User not found.");
	},
		{ 
			body: t.Omit(tTimeless<typeof tNewItem>(tNewItem), ["ownerId"]) 
		})
	// Item specific routes
	.group("/:itemId", { params: t.Object({ itemId: t.Integer() }) }, app => app
		.get("/", async ({ params, itemRepo, user}) => {
			const item = await queryOne(asUser<Item[]>(user?.id, itemRepo.get(params.itemId)))
			console.log(item);
			return item;
		})
		// 2.3 - Delete item
		.delete("/", async ({ params, itemRepo, user }) => {
			await asUser(user?.id, itemRepo.remove(params.itemId));
			return { message: "Successfully deleted items." }
		})
		// 2.4 - Update item
		.put("/", async ({ params, body, itemRepo, user }) => 
			queryOne(asUser<Item[]>(user?.id, itemRepo.update({ id: params.itemId, ownerId: user?.id, ...body }).returning())),
			{ 
				body: t.Partial(tTimeless(tNewItem)) 
			})
		// OPTIONS
		.use(optionRoutes)
		// SELECTIONS
		.use(selectionRoutes)
	)