CREATE SCHEMA "auth";

CREATE TABLE "auth"."accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"tokenType" text,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"idToken" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"deletedAt" timestamp,
	CONSTRAINT "accounts_userId_providerId_unique" UNIQUE("userId","providerId")
);
--> statement-breakpoint
CREATE TABLE "item_options" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "item_options_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"label" text NOT NULL,
	"type" text NOT NULL,
	"parentItemId" integer NOT NULL,
	"ownerId" uuid NOT NULL,
	CONSTRAINT "item_options_parentItemId_label_unique" UNIQUE("parentItemId","label")
);
--> statement-breakpoint
CREATE TABLE "item_selections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "item_selections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"parentItemId" integer NOT NULL,
	"parentOptionId" integer,
	"label" text NOT NULL,
	"price" integer,
	"isDefault" boolean DEFAULT false,
	"ownerId" uuid NOT NULL,
	CONSTRAINT "item_selections_parentOptionId_parentItemId_label_unique" UNIQUE("parentOptionId","parentItemId","label")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text,
	"imgUrl" text,
	"basePrice" integer,
	"ownerId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "items_to_menus" (
	"itemId" integer NOT NULL,
	"menuId" uuid NOT NULL,
	CONSTRAINT "items_to_menus_itemId_menuId_pk" PRIMARY KEY("itemId","menuId")
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"style" jsonb,
	"createdBy" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_line_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"itemId" integer NOT NULL,
	"orderId" integer NOT NULL,
	"count" integer NOT NULL,
	"unitPrice" integer NOT NULL,
	"selections" integer[]
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"placedAt" timestamp NOT NULL,
	"sessionId" uuid NOT NULL,
	"guestName" text NOT NULL,
	"orderNum" integer,
	"totalCost" integer DEFAULT 0 NOT NULL,
	"totalItems" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_admins" (
	"sessionId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	CONSTRAINT "session_admins_sessionId_userId_pk" PRIMARY KEY("sessionId","userId")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menuId" uuid NOT NULL,
	"expiresAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "auth"."accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_options" ADD CONSTRAINT "item_options_parentItemId_items_id_fk" FOREIGN KEY ("parentItemId") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_options" ADD CONSTRAINT "item_options_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_selections" ADD CONSTRAINT "item_selections_parentItemId_items_id_fk" FOREIGN KEY ("parentItemId") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_selections" ADD CONSTRAINT "item_selections_parentOptionId_item_options_id_fk" FOREIGN KEY ("parentOptionId") REFERENCES "public"."item_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_selections" ADD CONSTRAINT "item_selections_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items_to_menus" ADD CONSTRAINT "items_to_menus_itemId_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items_to_menus" ADD CONSTRAINT "items_to_menus_menuId_menus_id_fk" FOREIGN KEY ("menuId") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_itemId_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_admins" ADD CONSTRAINT "session_admins_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_admins" ADD CONSTRAINT "session_admins_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_menuId_menus_id_fk" FOREIGN KEY ("menuId") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "item_options_created_by_hash" ON "item_options" USING hash ("ownerId");--> statement-breakpoint
CREATE INDEX "item_selections_created_by_hash" ON "item_selections" USING hash ("ownerId");--> statement-breakpoint
CREATE INDEX "items_created_by_hash" ON "items" USING hash ("ownerId");