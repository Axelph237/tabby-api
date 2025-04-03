import { afterAll, describe, expect, test } from 'bun:test'
import {
	dbState,
	testItems,
	testMenus,
	testPgService,
	testUsers,
} from '../db-utils'
import { randomUUIDv7 } from 'bun'

describe('menus', () => {
	// 1.1
	test('get menu', async () => {
		// Find way of getting menu id to run this test
		const menu = await testPgService.getMenu(testMenus[0].id)
		expect(menu).toBeTruthy()
		expect(menu!.id).toBe(testMenus[0].id)
	})

	// 1.2
	test('get menu items', async () => {
		const menu = await testPgService.getUserMenus(testUsers[0].id)
		expect(menu).toBeTruthy()

		const items = await testPgService.getItemsFromMenu(menu![0].id)

		expect(items).toBeTruthy()
		expect(items!.length).toBeGreaterThan(0)
		expect(items![0]).toBeObject()
	})

	// 1.3
	test('get user menus', async () => {
		const menu = await testPgService.getUserMenus(testUsers[0].id)

		expect(menu).toBeTruthy()
		expect(menu![0]).toBeObject()
	})

	// 1.4
	test('create menu', async () => {
		const uuid = randomUUIDv7()
		const menu = await testPgService.createMenu('Test Create Menu', uuid)

		expect(menu).toBeTruthy()
	})

	// 1.5 test 1
	test('add item to menu - new item', async () => {
		const item = {
			name: 'Test Item 1',
			description: 'A random example item.',
			img_url: null,
			base_price: 1450,
		}

		const id = await testPgService.createItem(testUsers[0].id, item)
		expect(id).toBeInteger()

		// Verify item exists on menu
		const items = await testPgService.getItemsFromMenu(testMenus[0].id)
		expect(items).toBeTruthy()

		for (const item of items!) {
			if (item.id == id) {
				expect(item.id).toBe(id)
				break
			}
		}
	})

	// 1.5 test 2
	// TODO edit get_item sql functions to return item ids, and update ALL item query functions to return item ids.
	// TODO ... give up on item ids being obscured at this time.
	test.todo('add items to menu - item id', async () => {
		const userId = testUsers[1].id

		const menu = await testPgService.createMenu('Menu 3', userId)
		expect(menu!.id).toBeTruthy()

		const items = await testPgService.getUserItems(userId)
		expect(items!.length).toBeGreaterThan(0)

		const result = await testPgService.addItemToMenu(menu!.id, items![0].id)
		expect(result).toBe(true)
	})

	// 1.6
	test('remove items from menu', async () => {
		const menuId = testMenus[0].id

		const items = await testPgService.getItemsFromMenu(menuId)
		expect(items).toBeTruthy()
		expect(items!.length).toBeGreaterThan(0)

		const response = await testPgService.deleteItemFromMenu(
			menuId,
			items![0].id
		)
		expect(response).toBe(true)
	})
})

describe('items', () => {
	// 2.1
	test("get user's items", async () => {
		const userId = testUsers[0].id

		const result = await testPgService.getUserItems(userId)
		expect(result?.length).toBe(6)
	})

	// 2.2
	test('create new item', async () => {
		const userId = testUsers[0].id
		const item = {
			name: 'Test Item 1',
			description: 'hello',
			img_url: 'fake url',
			base_price: 1000,
		}

		const itemId = await testPgService.createItem(userId, item)
		expect(itemId).toBe(10)
	})

	// 2.3
	test('delete items', async () => {
		const userId = testUsers[0].id
		const itemId = 10

		const result = await testPgService.deleteItems(userId, itemId)
		expect(result).toBe(true)
	})

	// 2.4
	test('update item', async () => {
		const userId = testUsers[0].id
		const itemId = 5
		const updateVals = {
			name: 'Updated Item',
			description: 'Some NEW description',
		}

		const updatedItem = await testPgService.updateItem(
			userId,
			itemId,
			updateVals
		)
		expect(updatedItem?.name).toBe('Updated Item')
		expect(updatedItem?.description).toBe('Some NEW description')
	})

	// 2.5
	test('add item option', async () => {
		const userId = testUsers[0].id
		const itemId = 5
		const newOpt: { label: string; type: 'one' | 'many' | 'text' } = {
			label: 'An option',
			type: 'one',
		}

		const option = await testPgService.createOption(userId, itemId, newOpt)
		expect(option?.item_id).toBe(itemId)
		expect(option?.label).toBe('An option')
		expect(option?.type).toBe('one')
	})

	// 2.6
	test('remove item option', async () => {
		const userId = testUsers[0].id
		const itemId = 5
		const optionId = 1

		const result = await testPgService.deleteOptions(
			userId,
			itemId,
			1
		)
		expect(result).toBe(true)
	})

	// 2.7
	test('update item option', async () => {
		const userId = testUsers[0].id
		const itemId = 5
		const newOpt: { label: string; type: 'one' | 'many' | 'text' } = {
			label: 'Bad label',
			type: 'text',
		}
		const createRes = await testPgService.createOption(
			userId,
			itemId,
			newOpt
		)
		expect(createRes).toBeTruthy()

		const updateOpt = {
			label: 'Good label',
		}
		const result = await testPgService.updateOption(
			userId,
			itemId,
			createRes!.id,
			updateOpt
		)
		expect(result?.label).toBe('Good label')
	})

	// 2.8
	test('add option selection', async () => {
		const userId = testUsers[0].id
		const optionId = 2
		const newSelection = {
			label: 'New selection',
			price: 100,
			is_default: true,
		}

		const result = await testPgService.createSelection(
			userId,
			optionId,
			newSelection
		)
		expect(result?.label).toBe(newSelection.label)
	})

	// 2.9
	// TODO make use optionId rather than optionLabel
	// TODO update APIspec to reflect changes
	test('remove option selection', async () => {
		const userId = testUsers[0].id
		const optionId = 2
		const selectionLabel = 'New selection'

		const result = await testPgService.deleteSelections(
			userId,
			optionId,
			selectionLabel
		)
		expect(result).toBe(true)
	})

	// 2.10
	test('update option selection', async () => {
		const userId = testUsers[0].id
		const optionId = 2
		const newSelection = {
			label: 'New selection',
			price: 100,
			is_default: true,
		}

		const createRes = await testPgService.createSelection(
			userId,
			optionId,
			newSelection
		)
		expect(createRes?.label).toBe(newSelection.label)

		const updates = {
			label: 'UPDATED label',
			price: 500,
		}
		const result = await testPgService.updateSelection(
			userId,
			optionId,
			newSelection.label,
			updates
		)
		expect(result?.label).toBe(updates.label)
	})
})

describe('carts', () => {
	const menuId = testMenus[0].id

	// 3.1
	test('get cart details', async () => {
		const userId = testUsers[2].id

		const result = await testPgService.getCartDetails(userId, menuId)
		expect(result?.id).toBeNumber()
		expect(result?.created_by).toBe(userId)
		expect(result?.cart_items.length).toBe(5)
	})

	// 3.2
	test('create new cart', async () => {
		const userId = testUsers[1].id

		const result = await testPgService.createCart(userId, menuId)
		expect(result?.id).toBeTruthy()
		expect(result?.created_by).toBe(userId)
		expect(result?.menu_id).toBe(menuId)
	})

	// 3.3
	test('get cart items', async () => {
		const cartId = 1

		const result = await testPgService.getItemsInCart(cartId)
		expect(result?.length).toBeGreaterThan(0)
	})

	// 3.4
	test('add item no selections to cart', async () => {
		const userId = randomUUIDv7()

		const newCart = await testPgService.createCart(userId, menuId)
		expect(newCart).toBeTruthy()

		const items = await testPgService.getItemsFromMenu(menuId)
		expect(items).toBeTruthy()
		const item = {
			id: items![0].id,
			count: 3,
			selections: [],
		}

		const result = await testPgService.addItemToCart(newCart!.id, item.id, item.count, item.selections)
		expect(result).toBeTruthy()
		expect(result!.name).toBe('Taco')
		expect(result!.count).toBe(item.count)
	})

	// 3.5
	test('remove item from cart', async () => {
		const userId = testUsers[2].id
		const deleteCount = 40;

		const cart = await testPgService.getCartDetails(userId, menuId)
		expect(cart).toBeTruthy()
		const cartItems = await testPgService.getItemsInCart(cart!.id)
		expect(cartItems).toBeTruthy()

		const result = await testPgService.updateItemInCartCount(
			cartItems![0].cart_item_id,
			-deleteCount
		)
		expect(result.was_deleted).toBe(cartItems![0].count - deleteCount <= 0)
	})
})
