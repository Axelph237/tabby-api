import {Elysia, t} from "elysia";
import {PGService} from "../services/postgres.service";
import {itemObject, itemOptionObject, itemOptionSelectObject, uuidObject} from "../schema/schema.interfaces";
import {Value} from "@sinclair/typebox/value";

export const ApiController = new Elysia({prefix: "/api"})
    .derive(() => {
        return {
            db: PGService.getInstance()
        }
    })
    // ANONYMOUS ENDPOINTS
    .group("/menus/:menuId", {
            params: t.Object({
                menuId: uuidObject
            })
        }, m_app =>
            m_app
                // 1.1
                .get("/", async ({params, db}) => {
                    await db.getMenu(params.menuId);
                })
                // 1.2
                .get("/items", async ({params, db}) => {
                    await db.getItemsFromMenu(params.menuId);
                })
    )
    // USER SPECIFIC ENDPOINTS
    .group("/users/:userId", {
            params: t.Object({
                userId: uuidObject
            })
        }, u_app =>
            u_app
                // 1 --- MENUS
                .group("/menus", m_app =>
                    m_app
                        // 1.3
                        .get("/", async ({params, db}) => {
                            await db.getUserMenus(params.userId);
                        })
                        // 1.4
                        .post("/", async ({params, body, db}) => {
                            await db.createMenu(body.name, params.userId);
                        }, {
                            body: t.Object({
                                name: t.String()
                            })
                        })
                        // 1.5
                        .post("/:menuId/items", async ({params, body, db}) => {
                            let itemId;
                            if (!Value.Check(t.Object({id: t.Integer()}), body))
                                itemId = await db.createItem(params.userId, body);
                            else
                                itemId = body.id;

                            await db.addItemToMenu(params.menuId, itemId);
                        }, {
                            params: t.Object({
                                menuId: uuidObject
                            }),
                            body: t.Union([t.Object({
                                id: t.Integer()
                            }), t.Object({
                                name: t.String(),
                                description: t.Nullable(t.String()),
                                img_url: t.Nullable(t.String()),
                                base_price: t.Integer(),
                            })])
                        })
                        // 1.6
                        .delete("/:menuId/items/:menuItemId", async ({params, db}) => {
                            await db.deleteItem(params.menuId, params.menuItemId);
                        }, {
                            params: t.Object({
                                menuId: uuidObject,
                                menuItemId: t.Number()
                            })
                        })
                )
                // 2 --- ITEMS
                .group("/items", i_app =>
                    i_app
                        // 2.1
                        .get("/", async ({params, db}) => {
                            await db.getUserMenus(params.userId);
                        })
                        // 2.2
                        .post("/", async ({params, body, db}) => {
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
                        .delete("/:itemId", async ({params, db}) => {
                            await db.deleteItem(params.userId, params.itemId);
                        }, {
                            params: t.Object({
                                itemId: t.Integer()
                            })
                        })
                        // 2.4
                        .put("/:itemId", async ({params, body, db}) => {
                            await db.updateItem(params.userId, params.itemId, body);
                        }, {
                            params: t.Object({
                                itemId: t.Integer()
                            }),
                            body: t.Partial(t.Omit(itemObject, ["id", "created_by"]))
                        })
                        // 2.5
                        .post("/:itemId/options", async ({params, body, db}) => {
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
                        .delete("/:itemId/options/:optionId", async ({params, body, db}) => {
                            await db.deleteOption(params.userId, params.itemId, params.optionId);
                        }, {
                            params: t.Object({
                                itemId: t.Integer(),
                                optionId: t.Integer()
                            })
                        })
                        // 2.7
                        .put("/:itemId/options/:optionId", async ({params, body, db}) => {
                            await db.updateOption(params.userId, params.itemId, params.optionId, body);
                        }, {
                            params: t.Object({
                                itemId: t.Integer(),
                                optionId: t.Integer()
                            }),
                            body: t.Partial(itemOptionObject)
                        })
                        // 2.8
                        .post("/:itemId/options/:optionId/selections", async ({params, body, db}) => {
                            await db.createOptionSelection(params.userId, params.optionId, body);
                        }, {
                            params: t.Object({
                                optionId: t.Integer()
                            }),
                            body: t.Omit(itemOptionSelectObject, ["created_by", "option_id", "id"])
                        })
                        // 2.9
                        .delete("/:itemId/options/:optionId/selections/:selectionLabel", async ({params, db}) => {
                            await db.deleteOptionSelection(params.userId, params.optionId, params.selectionLabel);
                        }, {
                            params: t.Object({
                                optionId: t.Integer(),
                                selectionLabel: t.String(),
                            })
                        })
                        // 2.10
                        .put("/:itemId/options/:optionId/selections/:selectionLabel", async ({params, body, db}) => {
                            await db.updateOptionSelection(params.userId, params.optionId, params.selectionLabel, body);
                        }, {
                            params: t.Object({
                                optionId: t.Integer(),
                                selectionLabel: t.String(),
                            }),
                            body: t.Partial(t.Omit(itemOptionSelectObject, ["created_by", "option_id", "id"]))
                        })
                )
                // 3 --- CARTS
                .group("/carts", c_app =>
                    c_app
                        // 3.1
                        .get("/", async ({params, query, db}) => {
                            await db.getCartDetails(params.userId, query.menu);
                        }, {
                            query: t.Object({
                                menu: uuidObject
                            })
                        })
                        // 3.2
                        .post("/", async ({params, body, db}) => {
                            await db.createCart(params.userId, body.menu_id);
                        }, {
                            body: t.Object({
                                menu_id: uuidObject
                            })
                        })
                        // 3.3
                        .get("/:cartId/items", async ({params, body, db}) => {
                            await db.getItemsInCart(params.cart_id);
                        }, {
                            params: t.Object({
                                cart_id: t.Integer()
                            })
                        })
                        // 3.4
                        .post("/:cartId/items", async ({params, body, db}) => {
                            await db.addItemToCart(params.cart_id, body.item_id, body.count, body.selections)
                        }, {
                            params: t.Object({
                                cart_id: t.Integer()
                            }),
                            body: t.Object({
                                item_id: t.Integer(),
                                count: t.Integer(),
                                selections: t.Optional(t.Array(t.Number(), {minItems: 1}))
                            })
                        })
                        // 3.5
                        .delete("/:cartId/items", async ({params, body, db}) => {
                            await db.updateItemInCartCount(body.cart_item_id, body.count);
                        }, {
                            body: t.Object({
                                cart_item_id: t.Integer(),
                                count: t.Integer(),
                            })
                        })
                )
    )