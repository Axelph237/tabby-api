import { Elysia, t } from 'elysia'
import { PgsqlService } from '../../config/db'
import {
    itemObject,
    itemOptionObj,
    itemSelectObj,
    menuObj,
    uuidObj
} from "../../+types/schema";
import {Value} from "@sinclair/typebox/value";

/**
 * @deprecated - Use other controllers for a better alternative
 */
export const UserController = new Elysia({ prefix: "/users/:userId" })
    .derive(() => {
        return {
            db: PgsqlService.getInstance()
        }
    })
    .guard({
        params: t.Object({
            userId: uuidObj
        })
    })
    // 1.3
    .get("/menus", async ({ params, db}) => {
        await db.getUserMenus(params.userId);
    })
    // 1.4
    .post("/menus", async ({ params, body, db }) => {
        await db.createMenu(body.name, params.userId);
    }, {
        body: t.Object({
            name: t.String()
        })
    })
    // 1.5
    .post("/menus/:menuId/items", async ({ params, body, db }) => {
        let itemId;
        if (!Value.Check(t.Object({ id: t.Integer() }), body))
			itemId = await db.createItem(params.userId, body);
        else
            itemId = body.id;

        await db.addItemToMenu(params.menuId, itemId);
    }, {
        params: t.Object({
           menuId: uuidObj
        }),
        body: t.Union([ t.Object({
            id: t.Integer()
        }),  t.Object({
            name: t.String(),
            description: t.Nullable(t.String()),
            img_url: t.Nullable(t.String()),
            base_price: t.Integer(),
        })])
    })
    // 1.6
    .delete("/menus/:menuId/items/:menuItemId", async ({ params, db }) => {
        await db.deleteItem(params.menuId, params.menuItemId);
    }, {
        params: t.Object({
            menuId: uuidObj,
            menuItemId: t.Number()
        })
    })
    // 2.1
    .get("/items", async ({ params, db }) => {
        await db.getUserMenus(params.userId);
    })
	// 2.2
    .post("/items", async ({ params, body, db}) => {
        await db.createItem(params.userId, body);
    }, {
        body: t.Object({
            name: t.String(),
            description: t.Nullable(t.String()),
            img_url: t.Nullable(t.String()),
            base_price: t.Integer()
        })
    })
	// 2.3
    .delete("/items/:itemId", async ({ params, db }) => {
        await db.deleteItem(params.userId, params.itemId);
    }, {
        params: t.Object({
            itemId: t.Integer()
        })
    })
    // 2.4
    .put("/items/:itemId", async ({ params, body, db }) => {
		await db.updateItem(params.userId, params.itemId, body);
    }, {
        params: t.Object({
            itemId: t.Integer()
        }),
        body: t.Partial(t.Omit(itemObject, ["id", "created_by"]))
    })
    // 2.5
    .post("/items/:itemId/options", async ({ params, body, db }) => {
        await db.createOption(params.userId, params.itemId, body);
    }, {
        params: t.Object({
            itemId: t.Integer()
        }),
        body: t.Object({
            label: t.String(),
            type: t.Union([
                t.Literal('one'),
                t.Literal('many'),
                t.Literal('text'),
            ])
        })
    })
    // 2.6
    .delete("/items/:itemId/options/:optionId", async ({ params, body, db }) => {
        await db.deleteOption(params.userId, params.itemId, params.optionId);
    }, {
        params: t.Object({
            itemId: t.Integer(),
            optionId: t.Integer()
        })
    })
    // 2.7
    .put("/items/:itemId/options/:optionId", async ({ params, body, db }) => {
        await db.updateOption(params.userId, params.itemId, params.optionId, body);
    }, {
        params: t.Object({
            itemId: t.Integer(),
            optionId: t.Integer()
        }),
        body: t.Partial(itemOptionObj)
    })
    // 2.8
    .post("/items/:itemId/options/:optionId/selections", async ({ params, body, db }) => {
        await db.createOptionSelection(params.userId, params.optionId, body);
    }, {
        params: t.Object({
            optionId: t.Integer()
        }),
        body: t.Omit(itemSelectObj, ["created_by", "option_id", "id"])
    })
    // 2.9
    .delete("/items/:itemId/options/:optionId/selections/:selectionLabel", async ({ params, db}) => {
        await db.deleteOptionSelection(params.userId, params.optionId, params.selectionLabel);
    }, {
        params: t.Object({
            optionId: t.Integer(),
            selectionLabel: t.String(),
        })
    })
    // 2.10
    .put("/items/:itemId/options/:optionId/selections/:selectionLabel", async ({ params, body, db}) => {
        await db.updateOptionSelection(params.userId, params.optionId, params.selectionLabel, body);
    }, {
        params: t.Object({
            optionId: t.Integer(),
            selectionLabel: t.String(),
        }),
        body: t.Partial(t.Omit(itemSelectObj, ["created_by", "option_id", "id"]))
    })

// DEPRECATED carts routes
    // // 3.1
    // .get("/carts", async ({ params, query, db }) => {
    //     await db.getCartDetails(params.userId, query.menu);
    // },{
    //     query: t.Object({
    //         menu: uuidObject
    //     })
    // })
    // // 3.2
    // .post("/carts", async ({ params, body, db }) => {
    //     await db.createCart(params.userId, body.menu_id);
    // }, {
    //     body: t.Object({
    //         menu_id: uuidObject
    //     })
    // })
    // // 3.3
    // .get("/carts/:cartId/items", async ({ params, body, db }) => {
    //     await db.getItemsInCart(params.cart_id);
    // }, {
    //     params: t.Object({
    //         cart_id: t.Integer()
    //     })
    // })
    // // 3.4
    // .post("/carts/:cartId/items", async ({ params, body, db }) => {
    //     await db.addItemToCart(params.cart_id, body.item_id, body.count, body.selections)
    // }, {
    //     params: t.Object({
    //         cart_id: t.Integer()
    //     }),
    //     body: t.Object({
    //         item_id: t.Integer(),
    //         count: t.Integer(),
    //         selections: t.Optional(t.Array(t.Number(), { minItems: 1 }))
    //     })
    // })
    // // 3.5
    // .delete("/carts/:cartId/items", async ({ params, body, db }) => {
    //     await db.updateItemInCartCount(body.cart_item_id, body.count);
    // }, {
    //     body: t.Object({
    //         cart_item_id: t.Integer(),
    //         count: t.Integer(),
    //     })
    // })