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

 Date: 03/12/2019 08:43:18
*/


-- ----------------------------
-- Table structure for jobs
-- ----------------------------
DROP TABLE IF EXISTS "prod"."jobs";
CREATE TABLE "prod"."jobs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "pid" varchar(50) COLLATE "pg_catalog"."default",
  "operation" varchar(50) COLLATE "pg_catalog"."default",
  "object" varchar(255) COLLATE "pg_catalog"."default",
  "created_by_id" varchar(30) COLLATE "pg_catalog"."default",
  "created_date" varchar(50) COLLATE "pg_catalog"."default",
  "system_modstamp" varchar(50) COLLATE "pg_catalog"."default",
  "state" varchar(20) COLLATE "pg_catalog"."default",
  "concurrency_mode" varchar(10) COLLATE "pg_catalog"."default",
  "content_type" varchar(50) COLLATE "pg_catalog"."default",
  "api_version" float4,
  "content_url" varchar(255) COLLATE "pg_catalog"."default",
  "line_ending" varchar(10) COLLATE "pg_catalog"."default",
  "column_delimiter" varchar(10) COLLATE "pg_catalog"."default",
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "job_id" varchar(32) COLLATE "pg_catalog"."default",
  "is_checked" int2 DEFAULT 0
)
;
COMMENT ON COLUMN "prod"."jobs"."pid" IS 'Id của Job CRM';
COMMENT ON COLUMN "prod"."jobs"."operation" IS 'Trường trả về từ Job SF';
COMMENT ON COLUMN "prod"."jobs"."object" IS 'nt';
COMMENT ON COLUMN "prod"."jobs"."created_by_id" IS 'nt';
COMMENT ON COLUMN "prod"."jobs"."created_date" IS 'nt';
COMMENT ON COLUMN "prod"."jobs"."system_modstamp" IS 'nt';
COMMENT ON COLUMN "prod"."jobs"."state" IS 'nt';
COMMENT ON COLUMN "prod"."jobs"."concurrency_mode" IS 'nt';
COMMENT ON COLUMN "prod"."jobs"."content_type" IS 'nt';
COMMENT ON COLUMN "prod"."jobs"."api_version" IS 'nt';
COMMENT ON COLUMN "prod"."jobs"."content_url" IS 'nt';
COMMENT ON COLUMN "prod"."jobs"."line_ending" IS 'nt';
COMMENT ON COLUMN "prod"."jobs"."column_delimiter" IS 'nt';
COMMENT ON COLUMN "prod"."jobs"."created_at" IS 'Ngày tạo của hệ thống';
COMMENT ON COLUMN "prod"."jobs"."job_id" IS 'JOB ID của KUE';
COMMENT ON COLUMN "prod"."jobs"."is_checked" IS 'Trường để biết được job đã được check hay chưa, 1: là hoàn thành check, 0: là chưa đc check';

-- ----------------------------
-- Primary Key structure for table jobs
-- ----------------------------
ALTER TABLE "prod"."jobs" ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");
