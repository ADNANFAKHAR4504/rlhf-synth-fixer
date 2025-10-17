# Secure API with Cognito Authentication - Ideal Response

This document provides the complete, production-ready infrastructure code for deploying a secure serverless API with Cognito authentication, global scalability, and comprehensive monitoring.

## Architecture Overview

The infrastructure deploys a serverless API backend with:

- **API Gateway REST API** for HTTP endpoints
- **Cognito User Pools** for authentication
- **Lambda (Python 3.11)** for API processing
- **DynamoDB Global Tables** for multi-region data storage
- **CloudFront** for global edge delivery
- **Route53** (optional) for custom DNS
- **CloudWatch** for metrics, logs, and dashboards
- **X-Ray** for distributed tracing
- **SNS** for alarm notifications
- **IAM** with least-privilege access

All resources follow AWS best practices with encryption, versioning, and proper security controls.

## File Structure

```
lib/
├── provider.tf          # AWS provider configuration (2 regions)
├── variables.tf         # All configurable parameters
├── main.tf              # S3 bucket and Lambda packaging
├── cognito.tf           # User Pool and App Client
├── dynamodb.tf          # Global Table configuration
├── iam.tf               # Roles and policies (least privilege)
├── lambda.tf            # Lambda function configuration
├── api_gateway.tf       # REST API with Cognito authorizer
├── cloudfront.tf        # CDN distribution
├── route53.tf           # DNS (conditional)
├── monitoring.tf        # CloudWatch + X-Ray
├── outputs.tf           # Infrastructure outputs
└── lambda/
    ├── lambda_function.py   # Python CRUD API
    └── requirements.txt     # Python dependencies
```

## Infrastructure Code

### provider.tf

Provider configuration with primary and secondary regions for Global Tables.

**Key Features**:
- Separate providers for multi-region deployment
- Default tags for all resources
- S3 backend for state management (configured at init time)

See: `lib/provider.tf` (42 lines)

### variables.tf

Complete variable definitions with sensible defaults.

**Key Variables**:
- `environment_suffix` (required) - Unique identifier for resources
- `primary_region` / `secondary_region` - Multi-region support
- `enable_route53` (default: false) - Optional DNS
- `alarm_email` (default: devang.p@turing.com) - Alert notifications
- All other variables have defaults for automated deployment

See: `lib/variables.tf` (102 lines)

### main.tf

S3 bucket for Lambda deployment with security controls and Lambda package preparation.

**Security Features**:
- Versioning enabled
- Server-side encryption (AES256)
- Public access blocked (all 4 controls)
- Lambda code packaged from `lib/lambda/` directory

See: `lib/main.tf` (69 lines)

### cognito.tf

User Pool with strong password policies and mobile app client.

**Configuration**:
- Password: min 8 chars, requires upper, lower, numbers, symbols
- Email verification required
- MFA optional
- SRP authentication (no client secret)
- Token validity: 60 min access, 30 day refresh

See: `lib/cognito.tf` (126 lines)

### dynamodb.tf

Global Table with on-demand billing and multi-region replication.

**Features**:
- PAY_PER_REQUEST billing mode
- Primary key: `userId` (String)
- Global Secondary Index: `email-index`
- Replicas in 2 regions
- Point-in-time recovery enabled
- Encryption enabled
- DynamoDB Streams for replication

See: `lib/dynamodb.tf` (49 lines)

### iam.tf

Least-privilege IAM roles and policies with specific ARNs.

**Security**:
- Lambda execution role with specific table ARN access
- CloudWatch Logs with specific log group ARNs
- NO wildcards in resource specifications
- X-Ray write access via managed policy
- API Gateway CloudWatch role for logging

**Permissions**:
- DynamoDB: GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan (table + indexes)
- CloudWatch: CreateLogGroup, CreateLogStream, PutLogEvents (specific log groups)
- X-Ray: PutTraceSegments, PutTelemetryRecords

See: `lib/iam.tf` (137 lines)

### lambda.tf

Lambda function with X-Ray tracing and environment variables.

**Configuration**:
- Runtime: python3.11
- Handler: lambda_function.lambda_handler
- Memory: 256 MB (configurable)
- Timeout: 30 seconds (configurable)
- Source: S3 bucket
- X-Ray: Active tracing
- Environment: DynamoDB table name, region, environment suffix
- CloudWatch log group with 30-day retention

See: `lib/lambda.tf` (69 lines)

### api_gateway.tf

REST API with Cognito authorizer, CRUD endpoints, and CORS.

**Endpoints**:
- `GET /profiles` - List all profiles
- `POST /profiles` - Create profile
- `GET /profiles/{userId}` - Get specific profile
- `PUT /profiles/{userId}` - Update profile
- `DELETE /profiles/{userId}` - Delete profile
- `OPTIONS /*` - CORS preflight

**Features**:
- Cognito User Pools authorizer (all methods except OPTIONS)
- Lambda proxy integration
- Full CORS support
- CloudWatch logging (INFO level)
- X-Ray tracing enabled
- API throttling configured
- Deployment triggers on method changes

See: `lib/api_gateway.tf` (324 lines)

### cloudfront.tf

CDN distribution for global edge delivery.

**Configuration**:
- Origin: API Gateway regional endpoint
- HTTPS only (redirect HTTP to HTTPS)
- Cache disabled for API responses (TTL=0)
- All HTTP methods allowed
- Authorization headers forwarded
- Price Class 100 (US, Canada, Europe)
- Works without custom domain (uses CloudFront domain)
- Optional custom domain via Route53

See: `lib/cloudfront.tf` (88 lines)

### route53.tf

Optional DNS configuration (disabled by default).

**Conditional Resources**:
- Hosted zone (`count = var.enable_route53 ? 1 : 0`)
- A record alias to CloudFront
- Health check for API endpoint
- All resources conditional based on `enable_route53` variable

**Note**: Custom domain requires:
- `enable_route53 = true`
- Valid `domain_name`
- ACM certificate ARN in us-east-1

See: `lib/route53.tf` (51 lines)

### monitoring.tf

Comprehensive monitoring with CloudWatch and X-Ray.

**Components**:
- SNS topic and email subscription for alarms
- CloudWatch dashboard with 8 widget types:
  - API Gateway: Requests, 4XX/5XX errors, latency
  - Lambda: Invocations, errors, duration, concurrency
  - DynamoDB: Read/write capacity, errors
  - Cognito: Authentication metrics
- CloudWatch alarms:
  - API 5XX errors > 10 in 5 minutes
  - Lambda errors > 5 in 5 minutes
  - Lambda duration > 10 seconds
  - DynamoDB user errors > 10 in 5 minutes
- X-Ray sampling rule (5% sampling rate)

See: `lib/monitoring.tf` (324 lines)

### outputs.tf

All infrastructure outputs for testing and integration.

**Outputs**:
- `api_gateway_invoke_url` - Direct API endpoint
- `cloudfront_domain_name` - CDN endpoint
- `cloudfront_url` - Full HTTPS URL
- `cognito_user_pool_id` - User pool ID
- `cognito_user_pool_client_id` - App client ID
- `dynamodb_table_name` - Table name
- `lambda_function_name` - Function name
- `lambda_log_group` - Log group name
- `primary_region` / `secondary_region` - Deployment regions
- `sns_topic_arn` - Alarm topic
- `cloudwatch_dashboard_name` - Dashboard name
- `environment_suffix` - Resource prefix

See: `lib/outputs.tf` (119 lines)

## Application Code

### lambda_function.py

Complete Python Lambda function with CRUD operations.

**Features**:
- User profile management (Create, Read, Update, Delete, List)
- Cognito user context extraction from authorizer
- DynamoDB integration with boto3
- X-Ray tracing with decorators
- Input validation
- Proper error handling with HTTP status codes
- CORS headers in all responses
- Decimal type handling for DynamoDB
- Request routing based on HTTP method and path

**CRUD Operations**:
1. `create_profile()` - POST /profiles
2. `get_profile()` - GET /profiles/{userId}
3. `update_profile()` - PUT /profiles/{userId}
4. `delete_profile()` - DELETE /profiles/{userId}
5. `list_profiles()` - GET /profiles

**Error Handling**:
- 400: Bad Request (validation errors, invalid JSON)
- 401: Unauthorized (missing/invalid auth)
- 404: Not Found (profile doesn't exist)
- 500: Internal Server Error (unexpected errors)

See: `lib/lambda/lambda_function.py` (335 lines)

### requirements.txt

Python dependencies for Lambda function.

```
boto3==1.34.22
aws-xray-sdk==2.12.1
```

## Deployment

### Prerequisites

- AWS CLI configured
- Terraform >= 1.4.0
- Node.js >= 20.0.0 (for testing)
- Environment suffix set: `export ENVIRONMENT_SUFFIX="pr123"`

### Deployment Commands

```bash
# Initialize Terraform
cd lib
terraform init -reconfigure \
  -backend-config="bucket=your-state-bucket" \
  -backend-config="key=secure-api/${ENVIRONMENT_SUFFIX}/terraform.tfstate" \
  -backend-config="region=us-east-1"

# Plan deployment
terraform plan -var="environment_suffix=${ENVIRONMENT_SUFFIX}" -out=tfplan

# Apply deployment
terraform apply tfplan

# Get outputs
terraform output -json > ../cfn-outputs/terraform-outputs.json
```

### Post-Deployment

1. Save outputs to `cfn-outputs/flat-outputs.json` for testing
2. Create test users in Cognito
3. Run integration tests: `npm run test:integration`
4. Access API via outputs.api_gateway_invoke_url or outputs.cloudfront_url
5. Monitor via CloudWatch dashboard

## Testing

### Unit Tests

```bash
npm run test:unit
```

Validates all infrastructure code without running Terraform.

### Integration Tests

```bash
npm run test:integration
```

End-to-end testing with deployed infrastructure:
- Cognito user signup and authentication
- CRUD operations through API
- CloudFront distribution access
- DynamoDB Global Tables replication
- CloudWatch logs generation
- X-Ray trace recording

## Security Features

1. **S3 Buckets**:
   - Versioning enabled
   - Encryption at rest (AES256)
   - Public access blocked (all controls)

2. **DynamoDB**:
   - Encryption at rest
   - Point-in-time recovery
   - On-demand billing (cost-optimized)

3. **IAM**:
   - Least-privilege roles
   - Specific resource ARNs (no wildcards)
   - Separate roles per service

4. **API Gateway**:
   - Cognito authorization required
   - HTTPS only
   - Request throttling configured

5. **Lambda**:
   - Minimal IAM permissions
   - X-Ray tracing for security monitoring
   - CloudWatch logs for audit trail

6. **Cognito**:
   - Strong password policies
   - Email verification required
   - MFA supported (optional)
   - Advanced security mode enforced

## Monitoring and Observability

1. **CloudWatch Dashboards**:
   - Unified view of all metrics
   - Real-time performance monitoring
   - Historical trend analysis

2. **CloudWatch Alarms**:
   - Automated alerting via SNS/Email
   - Proactive issue detection
   - Configurable thresholds

3. **X-Ray Tracing**:
   - End-to-end request tracing
   - Performance bottleneck identification
   - Error root cause analysis

4. **CloudWatch Logs**:
   - Centralized logging
   - 30-day retention
   - Log insights for analysis

## Cost Optimization

1. **DynamoDB**: PAY_PER_REQUEST billing (pay only for what you use)
2. **Lambda**: Per-request billing with configurable memory
3. **CloudWatch**: 30-day log retention (not indefinite)
4. **API Gateway**: Request-based pricing
5. **S3**: Lifecycle policies for old Lambda packages (can be added)

## Scalability

1. **Global Tables**: Multi-region data replication
2. **CloudFront**: Edge caching and global distribution
3. **Lambda**: Auto-scaling to 1000+ concurrent executions
4. **DynamoDB**: On-demand scaling (no capacity planning)
5. **API Gateway**: Handles millions of requests per second

## Compliance and Best Practices

- Follows AWS Well-Architected Framework principles
- Infrastructure as Code with Terraform
- Automated deployment via CI/CD
- Comprehensive testing (unit + integration)
- Security by default (encryption, least privilege)
- Monitoring and observability built-in
- Cost-optimized resource configuration

## Documentation

- `deployment-guide.md` - Step-by-step deployment instructions
- `testing-guide.md` - Comprehensive testing procedures
- `MODEL_FAILURES.md` - Analysis of improvements from initial response

This infrastructure is production-ready and follows AWS best practices for security, scalability, and operational excellence.
