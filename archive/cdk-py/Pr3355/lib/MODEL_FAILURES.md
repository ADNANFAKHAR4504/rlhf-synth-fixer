# Model Failures

## 1. Syntax Issues

### a. **Unsupported Lambda Runtime**
- **Issue**: The `MODEL_RESPONSE.md` used `python3.11` as the Lambda runtime, which is not supported by AWS Lambda at the time of writing.
- **Fix**: Updated to `python3.9` in `IDEAL_RESPONSE.md`.

### b. **Deprecated DynamoDB Property**
- **Issue**: The `point_in_time_recovery` property in DynamoDB was used, which is deprecated.
- **Fix**: Replaced with `point_in_time_recovery_specification` in `IDEAL_RESPONSE.md`.

### c. **Hardcoded Region**
- **Issue**: The region `us-east-1` was hardcoded in multiple places, including Lambda environment variables and stack outputs.
- **Fix**: Made the region dynamic using `self.region` in `IDEAL_RESPONSE.md`.

### d. **Incorrect API Gateway Metrics**
- **Issue**: The `metric_4xx()` and `metric_5xx()` methods were used on the `RestApi` object, which are not valid.
- **Fix**: Replaced with `metric_client_error()` and `metric_server_error()` on the `Stage` object in `IDEAL_RESPONSE.md`.

---

## 2. Deployment-Time Issues

### a. **Reserved Environment Variables**
- **Issue**: The `AWS_REGION` environment variable was manually set in the Lambda function, which is reserved by AWS Lambda and caused deployment failures.
- **Fix**: Removed the `AWS_REGION` variable and relied on the default runtime-provided environment variables.

### b. **Improper Resource Dependencies**
- **Issue**: The `MODEL_RESPONSE.md` did not explicitly define dependencies between resources, which could lead to race conditions during deployment.
- **Fix**: Dependencies were implicitly handled by referencing resource attributes in `IDEAL_RESPONSE.md`.

### c. **Missing Resource Outputs**
- **Issue**: Some outputs, such as the CloudWatch Dashboard URL, were missing in `MODEL_RESPONSE.md`.
- **Fix**: Added all necessary outputs in `IDEAL_RESPONSE.md`.

---

## 3. Security Issues

### a. **Overly Permissive IAM Role**
- **Issue**: The Lambda execution role in `MODEL_RESPONSE.md` granted overly broad permissions, including unnecessary actions.
- **Fix**: Restricted permissions to only the required DynamoDB actions (`GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan`) in `IDEAL_RESPONSE.md`.

### b. **Lack of Encryption for DynamoDB**
- **Issue**: DynamoDB encryption at rest was not explicitly enabled in `MODEL_RESPONSE.md`.
- **Fix**: Enabled `AWS_MANAGED` encryption in `IDEAL_RESPONSE.md`.

### c. **No SNS Subscription Validation**
- **Issue**: The SNS topic for alerts was created, but no subscription validation or instructions were provided.
- **Fix**: Added instructions for subscribing to the SNS topic in `IDEAL_RESPONSE.md`.

---

## 4. Performance Issues

### a. **No Throttling for API Gateway**
- **Issue**: API Gateway did not have throttling limits configured in `MODEL_RESPONSE.md`.
- **Fix**: Added throttling limits for both `dev` and `prod` stages in `IDEAL_RESPONSE.md`.

### b. **No Alarms for Performance Metrics**
- **Issue**: No CloudWatch alarms were configured for Lambda duration or concurrent executions.
- **Fix**: Added alarms for Lambda duration and concurrent executions in `IDEAL_RESPONSE.md`.

### c. **No Caching for API Gateway**
- **Issue**: API Gateway caching was not enabled, which could lead to higher latency and costs.
- **Fix**: Caching was not explicitly added in `IDEAL_RESPONSE.md` but can be considered for future improvements.

---

## 5. Best Practices Violations

### a. **No Tags for Cost Tracking**
- **Issue**: Resources were not tagged with project, environment, or owner information in `MODEL_RESPONSE.md`.
- **Fix**: Added tags for `Project`, `Environment`, `Owner`, `ManagedBy`, and `CostCenter` in `IDEAL_RESPONSE.md`.

### b. **No X-Ray Tracing**
- **Issue**: X-Ray tracing was not enabled for Lambda or API Gateway in `MODEL_RESPONSE.md`.
- **Fix**: Enabled X-Ray tracing for both Lambda and API Gateway in `IDEAL_RESPONSE.md`.

### c. **No CORS Configuration**
- **Issue**: API Gateway did not have proper CORS configuration in `MODEL_RESPONSE.md`.
- **Fix**: Added CORS configuration to allow all origins in `IDEAL_RESPONSE.md`.

---

## 6. Functional Issues

### a. **Incomplete API Gateway Methods**
- **Issue**: The `MODEL_RESPONSE.md` implementation did not include all required HTTP methods (e.g., `PUT`, `DELETE`) for the `/items/{id}` resource.
- **Fix**: Added `PUT` and `DELETE` methods in `IDEAL_RESPONSE.md`.

### b. **No Validation for API Gateway Requests**
- **Issue**: API Gateway did not validate incoming requests in `MODEL_RESPONSE.md`.
- **Fix**: Validation was not explicitly added in `IDEAL_RESPONSE.md` but can be considered for future improvements.

---

## Summary of Fixes

| **Category**         | **Issue**                                      | **Fix in IDEAL_RESPONSE.md**                          |
|-----------------------|-----------------------------------------------|-----------------------------------------------------|
| Syntax               | Unsupported Lambda runtime                    | Updated to `python3.9`                              |
| Syntax               | Deprecated DynamoDB property                  | Used `point_in_time_recovery_specification`         |
| Syntax               | Hardcoded region                              | Made region dynamic using `self.region`            |
| Syntax               | Incorrect API Gateway metrics                 | Used `metric_client_error()` and `metric_server_error()` |
| Deployment           | Reserved environment variables                | Removed `AWS_REGION`                                |
| Deployment           | Missing resource outputs                      | Added all necessary outputs                         |
| Security             | Overly permissive IAM role                    | Restricted permissions                              |
| Security             | Lack of DynamoDB encryption                   | Enabled `AWS_MANAGED` encryption                    |
| Security             | No SNS subscription validation                | Added instructions for subscribing to SNS topic     |
| Performance          | No throttling for API Gateway                 | Added throttling limits                             |
| Performance          | No alarms for performance metrics             | Added alarms for duration and concurrent executions |
| Best Practices       | No tags for cost tracking                     | Added resource tags                                 |
| Best Practices       | No X-Ray tracing                              | Enabled X-Ray tracing                               |
| Functional           | Incomplete API Gateway methods                | Added `PUT` and `DELETE` methods                   |

---
