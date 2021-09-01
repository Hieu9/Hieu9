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

 Date: 03/12/2019 08:43:52
*/


-- ----------------------------
-- Table structure for sessions
-- ----------------------------
DROP TABLE IF EXISTS "prod"."sessions";
CREATE TABLE "prod"."sessions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v1(),
  "consumer_key" varchar(255) COLLATE "pg_catalog"."default",
  "consumer_secret" varchar(255) COLLATE "pg_catalog"."default",
  "expired_at" varchar(50) COLLATE "pg_catalog"."default",
  "created_at" varchar(255) COLLATE "pg_catalog"."default",
  "access_token" varchar(500) COLLATE "pg_catalog"."default",
  "name" varchar(255) COLLATE "pg_catalog"."default",
  "url" text COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "prod"."sessions"."consumer_key" IS 'Client Key Contected App SF';
COMMENT ON COLUMN "prod"."sessions"."consumer_secret" IS 'Secret Key Contected App SF';
COMMENT ON COLUMN "prod"."sessions"."expired_at" IS 'Thời gian expired đã đc + so với thời gian tạo';
COMMENT ON COLUMN "prod"."sessions"."created_at" IS 'Thời điểm update và tạo bản ghi';
COMMENT ON COLUMN "prod"."sessions"."access_token" IS 'Token của SF';
COMMENT ON COLUMN "prod"."sessions"."name" IS 'Tên APP';
COMMENT ON COLUMN "prod"."sessions"."url" IS 'Url webhook: https://1, https://2';

-- ----------------------------
-- Records of sessions
-- ----------------------------
INSERT INTO "prod"."sessions" VALUES ('5f18c33a-0b5c-11ea-8d8a-0242ac110004', '3MVG9G9pzCUSkzZvLnOoNdZiIwmB2taZffqidNuqmrKkgx8ZhynN8NdMpxinDCKkjNFPklZXtSsqULWrci0r8', '9D38F2D84EF385085062CD6F0153E0DE5325DA7BAD75CBC011CF8304664FE5A0', NULL, NULL, NULL, 'Bccp', NULL);
INSERT INTO "prod"."sessions" VALUES ('b02014ec-0b5f-11ea-8d8a-0242ac110004', '3MVG9G9pzCUSkzZvLnOoNdZiIwuR9H9p.MaKQig0l59PXatjrlT4ASceYmsVZjsnZQYmtIKz3WKCl1vV3XUvL', '9CEB2BA3E78E5A8E1FCCD17EAEF0BE687C9D1A1A1A8328686622FACE5E1D369F', NULL, NULL, NULL, 'PackAndSend', NULL);
INSERT INTO "prod"."sessions" VALUES ('cd5ec4e0-0b5f-11ea-8d8a-0242ac110004', '3MVG9G9pzCUSkzZvLnOoNdZiIwnqjLZn5AMkFnSdpLOh0DH396VPmI6QUYBaSC9Mgzos7HvYiZwNuKNf_GmQE', 'B5D1FF9D6A72A895C299541C500339B311EE2BD2824567169C579489FA6F5552', NULL, NULL, NULL, 'mPit', NULL);
INSERT INTO "prod"."sessions" VALUES ('d8b1f6be-0b5f-11ea-8d8a-0242ac110004', '3MVG9G9pzCUSkzZvLnOoNdZiIwnqjLZn5AMkFNbI2ijRmLTFU_QabjACEkDavd3gLsj_AP7b9yye5nsvNwpqD', '0CE61DE17341A7D9E96E939D227DAB4A5F52A18CE4BCB3AD6E9A2EDBFE133924', NULL, NULL, NULL, 'SalePortal', NULL);
INSERT INTO "prod"."sessions" VALUES ('c2ae4322-0b5f-11ea-8d8a-0242ac110004', '3MVG9G9pzCUSkzZvLnOoNdZiIwhsxI.dOoIW4CblK__J8M9QxAf8lWHKZZOHi5WfPgC5Ni228fK3Oln2.9e_q', '7D6A9B53FFFF90DD73BD94C1F8DB0D8601690E42FDCF404157134A10A81E8D5A', NULL, NULL, NULL, 'MyVNPost', 'http://localhost:9001/v46.0/test/myvnpost');
INSERT INTO "prod"."sessions" VALUES ('3568a260-0b63-11ea-8d8a-0242ac110004', '3MVG9iLRabl2Tf4gr86vkEZj9L.vd8vrhn9RTezhzKRTl9MBN241HKK2THi_us3O5d9FNQXwVotI1Zg1lRuFp', 'B63176167C95106AAB70F2A7A4711B4C4DD29A8106E738AA429BD7437D788F8D', '1575331617023', '1575324416689', '00D1y0000008ay3!AQsAQL1sq.puZZFm0TiD2Ua8vAZ_n1S9yoTtbUdh6f5bdQ0UhX.Xa_nf3tTS7f5WXy6.BvVq3RPmTucnCo_8V7HRkcN0lv.Y', 'GateWay', NULL);

-- ----------------------------
-- Primary Key structure for table sessions
-- ----------------------------
ALTER TABLE "prod"."sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");
