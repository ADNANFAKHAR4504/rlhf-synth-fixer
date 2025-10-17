# Model Failures

## 1. Syntax Issues

### 1.1 Incorrect Use of Global Secondary Index (GSI)
- **Issue**: In `MODEL_RESPONSE.md`, the `GlobalSecondaryIndex` is incorrectly defined as a standalone construct, which is not supported in CDK.
  - **Fix in IDEAL_RESPONSE.md**: Used `add_global_secondary_index` method on the DynamoDB table to define the GSI.

### 1.2 Hardcoded Resource Names
- **Issue**: Resource names in `MODEL_RESPONSE.md` are hardcoded (e.g., `image-metadata` for DynamoDB table).
  - **Fix in IDEAL_RESPONSE.md**: Resource names are dynamically generated using `environment_suffix` to support multiple environments (e.g., `image-metadata-{environment_suffix}`).

### 1.3 Missing Tags
- **Issue**: `MODEL_RESPONSE.md` does not include resource tags for traceability.
  - **Fix in IDEAL_RESPONSE.md**: Added tags for `Environment`, `Project`, and `ManagedBy` to all resources.

---

## 2. Deployment Issues

### 2.1 Lack of Environment-Specific Configuration
- **Issue**: `MODEL_RESPONSE.md` does not differentiate between production and development environments.
  - **Fix in IDEAL_RESPONSE.md**: Added environment-specific configurations for `RemovalPolicy`, resource names, and logging levels.

### 2.2 Missing Outputs
- **Issue**: `MODEL_RESPONSE.md` does not include CloudFormation outputs for key resources like the API Gateway endpoint, DynamoDB table name, and S3 bucket name.
  - **Fix in IDEAL_RESPONSE.md**: Added outputs for all critical resources to simplify integration and debugging.

### 2.3 Log Group Management
- **Issue**: `MODEL_RESPONSE.md` does not specify log retention for Lambda functions, which can lead to unnecessary storage costs.
  - **Fix in IDEAL_RESPONSE.md**: Added `log_retention=logs.RetentionDays.ONE_WEEK` to manage log retention.

---

## 3. Security Issues

### 3.1 Overly Permissive IAM Roles
- **Issue**: In `MODEL_RESPONSE.md`, IAM roles grant broad permissions to Lambda functions, such as full access to DynamoDB and S3.
  - **Fix in IDEAL_RESPONSE.md**: Implemented least privilege by granting specific permissions (e.g., `dynamodb:GetItem`, `s3:GetObject`) to each Lambda function.

### 3.2 Public Access to API Gateway
- **Issue**: The API Gateway in `MODEL_RESPONSE.md` allows unrestricted access.
  - **Fix in IDEAL_RESPONSE.md**: Added CORS configuration to restrict access to specific methods (`GET` and `OPTIONS`).

### 3.3 Lack of Encryption
- **Issue**: The S3 bucket in `MODEL_RESPONSE.md` does not enforce encryption.
  - **Fix in IDEAL_RESPONSE.md**: Enabled `S3_MANAGED` encryption for the S3 bucket.

---

## 4. Observability and Debugging

### 4.1 Lack of Structured Logging
- **Issue**: The Lambda functions in `MODEL_RESPONSE.md` do not include structured logging.
  - **Fix in IDEAL_RESPONSE.md**: Added structured logging with log levels and request tracing.

---

## 5. Maintainability

### 5.1 Hardcoded Values
- **Issue**: The `MODEL_RESPONSE.md` hardcodes values like region and account ID.
  - **Fix in IDEAL_RESPONSE.md**: Used CDK context and environment variables to make the stack reusable across environments.

---

## Summary of Fixes

| Category            | Issue                                                                 | Fix                                                                 |
|---------------------|-----------------------------------------------------------------------|--------------------------------------------------------------------|
| **Syntax**          | Hardcoded resource names                                             | Used dynamic naming with `environment_suffix`                    |
|                     | Missing tags                                                        | Added consistent tagging                                          |
| **Deployment**      | Lack of environment-specific configuration                           | Added conditional `RemovalPolicy` and logging levels             |
|                     | Missing CloudFormation outputs                                       | Added outputs for key resources                                  |
|                     | Log group retention not specified                                    | Added `log_retention` for Lambda logs                            |
| **Security**        | Overly permissive IAM roles                                          | Implemented least privilege                                      |
|                     | Public access to API Gateway                                        | Restricted access with CORS                                      |
|                     | Lack of encryption for S3 bucket                                    | Enabled `S3_MANAGED` encryption                                  |
| **Observability**   | Lack of structured logging                                          | Added structured logging                                         |
| **Maintainability** | Hardcoded values                                                   | Used CDK context and environment variables                      |
