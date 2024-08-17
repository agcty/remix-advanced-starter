DO $$ BEGIN
 CREATE TYPE "public"."user_global_role" AS ENUM('SUPERADMIN', 'CUSTOMER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."permission_access" AS ENUM('own', 'any');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."permission_action" AS ENUM('create', 'read', 'update', 'delete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider_name" varchar(50) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_connections_provider_name_provider_id_unique" UNIQUE("provider_name","provider_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_passwords" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expiration_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"type" varchar(50) NOT NULL,
	"target" varchar(255) NOT NULL,
	"secret" text NOT NULL,
	"algorithm" varchar(50) NOT NULL,
	"digits" integer NOT NULL,
	"period" integer NOT NULL,
	"char_set" varchar(100) NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "auth_verifications_target_type_unique" UNIQUE("target","type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mt_membership_roles" (
	"membership_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "mt_membership_roles_membership_id_role_id_pk" PRIMARY KEY("membership_id","role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mt_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"user_id" integer,
	"invited_name" text,
	"invited_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mt_memberships_organization_id_invited_email_unique" UNIQUE("organization_id","invited_email"),
	CONSTRAINT "mt_memberships_user_id_organization_id_unique" UNIQUE("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mt_organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mt_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" "permission_action" NOT NULL,
	"entity" text NOT NULL,
	"access" "permission_access" NOT NULL,
	"description" text DEFAULT '',
	CONSTRAINT "mt_permissions_action_entity_access_unique" UNIQUE("action","entity","access")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mt_role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "mt_role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mt_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	CONSTRAINT "mt_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mt_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"active_organization_id" integer NOT NULL,
	"global_role" "user_global_role" DEFAULT 'CUSTOMER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mt_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_connections" ADD CONSTRAINT "auth_connections_user_id_mt_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mt_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_passwords" ADD CONSTRAINT "auth_passwords_user_id_mt_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mt_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_mt_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mt_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mt_membership_roles" ADD CONSTRAINT "mt_membership_roles_membership_id_mt_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."mt_memberships"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mt_membership_roles" ADD CONSTRAINT "mt_membership_roles_role_id_mt_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."mt_roles"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mt_memberships" ADD CONSTRAINT "mt_memberships_organization_id_mt_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."mt_organizations"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mt_memberships" ADD CONSTRAINT "mt_memberships_user_id_mt_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mt_users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mt_role_permissions" ADD CONSTRAINT "mt_role_permissions_role_id_mt_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."mt_roles"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mt_role_permissions" ADD CONSTRAINT "mt_role_permissions_permission_id_mt_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."mt_permissions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mt_users" ADD CONSTRAINT "mt_users_active_organization_id_mt_organizations_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."mt_organizations"("id") ON DELETE no action ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "auth_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_sessions_id_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "target_idx" ON "auth_verifications" USING btree ("target");