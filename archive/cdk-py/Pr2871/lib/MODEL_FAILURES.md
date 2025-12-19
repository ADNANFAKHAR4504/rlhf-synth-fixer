# Model Failures

## 1. Syntax Issues

### 1.1 Incorrect Method Usage
- **Issue**: `AccessLogFormat.json_with_context_request_override_response_header` is used for API Gateway logging, but this method does not exist in the AWS CDK library.
- **Fix**: Replaced with `AccessLogFormat.clf()` for a valid and simpler log format.

### 1.2 Invalid Parameter in SNS Topic
- **Issue**: `kms_master_key` is used for the SNS topic, which is deprecated.
- **Fix**: Updated to use `master_key`.

### 1.3 Inline Lambda Code Size
- **Issue**: Inline Lambda code exceeds the 4 KB limit, causing deployment failures.
- **Fix**: Lambda code is stored in separate files and deployed using `from_asset()`.

---

## 2. Deployment-Time Issues

### 2.1 Resource Creation Order
- **Issue**: `_setup_error_handling()` is called before Lambda functions are created, leading to an `AttributeError`.
- **Fix**: Adjusted the resource creation order to ensure `self.lambda_functions` is initialized before `_setup_error_handling()`.

### 2.2 S3 Bucket Name Collision
- **Issue**: Static bucket name (`lambda-code-bucket-{self.account}-{self.region}`) can cause name collisions in global S3 namespaces.
- **Fix**: Removed the static bucket name and allowed CDK to generate a unique name.

### 2.3 API Gateway Account Conflict
- **Issue**: `CfnAccount` resource for API Gateway can cause conflicts in multi-stack environments.
- **Fix**: Removed the `CfnAccount` resource.

---

## 3. Security Issues

### 3.1 IAM Role Permissions
- **Issue**: Missing `AWSLambdaBasicExecutionRole` managed policy for Lambda roles.
- **Fix**: Added the `AWSLambdaBasicExecutionRole` managed policy.

### 3.2 Parameter Store Access
- **Issue**: Overly broad access to Parameter Store (`parameter/serverless/*`).
- **Fix**: Scoped the permissions to specific parameters.

### 3.3 KMS Key Permissions
- **Issue**: Missing `kms:DescribeKey` permission in Lambda roles.
- **Fix**: Added `kms:DescribeKey` to the Lambda role.

---

## 4. Performance Issues

### 4.1 VPC Subnet Configuration
- **Issue**: `PRIVATE_WITH_EGRESS` may cause compatibility issues with older CDK versions.
- **Fix**: Ensured compatibility by explicitly specifying CDK v2 in the `requirements.txt`.

---

## 5. Logging and Monitoring

### 5.1 CloudWatch Logs for API Gateway
- **Issue**: Invalid log format for API Gateway prevents logs from being generated.
- **Fix**: Used `AccessLogFormat.clf()` for a valid log format.

### 5.2 Dead Letter Queue (DLQ)
- **Issue**: DLQ is not properly attached to Lambda functions.
- **Fix**: Properly attached the DLQ to Lambda functions using `dead_letter_queue` and `dead_letter_queue_enabled`.

---
