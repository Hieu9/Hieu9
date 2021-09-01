const sql = require('sql');

const data = sql.define({
    name: 'data',
    schema: 'paypost',
    columns: [
        'id',
        'ma_bc',
        'ma_user',
        'so_hieu_gd',
        'ngay_gd',
        'ma_nv',
        'loai_gd_phat_tra',
        'ma_kh_gui',
        'ten_kh',
        'dia_chi',
        'email',
        'sdt',
        'so_tk',
        'ngan_hang',
        'so_gt',
        'noi_cap',
        'so_tham_chieu',
        'so_tien',
        'thue_suat',
        'cuoc_chuyen_phat',
        'vat_cuoc_chuyen_phat',
        'cuoc_thu_ho',
        'vat_cuoc_thu_ho',
        'cuoc_dvct',
        'vat_dvct',
        'so_tien_chiet_khau',
        'vat_so_tien_chiet_khau',
        'tong_cuoc_truoc_vat',
        'cuoc_vat',
        'tong_cuoc',
        'loai_gt',
        'ngay_cap',
        'trang_thai_gd',
        'hinh_thc_tt_cuoc',
        'loai_thanh_toan',
        'hinh_thuc_thu_cuoc',
        'chung_tu_goc',
        'ngay_tao',
        'ngay_cap_nhat_gd',
        'ma_kh_nguoi_nhan',
        'ten_kh_nguoi_nhan',
        'sgttt',
        'ma_so_thue',
        'loai_sp',
        'loai_bao_hiem',
        'phi_bao_hiem',
        'ngay_ban',
        'ngay_hieu_luc',
        'ngay_het_han',
        'hoa_hong',
        'phi_quan_ly',
        'ten_nguoi_ban',
        'sdt_nguoi_ban',
        'tien_co_che_ban_hang'
    ]
});

const order = sql.define({
    name: 'order',
    schema: 'paypost',
    columns: [
      'id',
      'status',
      'merchant',
      'value',
      'object',
      'operation',
      'job_id',
      'uuid__c',
      'created_at',
      'data_id'
    ]
});

const account = sql.define({
    name: 'account',
    schema: 'paypost',
    columns: [
      'id',
      'status',
      'merchant',
      'value',
      'object',
      'operation',
      'job_id',
      'uuid__c',
      'created_at',
      'data_id'
    ]
});

const receipt__c = sql.define({
    name: 'receipt__c',
    schema: 'paypost',
    columns: [
      'id',
      'status',
      'merchant',
      'value',
      'object',
      'operation',
      'job_id',
      'uuid__c',
      'created_at',
      'data_id'
    ]
});

module.exports = {
    data,
    order,
    account,
    receipt__c
}
