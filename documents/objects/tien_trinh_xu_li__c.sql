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

 Date: 03/12/2019 08:43:58
*/


-- ----------------------------
-- Table structure for tien_trinh_xu_li__c
-- ----------------------------
DROP TABLE IF EXISTS "prod"."tien_trinh_xu_li__c";
CREATE TABLE "prod"."tien_trinh_xu_li__c" (
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
COMMENT ON COLUMN "prod"."tien_trinh_xu_li__c"."status" IS '1: oke, 0: fail (job)';

-- ----------------------------
-- Primary Key structure for table tien_trinh_xu_li__c
-- ----------------------------
ALTER TABLE "prod"."tien_trinh_xu_li__c" ADD CONSTRAINT "tien_trinh_xu_li__c_pkey" PRIMARY KEY ("id");
