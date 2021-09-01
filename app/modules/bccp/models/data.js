const sql = require('sql');

const order = sql.define({
  name: 'order',
  schema: process.env.BCCP_PG_SCHEMA || 'bccp',
  columns: [
    'id',
    'status',
    'merchant',
    'value',
    'object',
    'operation',
    'job_id',
    'uuid__c',
    'created_at'
  ]
});

const batch__c = sql.define({
    name: 'batch__c',
    schema: process.env.BCCP_PG_SCHEMA || 'bccp',
    columns: [
      'id',
      'status',
      'merchant',
      'value',
      'object',
      'operation',
      'job_id',
      'uuid__c',
      'created_at'
    ]
});

const package__c = sql.define({
    name: 'package__c',
    schema: process.env.BCCP_PG_SCHEMA || 'bccp',
    columns: [
      'id',
      'status',
      'merchant',
      'value',
      'object',
      'operation',
      'job_id',
      'uuid__c',
      'created_at'
    ]
});

const item__c = sql.define({
    name: 'item__c',
    schema: process.env.BCCP_PG_SCHEMA || 'bccp',
    columns: [
      'id',
      'status',
      'merchant',
      'value',
      'object',
      'operation',
      'job_id',
      'uuid__c',
      'created_at'
    ]
});

const receipt__c = sql.define({
    name: 'receipt__c',
    schema: process.env.BCCP_PG_SCHEMA || 'bccp',
    columns: [
      'id',
      'status',
      'merchant',
      'value',
      'object',
      'operation',
      'job_id',
      'uuid__c',
      'created_at'
    ]
});

const added_value_in_package__c = sql.define({
    name: 'added_value_in_package__c',
    schema: process.env.BCCP_PG_SCHEMA || 'bccp',
    columns: [
      'id',
      'status',
      'merchant',
      'value',
      'object',
      'operation',
      'job_id',
      'uuid__c',
      'created_at'
    ]
});

module.exports = {
    order,
    batch__c,
    package__c,
    item__c,
    receipt__c,
    added_value_in_package__c
}
