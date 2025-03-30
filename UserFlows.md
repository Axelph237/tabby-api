# User Flows

## Anonymous Checkout

1. User scans QR code
2. User is taken to menu page
    1. Menu page has menuId in URL
    2. Menu page GETS menu details `/menus/:menuId/`
    3. Menu page GETS menu items `/menus/:menuId/items/`
3. User proceeds to checkout page
4. User enters checkout name.
5. User checks out:
    1. User's cart is POSTed to `/users/guests/:guestName/carts/`.
    2. Server creates cart, returning cart details and new guestId.
6. User's checkout succeeds and they are taken to queue page.

## Menu Creation

1. User logs into registered account, getting userId.
2. User accesses menus with GET from `/users/:userId/menus/`
3. User creates new menu with POST to `/users/:userId/menus/`
4. User adds items to menu with POST to `/users/:userId/menus/:menuId/items/`, getting itemId.
    1. Posting item object will create new item _then_ add it to menu.
    2. Posting an array of itemIds will create entries for items in menu_items.

## Item Without Menu Creation

1. User logs into registered account, getting userId.
2. User creates new item with POST to `/users/:userId/items/`
3. User adds new item options with POST to `/users/:userId/items/:itemId/options/`
4. User adds option selections with POST to `/users/:userId/items/:itemId/options/:optionName/selections/`
