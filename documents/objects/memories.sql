/*
 Navicat Premium Data Transfer

 Source Server         : 183.91.11.56-pgr
 Source Server Type    : PostgreSQL
 Source Server Version : 110001
 Source Host           : 183.91.11.56:5432
 Source Catalog        : vnp_gateway
 Source Schema         : prod

 Target Server Type    : PostgreSQL
 Target Server Version : 110001
 File Encoding         : 65001

 Date: 03/12/2019 08:43:32
*/


-- ----------------------------
-- Table structure for memories
-- ----------------------------
DROP TABLE IF EXISTS "prod"."memories";
CREATE TABLE "prod"."memories" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "memory_at" varchar(32) COLLATE "pg_catalog"."default",
  "object" varchar(100) COLLATE "pg_catalog"."default",
  "operation" varchar(30) COLLATE "pg_catalog"."default",
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "memory_end_at" varchar(32) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "prod"."memories"."memory_at" IS 'Time get data last';
COMMENT ON COLUMN "prod"."memories"."object" IS 'Object in SF';
COMMENT ON COLUMN "prod"."memories"."operation" IS 'Insert, Update, Delete ...';
COMMENT ON COLUMN "prod"."memories"."created_at" IS 'Time now';
COMMENT ON COLUMN "prod"."memories"."memory_end_at" IS 'Time get data first';

-- ----------------------------
-- Primary Key structure for table memories
-- ----------------------------
ALTER TABLE "prod"."memories" ADD CONSTRAINT "memories_pkey" PRIMARY KEY ("id");
