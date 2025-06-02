import { describe, expect, test } from 'bun:test'
import ItemRepository from '@features/item/item.repository'
import db, { client } from '@config/drizzle/db'
import { itemsTable } from '@config/drizzle/tables/items.table'
import { sql } from 'drizzle-orm'

describe("Test Items Repository", () => {

	test("Test Items Repository Items Query", async () => {
		console.log("Client:", db.$client.options)

		const repo = new ItemRepository()

		try {
			const bunRes = await client`
				SELECT * FROM items;
			`
			console.log("Bun Result:", bunRes);

			// const result2 = await db.select().from(itemsTable);
			// console.log("Result 2", result2)

		}
		catch (e) {
			console.log(e);
		}

	})
})