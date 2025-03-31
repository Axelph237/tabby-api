# API Specifications

## 1. Menus

### 1.1 `GET` User's Menus

**URL:** `/menus`
_Requires registered account._

#### Response

```json
[
  {
    "id": UUID,
    "created_at": Date,
    "created_by": UUID,
    "name": string
  }
]
```

### 1.2 `POST` Create New Menu

**URL:** `/menus`
_Requires registered account._

#### Request

```json
{
  "name": string
}
```

#### Response

```json
{
  "id": UUID,
  "created_at": Date,
  "created_by": UUID,
  "name": string
}
```

### 1.3 `GET` Menu Details

**URL:** `/menus/:menuId`
_Requires registered account._

#### Response

```json
{
  "id": UUID,
  "created_at": Date,
  "created_by": UUID,
  "name": string,
  "items": [ number ] // Item ids on menu
}
```

### 1.4 `POST` Add Item to Menu

**URL:** `/menus/:menuId/items`
_Requires registered account._

#### Request

Option 1: Create new menu item

```json
{
  "name": string,
  "description": string | null,
  "img_url": url | null,
  "base_price": number
}
```

Option 2: Add existing item by ID

```json
{
  "id": integer
}
```

#### Response

```json
[
  {
    "id": UUID,
    "created_by": UUID,
    "name": string,
    "description": string | null,
    "img_url": url | null,
    "base_price": number | null,
    "options": [
      {
        "name": string,
        "type": "one" | "many" | "text",
        "selections": [
          {
            "label": string,
            "price": number,
            "is_default": boolean
          }
        ]
      }
    ]
  }
]
```

### 1.5 `DELETE` Remove Items from Menu

**URL:** `/menus/:menuId/items/:menuItemId`
_Requires registered account._

## 2. Items

### 2.1 `GET` User's Items

**URL:** `/items`
_Requires registered account._

#### Response

```json
[
  {
    "id": integer,
    "created_by": UUID,
    "name": string,
    "description": string | null,
    "img_url": url | null,
    "base_price": number | null,
    "options": [
      {
        "name": string,
        "type": "one" | "many" | "text",
        "selections": [
          {
            "label": string,
            "price": number,
            "is_default": boolean
          }
        ]
      }
    ]
  }
]
```

### 2.2 `POST` Create New Item

**URL:** `/items`
_Items created this way will not be associated with a menu until imported._

#### Request

```json
{
  "name": string,
  "description": string | null,
  "img_url": url | null,
  "base_price": number | null,
  "options": [
    {
      "name": string,
      "type": "one" | "many" | "text",
      "selections": [
        {
          "label": string,
          "price": number,
          "is_default": boolean
        }
      ]
    }
  ]
}
```

#### Response

```json
{
  "id": integer,
  "created_by": UUID,
  "name": string,
  "description": string | null,
  "img_url": url | null,
  "base_price": number | null,
  "options": [
    {
      "name": string,
      "type": "one" | "many" | "text",
      "selections": [
        {
          "label": string,
          "price": number,
          "is_default": boolean
        }
      ]
    }
  ]
}
```

### 2.3 `DELETE` Delete Item

**URL:** `/items/`
_Requires registered account._

#### Request
```json
[
  number // Item ids
]
```

### 2.4 `PUT` Update Item

**URL:** `/items/:itemId`
_Requires registered account. Cannot update ID._

#### Request

```json
{
  "field": "new_value",
  ...
}
```

#### Response

```json
{
  "id": integer,
  "created_by": UUID,
  "name": string,
  "description": string | null,
  "img_url": url | null,
  "base_price": number | null
}
```

### 2.5 `POST` Add Item Option

**URL:** `/items/:itemId/options`
_Requires registered account._

#### Request

```json
{
  "label": string,
  "type": "one" | "many" | "text"
}
```

### 2.6 `DELETE` Remove Item Options

**URL:** `/items/:itemId/options/`
_Requires registered account. No response body._

#### Request
```json
[
  number // Option ids
]
```

### 2.7 `PUT` Update Item Option

**URL:** `/items/:itemId/options/:optionId`
_Requires registered account. Only updates defined fields._

#### Request

```json
{
  "label": string | undefined,
  "type": string | undefined
}
```

### 2.8 `POST` Add Option Selection

**URL:** `/items/:itemId/selections`
_Requires registered account. Fails if parent option type is "text"._

#### Request

```json
{
  "parent_option": number | undefined,
  "label": string,
  "price": number,
  "is_default": boolean
}
```

#### Response

```json
{
  "id": number,
  "option_id": number,
  "created_by": UUID,
  "label": string,
  "price": number,
  "is_default": boolean
}
```

### 2.9 `DELETE` Remove Selections

**URL:** `/items/:itemId/selections`
_Requires registered account. No response body._

#### Request
```json
[
  number // Selection ids
]
```

### 2.10 `PUT` Update Selection

**URL:** `/items/:itemId/selections/:selId`
_Requires registered account. Only updates defined fields._

#### Request

```json
{
  "parent_option": number | undefined,
  "label": string | undefined,
  "price": number | undefined,
  "is_default": boolean | undefined
}
```

#### Response

```json
{
  "id": number,
  "option_id": number,
  "created_by": UUID,
  "label": string,
  "price": number,
  "is_default": boolean
}
```

## 3. Orders

### 3.1 `GET` all Orders for a session.
**URL:** `orders/:sessId`

### 3.2 `POST` request new Order for a session.
**URL:** `orders/:sessId`

#### Request

```json
{
  "guest_name": string,
  "placed_at": timestamp,
  "order_cost": number,
  "items": [
    {
      "item_id": number, // references item on menu
      "selections": [ number ] // references selections made on that item
      "count": number
    },
    ...
  ]
}
```

#### Response
_A 200 level response indicated that the order has been received and placed. Anything else means an error has occured._


### 3.3 `DELETE` cancel an Order.
**URL:** `/orders/:sessId/:orderId`
_Cancels the placed order. Must be done by the session admin. No request/response bodies._

## 4. Sessions

### 4.1 `POST` create new Session
**URL:** `sessions/`
_Registered user must be owner of the menu_
#### Request
```json
{
  "menu_id": UUID,
  "session_admins": [ UUID ], // list of users with ability to manage orders on session.
  "expires": Date // time for session to automatically close at. -1 leaves session open until manually closed.
}
```

### 4.2 `DELETE` close Session.
**URL:** `sessions/:sessId`
_Registered user must be session admin._


## Deprecated
### #. Carts

### #.1 `GET` Cart Details

**URL:** `/users/:userId/carts?menu`

#### Response

```json
{
  "id": integer,
  "created_at": Date,
  "created_by": UUID,
  "menu_id": UUID,
  "total_cost": number,
  "cart_items": [
    {
      "count": number,
      "item_id": integer
    }
  ]
}
```

### #.2 `POST` Create New Cart

**URL:** `/users/:userId/carts`

#### Request

```json
{
  "menu_id": UUID
}
```

#### Response

```json
{
  "id": integer,
  "created_by": UUID,
  "menu_id": UUID,
  "total_cost": 0,
  "cart_items": []
}
```

### #.3 `GET` Cart Items

**URL:** `/users/:userId/carts/:cartId/items`

#### Response

```json
[
  {
    "cart_item_id": integer,
    "item_id": integer,
    "count": number,
    "name": string,
    "description": string | null,
    "img_url": url | null,
    "unit_price": number,
    "options": [
      {
        "name": string,
        "type": "one" | "many" | "text",
        "selections": [
          {
            "label": string,
            "price": number
          }
        ]
      }
    ]
  }
]
```

### #.4 `POST` Add Items to Cart

**URL:** `/users/:userId/carts/:cartId/items`

#### Request

```json
[
  {
    "menu_item_id": integer,
    "count": number,
    "options": [
      {
        "name": string,
        "type": "one" | "many" | "text",
        "selections": [
          {
            "label": string,
            "price": number
          }
        ]
      }
    ]
  }
]
```

#### Response

```json
[
  {
    "id": integer,
    "name": string,
    "description": string | null,
    "img_url": url | null,
    "count": number,
    "base_price": number,
    "total_price": number,
    "options": [
      {
        "name": string,
        "type": "one" | "many" | "text",
        "selections": [
          {
            "label": string,
            "price": number
          }
        ]
      }
    ]
  }
]
```

### #.5 `DELETE` Remove Items from Cart

**URL:** `/users/:userId/carts/:cartId/items`

#### Request

```json
[
  {
    "item_id": integer,
    "count": number
  }
]
```
