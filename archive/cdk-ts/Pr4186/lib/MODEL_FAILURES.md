# Model Failures and Corrections

This document details the issues encountered during the initial implementation and the corrections made to achieve a production-ready solution.

## 1. Lambda Reserved Concurrency Issue

### Failure
During initial deployment, the stack failed with the following error:
```
Resource handler returned message: "Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [10]."
```

### Root Cause
The Lambda function was configured with `reservedConcurrentExecutions: 10`, which attempted to reserve all available concurrent executions in the AWS account, leaving less than the required minimum of 10 unreserved executions.

### Correction
Removed the `reservedConcurrentExecutions` parameter from the Lambda function configuration in `lib/tap-stack.ts:151`. The function now uses the default unreserved concurrency pool, which is appropriate for this use case.

**File:** `lib/tap-stack.ts`
**Line:** 151 (removed)

---

## 2. Lambda Runtime Compatibility - AWS SDK Missing

### Failure
After deployment, the Lambda function failed with:
```
Runtime.ImportModuleError: Error: Cannot find module 'aws-sdk'
```

### Root Cause
The Lambda function code used `require('aws-sdk')` which is not available by default in Node.js 18.x runtime. AWS SDK v2 (`aws-sdk`) is only automatically available in Node.js runtimes up to 16.x.

### Initial Implementation (Incorrect)
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
```

### Correction
Removed the dependency on AWS SDK entirely. The S3 event notification already contains all necessary object metadata. The Lambda function now extracts and logs information directly from the event object.

**File:** `lib/lambda/prod-object-logger/index.js`

---

## 3. S3 Event Notification Filter Issue

### Failure
During CDK synthesis, received error about empty filter object.

### Correction
Removed the empty filter object from S3 event notification configuration.

**File:** `lib/tap-stack.ts`
**Lines:** 157-161

---

## 4. Hardcoded Resource Names

### Failure
Initial implementation used hardcoded resource names without environment suffix.

### Correction
Updated all resource names to include `environmentSuffix`:
```typescript
bucketName: `prod-data-bucket-${environmentSuffix}`
functionName: `prod-object-logger-${environmentSuffix}`
roleName: `prod-data-bucket-readonly-role-${environmentSuffix}`
```

**File:** `lib/tap-stack.ts`

---
