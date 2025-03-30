# API Specifications

## 1. Menus

### 1.1 `GET` Menu Details

**URL:** `/menus/:menuId`

#### Response

```json
{
  "id": UUID,
  "created_at": Date,
  "created_by": UUID,
  "name": string
}
```

### 1.2 `GET` Items on Menu

**URL:** `/menus/:menuId/items`

#### Response

```json
[
  {
    "menu_item_id": UUID,
    "item_id": integer,
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

### 1.3 `GET` User's Menus

**URL:** `/users/registered/:userId/menus`
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

### 1.4 `POST` Create New Menu

**URL:** `/users/registered/:userId/menus`
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

### 1.5 `POST` Add Item to Menu

**URL:** `/users/registered/:userId/menus/:menuId/items`
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

### 1.6 `DELETE` Remove Items from Menu

**URL:** `/users/registered/:userId/menus/:menuId/items/:menuItemId`
_Requires registered account._

## 2. Items

### 2.1 `GET` User's Items

**URL:** `/users/registered/:userId/items`
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

**URL:** `/users/registered/:userId/items`
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

### 2.3 `DELETE` Delete Items

**URL:** `/users/registered/:userId/items/:itemId`
_Requires registered account._

### 2.4 `PUT` Update Item

**URL:** `/users/registered/:userId/items/:itemId`
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

**URL:** `/users/registered/:userId/items/:itemId/options`
_Requires registered account._

#### Request

```json
{
  "label": string,
  "type": "one" | "many" | "text"
}
```

### 2.6 `DELETE` Remove Item Option

**URL:** `/users/registered/:userId/menu-items/:itemId/options/:optionId`
_Requires registered account. No request or response body._

### 2.7 `PUT` Update Item Option

**URL:** `/users/registered/:userId/menu-items/:itemId/options/:optionId`
_Requires registered account. Only updates defined fields._

#### Request

```json
{
  "label": string | undefined,
  "type": string | undefined
}
```

### 2.8 `POST` Add Option Selection

**URL:** `/users/registered/:userId/items/:itemId/options/:optionId/selections`
_Requires registered account. Fails if parent option type is "text"._

#### Request

```json
{
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

### 2.9 `DELETE` Remove Option Selection

**URL:** `/users/registered/:userId/items/:itemId/options/:optionId/selections/:selectionLabel`
_Requires registered account. No request or response body._

### 2.10 `PUT` Update Option Selection

**URL:** `/users/registered/:userId/items/:itemId/options/:optionId/selections/:selectionLabel`
_Requires registered account. Only updates defined fields._

#### Request

```json
{
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

## 3. Carts

### 3.1 `GET` Cart Details

**URL:** `/users/registered/:userId/carts?menu`

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

### 3.2 `POST` Create New Cart

**URL:** `/users/registered/:userId/carts`
_For guest users: `/users/guests/:guestName/carts`_

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

### 3.3 `GET` Cart Items

**URL:** `/users/registered/:userId/carts/:cartId/items`
_For guest users: `/users/guests/:guestName/carts/:cartId/items`_

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

### 3.4 `POST` Add Items to Cart

**URL:** `/users/registered/:userId/carts/:cartId/items`
_For guest users: `/users/guests/:guestName/carts/:cartId/items`_

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

### 3.5 `DELETE` Remove Items from Cart

**URL:** `/users/registered/:userId/carts/:cartId/items`
_For guest users: `/users/guests/:guestName/carts/:cartId/items`_

#### Request

```json
[
  {
    "item_id": integer,
    "count": number
  }
]
```
