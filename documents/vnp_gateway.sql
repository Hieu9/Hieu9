/*
 Navicat Premium Data Transfer

 Source Server         : 202.134.19.34
 Source Server Type    : PostgreSQL
 Source Server Version : 110007
 Source Host           : 202.134.19.34:5432
 Source Catalog        : vnp_gateway
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 110007
 File Encoding         : 65001

 Date: 14/02/2020 11:19:42
*/


-- ----------------------------
-- Table structure for account
-- ----------------------------
DROP TABLE IF EXISTS "public"."account";
CREATE TABLE "public"."account" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL
)
;
COMMENT ON COLUMN "public"."account"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."account"."merchant" IS 'Mã merchant: mpits, myvnpost';

-- ----------------------------
-- Table structure for added_value_in_package__c
-- ----------------------------
DROP TABLE IF EXISTS "public"."added_value_in_package__c";
CREATE TABLE "public"."added_value_in_package__c" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL,
  "external_avp_id__c" varchar(100) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."added_value_in_package__c"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."added_value_in_package__c"."merchant" IS 'Mã merchant: mpits, myvnpost';
COMMENT ON COLUMN "public"."added_value_in_package__c"."external_avp_id__c" IS 'Mã Added Value In Package VNP';

-- ----------------------------
-- Table structure for batch__c
-- ----------------------------
DROP TABLE IF EXISTS "public"."batch__c";
CREATE TABLE "public"."batch__c" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL,
  "batch_number__c" varchar(100) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."batch__c"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."batch__c"."merchant" IS 'Mã merchant: mpits, myvnpost';
COMMENT ON COLUMN "public"."batch__c"."batch_number__c" IS 'Mã Batch number của VNP';

-- ----------------------------
-- Table structure for case
-- ----------------------------
DROP TABLE IF EXISTS "public"."case";
CREATE TABLE "public"."case" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL
)
;
COMMENT ON COLUMN "public"."case"."merchant" IS 'Mã merchant';

-- ----------------------------
-- Records of case
-- ----------------------------
INSERT INTO "public"."case" VALUES ('cf0787c2-4ee0-11ea-ab53-02420a0000a5', '1581653804116', NULL, NULL, 'MPITS');

-- ----------------------------
-- Table structure for contact
-- ----------------------------
DROP TABLE IF EXISTS "public"."contact";
CREATE TABLE "public"."contact" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL
)
;
COMMENT ON COLUMN "public"."contact"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."contact"."merchant" IS 'Mã merchant: mpits, myvnpost';

-- ----------------------------
-- Table structure for gw_call_logs
-- ----------------------------
DROP TABLE IF EXISTS "public"."gw_call_logs";
CREATE TABLE "public"."gw_call_logs" (
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
-- Table structure for gw_case_mpit
-- ----------------------------
DROP TABLE IF EXISTS "public"."gw_case_mpit";
CREATE TABLE "public"."gw_case_mpit" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "casenumber" varchar COLLATE "pg_catalog"."default",
  "acountid" varchar COLLATE "pg_catalog"."default",
  "nhan_vien_cskh__c" varchar(255) COLLATE "pg_catalog"."default",
  "nhom_dich_vu__c" varchar(255) COLLATE "pg_catalog"."default",
  "location_type__c" varchar(255) COLLATE "pg_catalog"."default",
  "service__c" varchar(255) COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "origin" varchar(255) COLLATE "pg_catalog"."default",
  "priority" varchar(255) COLLATE "pg_catalog"."default",
  "employee__c" varchar(255) COLLATE "pg_catalog"."default",
  "so_phieu_khieu_nai__c" varchar(255) COLLATE "pg_catalog"."default",
  "status" varchar(255) COLLATE "pg_catalog"."default",
  "tai_lieu_dinh_kem__c" varchar(500) COLLATE "pg_catalog"."default",
  "pos__c" varchar(255) COLLATE "pg_catalog"."default",
  "sales_order__c" varchar(255) COLLATE "pg_catalog"."default",
  "transactionid" varchar(255) COLLATE "pg_catalog"."default",
  "suppliedname" varchar(500) COLLATE "pg_catalog"."default",
  "contact_address__c" varchar(255) COLLATE "pg_catalog"."default",
  "contact_province__c" varchar(255) COLLATE "pg_catalog"."default",
  "contact_district__c" varchar(255) COLLATE "pg_catalog"."default",
  "contact_commune__c" varchar(255) COLLATE "pg_catalog"."default",
  "suppliedphone" varchar(255) COLLATE "pg_catalog"."default",
  "suppliedemail" varchar(255) COLLATE "pg_catalog"."default",
  "ng_y_ti_p_nh_n__c" varchar(255) COLLATE "pg_catalog"."default",
  "ma_khach_hang_di_san__c" varchar(255) COLLATE "pg_catalog"."default",
  "error" varchar(500) COLLATE "pg_catalog"."default",
  "sfid" varchar(255) COLLATE "pg_catalog"."default",
  "li_do_khieu_nai__c" varchar(500) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for gw_jobs
-- ----------------------------
DROP TABLE IF EXISTS "public"."gw_jobs";
CREATE TABLE "public"."gw_jobs" (
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
  "is_checked" int2 DEFAULT 0,
  "merchant" varchar(30) COLLATE "pg_catalog"."default",
  "sf_error" varchar(500) COLLATE "pg_catalog"."default",
  "number_records_processed" int4,
  "number_records_failed" int4
)
;
COMMENT ON COLUMN "public"."gw_jobs"."pid" IS 'Id của Job CRM';
COMMENT ON COLUMN "public"."gw_jobs"."operation" IS 'Trường trả về từ Job SF';
COMMENT ON COLUMN "public"."gw_jobs"."object" IS 'nt';
COMMENT ON COLUMN "public"."gw_jobs"."created_by_id" IS 'nt';
COMMENT ON COLUMN "public"."gw_jobs"."created_date" IS 'nt';
COMMENT ON COLUMN "public"."gw_jobs"."system_modstamp" IS 'nt';
COMMENT ON COLUMN "public"."gw_jobs"."state" IS 'nt';
COMMENT ON COLUMN "public"."gw_jobs"."concurrency_mode" IS 'nt';
COMMENT ON COLUMN "public"."gw_jobs"."content_type" IS 'nt';
COMMENT ON COLUMN "public"."gw_jobs"."api_version" IS 'nt';
COMMENT ON COLUMN "public"."gw_jobs"."content_url" IS 'nt';
COMMENT ON COLUMN "public"."gw_jobs"."line_ending" IS 'nt';
COMMENT ON COLUMN "public"."gw_jobs"."column_delimiter" IS 'nt';
COMMENT ON COLUMN "public"."gw_jobs"."created_at" IS 'Ngày tạo của hệ thống';
COMMENT ON COLUMN "public"."gw_jobs"."job_id" IS 'JOB ID của KUE';
COMMENT ON COLUMN "public"."gw_jobs"."is_checked" IS 'Trường để biết được job đã được check hay chưa, 1: là hoàn thành check, 0: là chưa đc check';
COMMENT ON COLUMN "public"."gw_jobs"."merchant" IS 'Mã merchant';
COMMENT ON COLUMN "public"."gw_jobs"."sf_error" IS 'Lỗi trả về từ Job Failed';
COMMENT ON COLUMN "public"."gw_jobs"."number_records_processed" IS 'Số record đã xử lý';
COMMENT ON COLUMN "public"."gw_jobs"."number_records_failed" IS 'Số bản ghi lỗi';

-- ----------------------------
-- Table structure for gw_logs
-- ----------------------------
DROP TABLE IF EXISTS "public"."gw_logs";
CREATE TABLE "public"."gw_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "end_point" varchar(255) COLLATE "pg_catalog"."default",
  "merchant" varchar(255) COLLATE "pg_catalog"."default",
  "method" varchar(255) COLLATE "pg_catalog"."default",
  "total_request" int4,
  "created_at" int4,
  "save_at" int4
)
;

-- ----------------------------
-- Table structure for gw_memories
-- ----------------------------
DROP TABLE IF EXISTS "public"."gw_memories";
CREATE TABLE "public"."gw_memories" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "memory_at" varchar(32) COLLATE "pg_catalog"."default",
  "object" varchar(100) COLLATE "pg_catalog"."default",
  "operation" varchar(30) COLLATE "pg_catalog"."default",
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "memory_end_at" varchar(32) COLLATE "pg_catalog"."default",
  "job_id" varchar(32) COLLATE "pg_catalog"."default",
  "status" int2 DEFAULT 0,
  "updated_at" varchar(32) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."gw_memories"."memory_at" IS 'Time get data last';
COMMENT ON COLUMN "public"."gw_memories"."object" IS 'Object in SF';
COMMENT ON COLUMN "public"."gw_memories"."operation" IS 'Insert, Update, Delete ...';
COMMENT ON COLUMN "public"."gw_memories"."created_at" IS 'Time now';
COMMENT ON COLUMN "public"."gw_memories"."memory_end_at" IS 'Time get data first';
COMMENT ON COLUMN "public"."gw_memories"."job_id" IS 'JOB ID của KUE';
COMMENT ON COLUMN "public"."gw_memories"."status" IS 'Trạng thái của job: 0 là start và 1 là oke';
COMMENT ON COLUMN "public"."gw_memories"."updated_at" IS 'Thời gian cập nhật';
COMMENT ON COLUMN "public"."gw_memories"."merchant" IS 'Mã merchant';

-- ----------------------------
-- Table structure for gw_sessions
-- ----------------------------
DROP TABLE IF EXISTS "public"."gw_sessions";
CREATE TABLE "public"."gw_sessions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "consumer_key" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "consumer_secret" varchar(255) COLLATE "pg_catalog"."default",
  "expired_at" varchar(50) COLLATE "pg_catalog"."default",
  "created_at" varchar(255) COLLATE "pg_catalog"."default",
  "access_token" varchar(500) COLLATE "pg_catalog"."default",
  "name" varchar(255) COLLATE "pg_catalog"."default",
  "url" text COLLATE "pg_catalog"."default",
  "auth" jsonb
)
;
COMMENT ON COLUMN "public"."gw_sessions"."consumer_key" IS 'Client Key Contected App SF';
COMMENT ON COLUMN "public"."gw_sessions"."consumer_secret" IS 'Secret Key Contected App SF';
COMMENT ON COLUMN "public"."gw_sessions"."expired_at" IS 'Thời gian expired đã đc + so với thời gian tạo';
COMMENT ON COLUMN "public"."gw_sessions"."created_at" IS 'Thời điểm update và tạo bản ghi';
COMMENT ON COLUMN "public"."gw_sessions"."access_token" IS 'Token của SF';
COMMENT ON COLUMN "public"."gw_sessions"."name" IS 'Tên APP';
COMMENT ON COLUMN "public"."gw_sessions"."url" IS 'Url webhook: https://1, https://2';
COMMENT ON COLUMN "public"."gw_sessions"."auth" IS 'basic, oauth, api key';

-- ----------------------------
-- Records of gw_sessions
-- ----------------------------
INSERT INTO "public"."gw_sessions" VALUES ('b02014ec-0b5f-11ea-8d8a-0242ac110004', '3MVG9G9pzCUSkzZvLnOoNdZiIwuR9H9p.MaKQig0l59PXatjrlT4ASceYmsVZjsnZQYmtIKz3WKCl1vV3XUvL', '$2a$12$0DJffkJe0RpWyvSWsJlUge/xNoqU94682kYbDoTVM.o7sV0r8fdLq', '1577250960494', '1577243760532', '00D1y0000008ay3!AQsAQGnXLBmgoK48dBKpqcfDU48yw1XUZQe6dN2NDqDoIhAJihGYIjDgdWVQpHz2q9mSV2QgCdxLhRpiUlmlfs3dVd7DZ1b_', 'PackAndSend', NULL, NULL);
INSERT INTO "public"."gw_sessions" VALUES ('d8b1f6be-0b5f-11ea-8d8a-0242ac110004', '3MVG9G9pzCUSkzZvLnOoNdZiIwnqjLZn5AMkFNbI2ijRmLTFU_QabjACEkDavd3gLsj_AP7b9yye5nsvNwpqD', '$2a$12$HtOrsSpuRiooES6Tkat3PedpqdU0N5afHIG.CsgaEW8NCe/DrqpMG', '1577275810123', '1577268610176', '00D1y0000008ay3!AQsAQGZuqQPfmFsghLo_E_89obN7YfI9KHITPEHTr8Usw4YlgVqH3yljGINkKimXVhfvBYzhAkmMjxrZRwQzjMeCYkv8KcWR', 'SalePortal', NULL, NULL);
INSERT INTO "public"."gw_sessions" VALUES ('3568a260-0b63-11ea-8d8a-0242ac110004', '3MVG9iLRabl2Tf4gr86vkEZj9L.vd8vrhn9RTezhzKRTl9MBN241HKK2THi_us3O5d9FNQXwVotI1Zg1lRuFp', '$2a$12$5D6pFRlUK.4IZyI7bVftsOgdn0Sw5mLbW8Nr1bCqX2D4UPifybX4i', '1576753646077', '1576746446111', '00D1y0000008ay3!AQsAQLxy03TyKtjdgLiakj.HvVBQFFQViDMcwAxOaK7NzJmd1IMw_kqennnuowAzfL4_ILndiymaMyUJ.HqYsV67VQCn26eP', 'GateWay', NULL, NULL);
INSERT INTO "public"."gw_sessions" VALUES ('132a5d64-32c4-11ea-b444-0242ac110004', '3MVG9iLRabl2Tf4jAj.Jxqnox9vVOPRBSxHPfu2X8fRzKZcSLiUWH_7hXvtXjYMujePhVjcDyCAWrZdrBIa8u', '$2a$12$GRRasBdSXnXXUdk/SVPby.1/c6mVf8pvJs9QqkJJCxWtaSPO.dTDK', NULL, NULL, NULL, 'CTEL', NULL, NULL);
INSERT INTO "public"."gw_sessions" VALUES ('c2ae4322-0b5f-11ea-8d8a-0242ac110004', '3MVG9iLRabl2Tf4gr86vkEZj9L.vd8vrhn9RTM7tOPHd3lXveYSfYdGzKWJLIHkdLtDH2R0for3lfLZLgC9iu', '$2a$11$oHoy1JqoHeqcNp6pWKISDeosiA78ysGbKvyRyPHcZgH2czBzy2KNa', NULL, NULL, NULL, 'MyVNPost', 'http://localhost:9001/v46.0/test/myvnpost', NULL);
INSERT INTO "public"."gw_sessions" VALUES ('5f18c33a-0b5c-11ea-8d8a-0242ac110004', '3MVG9iLRabl2Tf4gr86vkEZj9L.vd8vrhn9RTvtcAHflORSOPe572UA1Xr9wokTzsJyvx5fTZBLXZ1N88zQ1.', '$2a$11$odF8p0xbHVhf6AbYhx88y.0SkAUWtAsPAKbGizWRp2PsXTsn8gzRe', '1577186826417', '1577179626477', '00D1y0000008ay3!AQsAQCoilvW21e6fGyL2F1NJdY1h5C7keqEA3.TYbfpXWKJxqwiybGCqHcNM3N7ViMHdHYMOLXenvK3N13Yzr4PQHiYMAqeh', 'Bccp', NULL, NULL);
INSERT INTO "public"."gw_sessions" VALUES ('cd5ec4e0-0b5f-11ea-8d8a-0242ac110004', '3MVG9iLRabl2Tf4gr86vkEZj9L.vd8vrhn9RTpDYxgd511CnWuqph91a9Z1hSeHKmrAO8A0GG1gQY5mPChIQV', '$2a$11$1SeK8HiaN/5LTAX0kR.J/u1h2/Qx8GOTy.rEUnKceMj1xgQoqlXae', '1577329724281', '1577322524323', '00D1y0000008ay3!AQsAQJyTae44QefektA3w.QG_Iv_ndgIRtbuiX5nI_.oVI7Wlrfj9t7J2benzHC_avMmgb0wONmIQ9vzXZrh7hJ6reQglNId', 'MPITS', 'http://14.160.87.1:8090/GatewayAPI/MPITS_CRM/webhook/v1', '{"type": "basic", "password": "mpit$2o19", "username": "mpits2019"}');

-- ----------------------------
-- Table structure for gw_trackings
-- ----------------------------
DROP TABLE IF EXISTS "public"."gw_trackings";
CREATE TABLE "public"."gw_trackings" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "status" int2 DEFAULT 0,
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "updated_at" varchar(32) COLLATE "pg_catalog"."default",
  "merchant" varchar(50) COLLATE "pg_catalog"."default",
  "sf_error" text COLLATE "pg_catalog"."default",
  "value" jsonb,
  "object" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "operation" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "sf_job_id" varchar(50) COLLATE "pg_catalog"."default",
  "uuid__c" uuid NOT NULL,
  "sf_id" varchar(50) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."gw_trackings"."id" IS 'Mã Id';
COMMENT ON COLUMN "public"."gw_trackings"."status" IS 'Trạng thái: 1: oke, 0: fail (job), 2: fail (job CRM)';
COMMENT ON COLUMN "public"."gw_trackings"."merchant" IS 'Mã merchant: MPITS, MYVNPOST ...';
COMMENT ON COLUMN "public"."gw_trackings"."sf_error" IS 'Lỗi trả về từ SF';
COMMENT ON COLUMN "public"."gw_trackings"."value" IS 'Data từ Merchant gửi lên';
COMMENT ON COLUMN "public"."gw_trackings"."object" IS 'Tên object';
COMMENT ON COLUMN "public"."gw_trackings"."operation" IS 'Các loại: insert, update, upsert, delete';
COMMENT ON COLUMN "public"."gw_trackings"."sf_job_id" IS 'Mã Sf Job Id';
COMMENT ON COLUMN "public"."gw_trackings"."uuid__c" IS 'Mã UUID Gw Id cha';
COMMENT ON COLUMN "public"."gw_trackings"."sf_id" IS 'Mã SF ID';

-- ----------------------------
-- Records of gw_trackings
-- ----------------------------
INSERT INTO "public"."gw_trackings" VALUES ('cf083168-4ee0-11ea-ab53-02420a0000a5', 0, '1581653804126', NULL, 'MPITS', NULL, '{"origin": "Khác", "reason": "ho tro", "status": "", "from__c": "MPITS", "ownerid": "", "qdbt__c": "", "subject": "H Test prod 1 14/2/2020", "priority": "Cao", "accountid": "", "contactid": "", "package__c": "", "service__c": "", "description": "", "employee__c": "", "so_ho_so__c": "", "suppliedname": "", "pha_p_nh_n__c": "", "suppliedemail": "", "suppliedphone": "", "thoi_gian1__c": "", "pos_chu_tri__c": "", "currencyisocode": "", "li_do_mo_lai__c": "", "nhom_dich_vu__c": "", "package__r.name": "", "package_text__c": "HTCASE142", "co_boi_thuong__c": "", "location_type__c": "", "nhan_vien_cskh__c": "", "contact_address__c": "", "li_do_khieu_nai__c": "", "nga_y_ti_p_nh_n__c": "", "ngay_boi_thuong__c": "", "noi_dung_ho_tro__c": "", "noi_dung_tu_van__c": "", "s_quy_t_i_nh_bt__c": "", "legacy_meta_data__c": "", "pos_chu_tri__r.name": "", "ket_qua_khieu_nai__c": "", "tai_lieu_dinh_kem__c": "", "chi_tra_boi_thuong__c": "", "so_phieu_khieu_nai__c": "", "case_reference_code__c": "", "contact_commune__r.name": "", "account.ma_khach_hang__c": "", "contact_district__r.name": "", "contact_province__r.name": "", "so_tien_phai_boi_thuong__c": "", "don_vi_chi_tra_bt_cho_kh__c": "", "employee__r.employee_code__c": "", "service__r.external_service__c": "", "ket_qua_dieu_tra_cua_doi_tac__c": "", "nhan_vien_cskh__r.employee_code__c": ""}', 'case', 'insert', NULL, 'cf0787c2-4ee0-11ea-ab53-02420a0000a5', NULL);

-- ----------------------------
-- Table structure for ho_tro__c
-- ----------------------------
DROP TABLE IF EXISTS "public"."ho_tro__c";
CREATE TABLE "public"."ho_tro__c" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL,
  "f_uuid__c" uuid
)
;
COMMENT ON COLUMN "public"."ho_tro__c"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."ho_tro__c"."merchant" IS 'Mã merchant: mpits, myvnpost';
COMMENT ON COLUMN "public"."ho_tro__c"."f_uuid__c" IS 'Mã Case foreign key';

-- ----------------------------
-- Table structure for item__c
-- ----------------------------
DROP TABLE IF EXISTS "public"."item__c";
CREATE TABLE "public"."item__c" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL,
  "external_item_id__c" varchar(100) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."item__c"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."item__c"."merchant" IS 'Mã merchant: mpits, myvnpost';
COMMENT ON COLUMN "public"."item__c"."external_item_id__c" IS 'Mã Item của VNP';

-- ----------------------------
-- Table structure for lead
-- ----------------------------
DROP TABLE IF EXISTS "public"."lead";
CREATE TABLE "public"."lead" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL
)
;
COMMENT ON COLUMN "public"."lead"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."lead"."merchant" IS 'Mã merchant: mpits, myvnpost';

-- ----------------------------
-- Table structure for opportunity
-- ----------------------------
DROP TABLE IF EXISTS "public"."opportunity";
CREATE TABLE "public"."opportunity" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL
)
;
COMMENT ON COLUMN "public"."opportunity"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."opportunity"."merchant" IS 'Mã merchant: mpits, myvnpost';

-- ----------------------------
-- Table structure for package__c
-- ----------------------------
DROP TABLE IF EXISTS "public"."package__c";
CREATE TABLE "public"."package__c" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL,
  "package_number__c" varchar(100) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."package__c"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."package__c"."merchant" IS 'Mã merchant: mpits, myvnpost';
COMMENT ON COLUMN "public"."package__c"."package_number__c" IS 'Mã Package Number của VNP';

-- ----------------------------
-- Table structure for receipt__c
-- ----------------------------
DROP TABLE IF EXISTS "public"."receipt__c";
CREATE TABLE "public"."receipt__c" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL,
  "external_receipt_id__c" varchar(100) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."receipt__c"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."receipt__c"."merchant" IS 'Mã merchant: mpits, myvnpost';
COMMENT ON COLUMN "public"."receipt__c"."external_receipt_id__c" IS 'Mã External Receipt Id VNP';

-- ----------------------------
-- Table structure for salesorder__c
-- ----------------------------
DROP TABLE IF EXISTS "public"."salesorder__c";
CREATE TABLE "public"."salesorder__c" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL,
  "salesorder_number__c" varchar(255) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."salesorder__c"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."salesorder__c"."merchant" IS 'Mã merchant: mpits, myvnpost';
COMMENT ON COLUMN "public"."salesorder__c"."salesorder_number__c" IS 'Mã salesorder number VNP';

-- ----------------------------
-- Table structure for status__c
-- ----------------------------
DROP TABLE IF EXISTS "public"."status__c";
CREATE TABLE "public"."status__c" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL,
  "external_status_id__c" varchar(255) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."status__c"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."status__c"."merchant" IS 'Mã merchant: mpits, myvnpost';
COMMENT ON COLUMN "public"."status__c"."external_status_id__c" IS 'Mã Status VNP';

-- ----------------------------
-- Table structure for tien_trinh_xu_li__c
-- ----------------------------
DROP TABLE IF EXISTS "public"."tien_trinh_xu_li__c";
CREATE TABLE "public"."tien_trinh_xu_li__c" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL
)
;
COMMENT ON COLUMN "public"."tien_trinh_xu_li__c"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."tien_trinh_xu_li__c"."merchant" IS 'Mã merchant: mpits, myvnpost';

-- ----------------------------
-- Table structure for vi_pham__c
-- ----------------------------
DROP TABLE IF EXISTS "public"."vi_pham__c";
CREATE TABLE "public"."vi_pham__c" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "created_at" varchar(32) COLLATE "pg_catalog"."default",
  "sf_id" varchar(100) COLLATE "pg_catalog"."default",
  "updated_at" varchar(50) COLLATE "pg_catalog"."default",
  "merchant" varchar(30) COLLATE "pg_catalog"."default" NOT NULL
)
;
COMMENT ON COLUMN "public"."vi_pham__c"."sf_id" IS 'Mã Id SF';
COMMENT ON COLUMN "public"."vi_pham__c"."merchant" IS 'Mã merchant: mpits, myvnpost';

-- ----------------------------
-- Primary Key structure for table account
-- ----------------------------
ALTER TABLE "public"."account" ADD CONSTRAINT "account_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table added_value_in_package__c
-- ----------------------------
ALTER TABLE "public"."added_value_in_package__c" ADD CONSTRAINT "added_value_in_package__c_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table batch__c
-- ----------------------------
ALTER TABLE "public"."batch__c" ADD CONSTRAINT "batch__c_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table case
-- ----------------------------
ALTER TABLE "public"."case" ADD CONSTRAINT "case_pkey1" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table contact
-- ----------------------------
ALTER TABLE "public"."contact" ADD CONSTRAINT "contact_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table gw_call_logs
-- ----------------------------
ALTER TABLE "public"."gw_call_logs" ADD CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table gw_case_mpit
-- ----------------------------
ALTER TABLE "public"."gw_case_mpit" ADD CONSTRAINT "case_mpit_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table gw_jobs
-- ----------------------------
ALTER TABLE "public"."gw_jobs" ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table gw_logs
-- ----------------------------
ALTER TABLE "public"."gw_logs" ADD CONSTRAINT "gw_logs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table gw_memories
-- ----------------------------
ALTER TABLE "public"."gw_memories" ADD CONSTRAINT "memories_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table gw_sessions
-- ----------------------------
ALTER TABLE "public"."gw_sessions" ADD CONSTRAINT "sessions_copy1_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table gw_trackings
-- ----------------------------
ALTER TABLE "public"."gw_trackings" ADD CONSTRAINT "gw_trackings_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table ho_tro__c
-- ----------------------------
ALTER TABLE "public"."ho_tro__c" ADD CONSTRAINT "ho_tro__c_pkey1" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table item__c
-- ----------------------------
ALTER TABLE "public"."item__c" ADD CONSTRAINT "item__c_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table lead
-- ----------------------------
ALTER TABLE "public"."lead" ADD CONSTRAINT "lead_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table opportunity
-- ----------------------------
ALTER TABLE "public"."opportunity" ADD CONSTRAINT "opportunity_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table package__c
-- ----------------------------
ALTER TABLE "public"."package__c" ADD CONSTRAINT "package__c_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table receipt__c
-- ----------------------------
ALTER TABLE "public"."receipt__c" ADD CONSTRAINT "receipt__c_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table salesorder__c
-- ----------------------------
ALTER TABLE "public"."salesorder__c" ADD CONSTRAINT "salesorder__c_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table status__c
-- ----------------------------
ALTER TABLE "public"."status__c" ADD CONSTRAINT "status__c_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table tien_trinh_xu_li__c
-- ----------------------------
ALTER TABLE "public"."tien_trinh_xu_li__c" ADD CONSTRAINT "tien_trinh_xu_li__c_pkey1" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table vi_pham__c
-- ----------------------------
ALTER TABLE "public"."vi_pham__c" ADD CONSTRAINT "vi_pham__c_pkey1" PRIMARY KEY ("id");
