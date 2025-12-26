# MODEL_FAILURES.md

## 1. Missing Required Configuration Validation Details
- **Model Output Issue:** The validation of required config parameters (`_validate_config()`) was either omitted or under-detailed.
- **Reality in `tap_stack.py`:** Explicitly checks for `"team_name"`, `"environment"`, `"source_region"`, `"target_region"`, and `"allowed_cidr"`, raising `ValueError` if missing.

## 2. Resource Creation Order
- **Model Output Issue:** Did not mention that IAM roles are created **before** dependent resources (DynamoDB, S3, Lambda, API Gateway) to satisfy dependency ordering.
- **Reality:** `_create_iam_roles()` is invoked first in `__init__` before other `_create_*` methods.

## 3. IAM Role Scope and Attachments
- **Model Output Issue:** Generic description of IAM least-privilege policies but did not capture:
  - Lambda policy includes both DynamoDB table ARN and `index/*` subresource ARNs.
  - API Gateway CloudWatch logging role (`AmazonAPIGatewayPushToCloudWatchLogs` policy).
- **Reality:** `tap_stack.py` explicitly defines these roles and policy attachments.

## 4. DynamoDB Global Table Replication
- **Model Output Issue:** Described global tables but missed:
  - `point_in_time_recovery` for both regions.
  - `opts` dependency on primary table creation.
- **Reality:** Implementation sets both for resiliency and ordering.

## 5. S3 Replication Policy Details
- **Model Output Issue:** Overgeneralized replication; omitted:
  - Specific allowed actions (`s3:GetObjectVersionForReplication`, `s3:GetObjectVersionAcl`, etc.).
  - Policy covers both source bucket ARNs and target bucket ARNs.
- **Reality:** `tap_stack.py` precisely enumerates actions and resources.

## 6. Public Website Configuration
- **Model Output Issue:** Did not mention:
  - Public read policy for `GetObject`.
  - Website configuration (`index_document`, `error_document`).
- **Reality:** Fully implemented in `_create_s3_bucket()`.

## 7. Lambda Implementation
- **Model Output Issue:** Only referenced “Lambda creation” without:
  - Actual inline Python code embedded as `lambda_code` string.
  - Handling GET/POST methods and errors.
- **Reality:** Lambda function logic is inlined with `boto3` interactions and HTTP method handling.

## 8. API Gateway Stage Logging and Canary
- **Model Output Issue:** Mentioned canary but not:
  - JSON `access_log_format`.
  - Creation of API Gateway CloudWatch `LogGroup`.
  - API Gateway `Account` resource linking logs role.
- **Reality:** These are fully configured in `_create_api_gateway()`.

## 9. Monitoring Completeness
- **Model Output Issue:** Only referenced generic alarms.
- **Reality:** Creates specific alarms for:
  - Lambda errors and duration.
  - API Gateway 4XX, 5XX, latency.
  - DynamoDB throttled requests.
  - Each alarm has explicit thresholds, periods, and dimensions.

## 10. Cross-Region Replication Traffic Management
- **Model Output Issue:** Did not include:
  - Route53 health check resource with HTTPS probe to API endpoint.
  - `pulumi.export` statements for key outputs (`api_gateway_url`, `s3_website_url`, etc.).
- **Reality:** `_setup_cross_region_replication()` handles both.

## 11. CI/CD Pipeline Example
- **Model Output Issue:** If present, was not as detailed.
- **Reality:** In-file docstring includes multi-step blue-green deployment pipeline with Route53 weighted routing commands, monitoring, rollback, and final cutover JSON examples.
