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

 Date: 03/12/2019 08:43:12
*/


-- ----------------------------
-- Table structure for job_tmps
-- ----------------------------
DROP TABLE IF EXISTS "prod"."job_tmps";
CREATE TABLE "prod"."job_tmps" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "sf_job_id" varchar(50) COLLATE "pg_catalog"."default",
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "gw_job_id" varchar(32) COLLATE "pg_catalog"."default",
  "uuid" uuid NOT NULL,
  "step" int2,
  "deleted_at" varchar(32) COLLATE "pg_catalog"."default",
  "object" varchar(255) COLLATE "pg_catalog"."default",
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 1
)
;
COMMENT ON COLUMN "prod"."job_tmps"."sf_job_id" IS 'Id của Job CRM';
COMMENT ON COLUMN "prod"."job_tmps"."created_at" IS 'Ngày tạo của hệ thống';
COMMENT ON COLUMN "prod"."job_tmps"."gw_job_id" IS 'JOB ID của KUE';
COMMENT ON COLUMN "prod"."job_tmps"."uuid" IS 'ID của hệ thống';
COMMENT ON COLUMN "prod"."job_tmps"."step" IS 'Lỗi ở bước trong code: 0 -> lỗi Job chưa hoàn thành, -1 -> lỗi khi get job từ SF, -2 -> lỗi lấy dữ liệu failed';
COMMENT ON COLUMN "prod"."job_tmps"."deleted_at" IS '!= null là đã xử lý và đã xóa';
COMMENT ON COLUMN "prod"."job_tmps"."object" IS 'Object xử lý';
COMMENT ON COLUMN "prod"."job_tmps"."status" IS 'Failed, Job Complete';

-- ----------------------------
-- Primary Key structure for table job_tmps
-- ----------------------------
ALTER TABLE "prod"."job_tmps" ADD CONSTRAINT "job_tmps_pkey" PRIMARY KEY ("id");
