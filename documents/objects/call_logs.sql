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

 Date: 03/12/2019 08:42:44
*/


-- ----------------------------
-- Table structure for call_logs
-- ----------------------------
DROP TABLE IF EXISTS "prod"."call_logs";
CREATE TABLE "prod"."call_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "status" varchar(20) COLLATE "pg_catalog"."default",
  "to_phone" varchar(50) COLLATE "pg_catalog"."default",
  "from_phone" varchar(50) COLLATE "pg_catalog"."default",
  "record_url" varchar(5000) COLLATE "pg_catalog"."default",
  "duration" int4,
  "call_id" varchar(300) COLLATE "pg_catalog"."default",
  "created_at" int8,
  "type" varchar(255) COLLATE "pg_catalog"."default",
  "name" varchar(30) COLLATE "pg_catalog"."default",
  "username" varchar(255) COLLATE "pg_catalog"."default",
  "answered_duration" int4,
  "id_sys" varchar(100) COLLATE "pg_catalog"."default",
  "cdrid" varchar(100) COLLATE "pg_catalog"."default",
  "refer" varchar(50) COLLATE "pg_catalog"."default",
  "callee_id" varchar(300) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Primary Key structure for table call_logs
-- ----------------------------
ALTER TABLE "prod"."call_logs" ADD CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id");
