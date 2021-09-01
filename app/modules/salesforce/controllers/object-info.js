const baseRepository = require('../../../services/repository'),
	response = require('../../../libs/response'),
	statusCode = require('../../../consts/statusCode'),
    libsFile = require('../../../libs/file'),
    consts = require('../../../consts');
// detail
exports.list = async (req, res, next) => {
    let objectApiName = req.params.objectApiName;

    let url = `${req.user.instance_url}/services/data/v46.0/ui-api/object-info/${objectApiName}`;

    let obj = await baseRepository.findFirst(url, req);

    if(obj.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, obj.body, obj.statusCode);

    return response.success(req, res, obj.body, obj.statusCode);
}
// detail
exports.picklistValuesList = async (req, res, next) => {
    let objectApiName = req.params.objectApiName;
    let recordTypeId = req.params.recordTypeId;

    let url = `${req.user.instance_url}/services/data/v46.0/ui-api/object-info/${objectApiName}/picklist-values/${recordTypeId}`;

    let obj = await baseRepository.findFirst(url, req);

    if(obj.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, obj.body, obj.statusCode);

    return response.success(req, res, obj.body, obj.statusCode);
}
// detail
exports.picklistValuesDetail = async (req, res, next) => {
    let objectApiName = req.params.objectApiName;
    let recordTypeId = req.params.recordTypeId;
    let fieldApiName = req.params.fieldApiName;

    let url = `${req.user.instance_url}/services/data/v46.0/ui-api/object-info/${objectApiName}/picklist-values/${recordTypeId}/${fieldApiName}`;

    let obj = await baseRepository.findFirst(url, req);

    if(obj.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, obj.body, obj.statusCode);

    return response.success(req, res, obj.body, obj.statusCode);
}

exports.readObject = async (req, res, next) => {
    let object = req.params.object;
    let url = `${req.user.instance_url}/services/data/v46.0/sobjects/${object}/describe`;
    let obj = await baseRepository.findFirst(url, req);
    if(obj.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, obj.body, obj.statusCode);
    return response.success(req, res, obj.body,  obj.statusCode);
}

exports.writeObject = async (req, res, next) => {
    //,'RecordType,Group' not found
    let defaultObj = ['Account','Added_Value_in_Package__c','Added_Value_Service__c','Batch__c','Case','Contact','Contract','Commune__c','District__c',
        'Employee__c','EmailMessage','Entitlement','Ho_tro__c','Lead','Opportunity','POS__c','Product2','Status__c','Task','Tien_trinh_xu_li__c','User',
        'Vi_pham__c','Province__c','LiveChatTranscript','SocialPost','BusinessHours','RecordType','Group','Quote','Unit__c',
        'Ma_buu_chinh__c','SalesOrder__c','Item__c','Package__c','Receipt__c','Pricebook2','Refered_Status__c'
    ];
    let arrObj = req.query.objects?req.query.objects.split(","):defaultObj;
    let data = [];
    for(let i = 0; i < arrObj.length; i ++){
        let url = `${req.user.instance_url}/services/data/v46.0/sobjects/${arrObj[i]}/describe`;
        let obj = await baseRepository.findFirst(url, req);
        if(obj.statusCode != statusCode.SUCCESS)
            return response.fail(req, res, obj.body, obj.statusCode);
        let item = obj.body;
        await libsFile.writeFile(item, 'caches', `${arrObj[i].toLowerCase()}.json`);
    }
    return response.success(req, res, {}, 200);
}