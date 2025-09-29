# Model Failures

## 1. Syntax Issues

### 1.1 Incorrect Resource Configuration
- **Issue**: `AccessLogFormat.json_with_standard_fields()` is used without customization for API Gateway logging.
- **Fix**: Added additional fields for better logging.

### 1.2 Inline Lambda Code
- **Issue**: Lambda function code is defined inline, exceeding the 4 KB limit.
- **Fix**: Lambda code is stored in a separate file and deployed using `from_asset()`.

### 1.3 Missing Resource Dependencies
- **Issue**: Outputs reference resources that may not have been initialized yet.
- **Fix**: Ensured all resources are created before outputs are defined.

---

## 2. Deployment-Time Issues

### 2.1 S3 Bucket Name Collision
- **Issue**: Static bucket name can cause name collisions in global S3 namespaces.
- **Fix**: Added randomness to the bucket name using `cdk.Names.unique_id(self)`.

### 2.2 API Gateway Account Conflict
- **Issue**: Potential conflicts with API Gateway account configuration.
- **Fix**: Ensured no singleton resources are created that could cause conflicts.

### 2.3 CloudFormation Outputs
- **Issue**: `ApiGatewayUrl` output references the Lambda function ARN instead of the API Gateway URL.
- **Fix**: Corrected the output to use `self.api.url`.

---

## 3. Security Issues

### 3.1 IAM Role Permissions
- **Issue**: Overly broad permissions granted to the Lambda role.
- **Fix**: Scoped permissions to only the required actions for S3, DynamoDB, and CloudWatch Logs.

### 3.2 CORS Configuration
- **Issue**: S3 bucket CORS configuration allows all origins (`allowed_origins=["*"]`), which is insecure for production.
- **Fix**: Restricted allowed origins to specific domains in production.

### 3.3 Parameter Store Access
- **Issue**: Sensitive parameters are not securely stored.
- **Fix**: Used environment variables for sensitive data like S3 bucket name and DynamoDB table name.

---

## 4. Performance Issues

### 4.1 VPC Subnet Configuration
- **Issue**: Lambda function is not explicitly deployed in a VPC, which could lead to suboptimal performance.
- **Fix**: Ensured the Lambda function is deployed in a VPC if required.

### 4.2 API Gateway Rate Limiting
- **Issue**: No usage plan for API Gateway, which could lead to abuse.
- **Fix**: Added a usage plan with rate limiting and quotas.

### 4.3 CloudWatch Log Retention
- **Issue**: Log retention is not specified, leading to unnecessary storage costs.
- **Fix**: Set log retention to 2 weeks.

---