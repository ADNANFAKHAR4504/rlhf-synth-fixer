Hey team,

We need to build infrastructure for a payment processing API that can support multiple environments (development, staging, and production). The business has been asking for a flexible, reusable solution that we can deploy consistently across all our environments. I've been asked to create this using TypeScript with CDKTF. The goal is to have a single construct that accepts environment parameters and configures everything appropriately.

The payment processing team needs different configurations for each environment. Development should be lightweight and cost-effective for testing. Staging should mirror production but with slightly reduced capacity. Production needs full redundancy and performance optimization. We also need proper logging and monitoring across all environments to track API usage and performance.

## What we need to build

Create a payment processing API infrastructure using **CDKTF with TypeScript** that supports multi-environment deployments.

### Core Requirements

1. **Reusable CDKTF Construct**
   - Accept environment parameters (dev, staging, prod)
   - Configure resources based on environment type
   - Support dynamic configuration for different environments

2. **Storage Layer**
   - S3 buckets for storing payment transaction logs and receipts
   - Environment-specific retention policies: dev (7 days), staging (30 days), prod (90 days)
   - Versioning enabled for compliance tracking
   - Encryption at rest using AWS managed keys

3. **Database Layer**
   - DynamoDB table for transaction records
   - On-demand billing for dev environment
   - Provisioned capacity for staging and production
   - Point-in-time recovery enabled for production
   - Global secondary indexes for querying by customer ID and transaction date

4. **Compute Layer**
   - Lambda function for processing payment API requests
   - Environment-specific memory allocation: dev (512MB), staging (1GB), prod (2GB)
   - Timeout configuration appropriate for payment processing
   - Environment variables for configuration management

5. **API Gateway**
   - REST API with throttling limits based on environment
   - API key management for client authentication
   - Stage-specific deployment configurations
   - Request validation and error handling

6. **Monitoring and Logging**
   - CloudWatch log groups for Lambda functions
   - Environment-specific retention: dev (7 days), staging (14 days), prod (30 days)
   - CloudWatch metrics for API performance tracking
   - Alarms for error rates and latency

7. **Resource Management**
   - Consistent tagging across all resources with environment and project labels
   - Resource names must include **environmentSuffix** for uniqueness across deployments
   - Follow naming convention: `{resource-type}-{environment-suffix}`
   - Proper IAM roles with least privilege access

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **S3** for transaction log storage
- Use **DynamoDB** for transaction database
- Use **Lambda** for API request processing
- Use **API Gateway** for REST API endpoint
- Use **CloudWatch** for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **ap-northeast-2** region
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

### Constraints

- No hard-coded credentials or sensitive data in code
- All resources must support multiple simultaneous deployments
- IAM roles must follow principle of least privilege
- S3 buckets must have encryption enabled
- DynamoDB must have backup enabled for production
- Lambda functions must have appropriate timeout and memory settings
- All resources must be tagged consistently
- No Retain policies on any resources

## Success Criteria

- **Functionality**: Single construct deploys complete environment-specific infrastructure
- **Performance**: Lambda memory and DynamoDB capacity scale appropriately per environment
- **Reliability**: Production environment includes proper backup and recovery mechanisms
- **Security**: IAM roles enforce least privilege, encryption enabled on storage
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Code Quality**: TypeScript implementation with proper types, well-tested, documented

## What to deliver

- Complete CDKTF TypeScript implementation with reusable construct
- S3 buckets with environment-specific retention policies
- DynamoDB table with appropriate billing mode per environment
- Lambda function with environment-specific memory allocation
- API Gateway with throttling and API key support
- CloudWatch log groups with retention policies
- IAM roles and policies with least privilege access
- Consistent tagging across all resources
- Unit tests for all components
- Documentation and deployment instructions
