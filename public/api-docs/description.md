# Introduction
This is VNPOST GATEWAY API
<p>Link tài liệu chi tiết: <a href="https://docs.google.com/document/d/1T4GZhS7plFMlBFG5L0YW4h2IqDpxe3jUal1rYbmrtSw" target="_blank">click here</a>.</p>

# Authentication
Use Salesforce client_id/client_secret login.
<!-- ReDoc-Inject: <security-definitions> -->
# Status code
| Code | Description |
| ---- | ----------- |
| 200 | Success |
| 201 | Success |
| 204 | Success |
| 401 |  Unauthorized   |
| 400 |  Bad request   |
| 403 | Forbidden |
| 404 |  Not found   |
| 500 |  Server error   |
| 502 |  Database Error   |
| 503 | Unavailable |

# Getting Started Guide

<p>Link tài liệu SOQL: <a href="http://183.91.11.56:9001/api-docs/salesforce_soql_sosl.pdf" target="_blank">click here</a>.</p>

## Query q:

Query with LIKE AND Equal

```
Name LIKE 'A%' AND MailingState='California'
```

Query with >, <

```
CreatedDate > 2011-04-26T10:00:00-08:00
```

Using null

```
ActivityDate != null
```

```
Contact.LastName = null
```

Filtering on Boolean Fields

```
BooleanField = TRUE
```

Query with And Or

```
fieldExpression1 AND (fieldExpression2 OR fieldExpression3)
```

```
(fieldExpression1 AND fieldExpression2) OR fieldExpression3
```

Query with multi-select picklists

```
MSP1__c = 'AAA;BBB'
```

```
MSP1__c includes ('AAA;BBB','CCC')
```
