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

 Date: 03/12/2019 08:42:37
*/


-- ----------------------------
-- Table structure for added_value_in_sales_order__c
-- ----------------------------
DROP TABLE IF EXISTS "prod"."added_value_in_sales_order__c";
CREATE TABLE "prod"."added_value_in_sales_order__c" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "key" varchar(255) COLLATE "pg_catalog"."default",
  "value" jsonb,
  "push" int2,
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "operation" varchar(20) COLLATE "pg_catalog"."default",
  "status" int2 DEFAULT 0,
  "sf_error" varchar(500) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "sf_job_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "prod"."added_value_in_sales_order__c"."status" IS '1: oke, 0: fail (job), 2: fail (job CRM)';

-- ----------------------------
-- Primary Key structure for table added_value_in_sales_order__c
-- ----------------------------
ALTER TABLE "prod"."added_value_in_sales_order__c" ADD CONSTRAINT "added_value_in_sales_order__c_pkey" PRIMARY KEY ("id");
