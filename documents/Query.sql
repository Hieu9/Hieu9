SELECT id, status, created_at, updated_at, merchant, sf_error, value, "object", operation, sf_job_id, uuid__c, sf_id, "number"
FROM public.gw_trackings where merchant = 'MPITS' limit 2;

select * from public.gw_trackings where uuid__c = '25f7cd0f-64be-4fa7-8cc0-e2734e4ffd27';

select * from public.gw_trackings where value ->> 'package_text__c' = 'CU758240437VN' limit 10;

select * from public.gw_trackings where uuid__c = 'a910f842-e5ac-11ea-8d97-02420a000a67';

select * from public.gw_case_mpit gcm where casenumber = '00597705';

select * from public.gw_case_mpit order by created_at desc limit 10;

select count(*) from public.gw_trackings;

select to_char(to_timestamp(created_at::numeric/1000) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD-HH24:MI:SS') as created_at_fm, * 
from public.gw_trackings 
where merchant = 'CTEL' and to_char(to_timestamp(created_at::numeric/1000) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD-HH24:MI:SS') >= '2020-09-04-00:00:00'
order by created_at DESC limit 100;

select count(*) from public.gw_trackings where merchant = 'MPITS' and status = 2 and to_char(to_timestamp(created_at::numeric/1000) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD-HH24:MI:SS') >= '2020-08-26-00:00:00';

SELECT id, status, created_at, updated_at, merchant, sf_error, value, "object", operation, sf_job_id, uuid__c, sf_id, "number"
FROM public.gw_trackings where id = '8ef05144-e69f-11ea-a933-0242ac110003';

SELECT DISTINCT ON (uuid__c) uuid__c,to_char(to_timestamp(created_at::numeric/1000) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD-HH24:MI:SS') as created_at_fm,* FROM public.gw_trackings 
WHERE merchant = 'MPITS'
ORDER BY uuid__c, created_at DESC LIMIT 30;

UPDATE public.gw_trackings    
SET status = 0,   
sf_error = null,   
sf_job_id = null    
WHERE status = 2 and to_char(to_timestamp(created_at::numeric/1000) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD-HH24:MI:SS') >= '2020-08-26-00:00:00';

select count(*) from public.gw_trackings
where status = 2 and merchant = 'CTEL' and to_char(to_timestamp(created_at::numeric/1000) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD-HH24:MI:SS') >= '2020-09-18-00:00:00';


