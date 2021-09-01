const fields = {
    receipt__c: {
        // so_hieu_gd: "SalesOrderNumber__c",
        // hinh_thuc_thu_cuoc: "ChargesMethod__c",
        chung_tu_goc: "OriginalDoc__c",
        // ma_kh_nguoi_nhan: "ReceiverAccountID__c",
        // loai_sp: "Product_Category__c",
        // loai_bao_hiem: "Product__c",
        // phi_bao_hiem: "Insurance_Charges__c",
        ngay_ban: "SalesDate__c",
        ngay_hieu_luc: "EffectiveDate__c",
        ngay_het_han: "ExpiryDate__c",
        hoa_hong: "Bonus__c",
        phi_quan_ly: "OperationFee__c",
        ten_nguoi_ban: "SalesName__c",
        sdt_nguoi_ban: "SalesPhone__c",
        tien_co_che_ban_hang: "SalesMechanismAmount__c"
    },
    account_sent: 
    {
        ma_kh_gui: "Ma_khach_hang__c",
        ten_kh: "FirstName",
        // dia_chi: "Address",
        email: "PersonEmail",
        sdt: "Phone",
        so_tk: "BankAccountNumber__c",
        ngan_hang: "BankName__c",
        loai_gt: "IdentityType__c",
        // so_gt: "PersonalIDNumber__c",
        ngay_cap: "IdentityIssueDate__c",
        noi_cap: "IdentityIssuePlace__c",
        ma_so_thue: "TaxCode__c"
    },
    account_rc: 
    {
        ma_kh_nguoi_nhan: "Ma_khach_hang__c",
        ten_kh_nguoi_nhan: "FirstName",
        loai_gt: "IdentityType__c",
        // sgttt: "PersonalIDNumber__c",
        ngay_cap: "IdentityIssueDate__c",
        noi_cap: "IdentityIssuePlace__c",
        // dia_chi: "Address",
        ma_so_thue: "TaxCode__c",
        so_tk: "BankAccountNumber__c",
        ngan_hang: "BankName__c",
        email: "PersonEmail",
        sdt: "Phone"
    },
    order: {
        ma_bc: "POS__c",
        ma_user: "CreatedById",
        so_hieu_gd: "SalesOrderNumber__c",
        ngay_gd: "EffectiveDate",
        ma_nv: "EmployeeCode__c",
        // so_tham_chieu: "ReferNumber__c",
        so_tien: "PurchasedAmount__c",
        thue_suat: "TaxPercentage__c",
        // cuoc_chuyen_phat: "DeliveryCharges__c",
        // vat_cuoc_chuyen_phat: "DeliveryChargesVAT__c",
        // cuoc_thu_ho: "CODCharges__c",
        // vat_cuoc_thu_ho: "CODChargesVAT__c",
        // cuoc_dvct: "AVSCharges__c",
        // VAT_DVCT: "AVSChargesVAT__c",
        so_tien_chiet_khau: "DiscountAmount__c",
        vat_so_tien_chiet_khau: "DiscountVAT__c",
        tong_cuoc_truoc_vat: "TotalWithoutVAT__c",
        cuoc_vat: "TotalVAT__c",
        tong_cuoc: "TotalAmount",
        trang_thai_gd: "Status",
        hinh_thc_tt_cuoc: "PaymentMethod__c",
        // loai_thanh_toan: "PaymentType__c",
        // ngay_tao: "CreatedDate",
        // ngay_cap_nhat_gd: "ActivatedDate"
    }
}

const externalIds = {
    order: 'SalesOrderNumber__c',
    account: 'Ma_khach_hang__c',
    receipt__c: 'External_Item_Id__c'
}

module.exports = {
    fields,
    externalIds
}