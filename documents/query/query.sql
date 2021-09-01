SELECT to_char(to_timestamp(created_at::numeric/1000) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD-HH24:MI:SS') as created_at_fm, id, sf_id, sf_job_id, sf_error, "value"
FROM gw_trackings
WHERE value ->> 'package_text__c' = 'CQ988554580VN'
ORDER BY gw_trackings.created_at DESC;