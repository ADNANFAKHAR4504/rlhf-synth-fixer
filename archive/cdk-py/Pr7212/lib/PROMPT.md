# Zero-Trust Data Processing Pipeline

Hey team,

We need to build a secure data processing pipeline that implements zero-trust security principles from the ground up. The security team has been on us about meeting SOC 2 compliance requirements, and they want encryption at every layer with strict network isolation and comprehensive audit logging. This is a high-priority security initiative.

The business is asking us to create this using **AWS CDK with Python** since that's what our infrastructure team has standardized on. The security architecture team has laid out some pretty specific requirements around how data flows through the system, and we need to make sure everything is locked down properly.

This pipeline will handle sensitive data, so we're implementing customer-managed encryption keys that rotate automatically, isolated network environments, and making sure Lambda functions can't reach the internet at all. Everything needs to be encrypted both at rest and in transit, and we need detailed logging of all API calls.

## What we need to build

Create a zero-trust data processing pipeline using **AWS CDK with Python** that processes sensitive data with end-to-end encryption and network isolation.

### Core Requirements

1. **Network Isolation**
   - Deploy Lambda functions in isolated private subnets with no internet access
   - Set up VPC endpoints for S3, Lambda, KMS, and Secrets Manager services
   - Create security groups allowing only HTTPS traffic between components
   - No internet gateway or NAT gateway in the VPC

2. **Encryption at Every Layer**
   - Create customer-managed KMS keys with automatic rotation every 90 days
   - Configure S3 buckets with bucket encryption using separate KMS keys per environment
   - Enable CloudWatch Logs encryption with dedicated KMS key
   - Configure IAM roles with explicit deny statements for non-encrypted operations

3. **Secrets Management**
   - Implement Secrets Manager for storing API credentials with automatic rotation
   - Lambda functions retrieve credentials from Secrets Manager using VPC endpoints
   - Separate secrets per environment

4. **Data Storage and Protection**
   - Configure S3 buckets for encrypted storage of sensitive data
   - Enable S3 bucket versioning and MFA delete protection
   - Separate KMS keys for each environment's S3 buckets

5. **Compliance and Audit**
   - Implement resource tagging for compliance tracking (Environment, DataClassification, Owner)
   - Enable CloudWatch Logs with encryption and proper retention
   - All API calls must be logged to CloudWatch with 90-day retention

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use AWS Lambda for data processing in private subnets
- Use Amazon S3 for encrypted data storage
- Use AWS KMS for customer-managed encryption keys with rotation
- Use AWS Secrets Manager for credential storage with rotation
- Use Amazon VPC with private subnets and VPC endpoints
- Use Amazon CloudWatch Logs for encrypted audit logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Requires CDK 2.x with Python 3.9+

### Deployment Configuration

- **Single Region**: Deploy to a single AWS region (configured via `CDK_DEFAULT_REGION` environment variable)
- **Single Account**: Deploy to a single AWS account (configured via `CDK_DEFAULT_ACCOUNT` environment variable)
- No multi-region or cross-account deployment supported

### Deployment Requirements (CRITICAL)

- Resource names MUST include environmentSuffix parameter for multi-environment support
- All resources must be destroyable (no RemovalPolicy.RETAIN)
- KMS keys must allow deletion with proper removal policies
- S3 buckets must allow deletion (RemovalPolicy.DESTROY with auto_delete_objects)
- Lambda functions must NOT have reserved concurrent executions (blocks scaling)
- Security groups must follow least-privilege principles

### Constraints

- All data must be encrypted at rest using customer-managed KMS keys with automatic rotation every 90 days
- Lambda functions must use VPC endpoints to access AWS services without internet exposure
- Each environment (dev/staging/prod) must have isolated KMS keys and cannot share encryption contexts
- All API calls must be logged to CloudWatch with 90-day retention and encrypted log groups
- Security groups must follow least-privilege with no 0.0.0.0/0 inbound rules
- VPC must use private subnets only with no internet gateway
- Single account deployment (no cross-account resources)
- All resources must be tagged with Environment, DataClassification, and Owner tags

## Success Criteria

- **Functionality**: Lambda functions successfully process data from S3 using Secrets Manager credentials
- **Security**: All encryption using customer-managed KMS keys, no internet access from Lambda
- **Network Isolation**: Lambda functions communicate through VPC endpoints only
- **Compliance**: All resources properly tagged, logs encrypted and retained for 90 days
- **Key Rotation**: KMS keys rotate automatically every 90 days
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Well-structured Python CDK code, properly documented

## What to deliver

- Complete AWS CDK Python implementation in lib/tap_stack.py
- VPC with private subnets and VPC endpoints (S3, Lambda, KMS, Secrets Manager)
- Lambda functions deployed in private subnets for data processing
- S3 buckets with versioning, MFA delete, and KMS encryption
- Customer-managed KMS keys with automatic 90-day rotation
- Secrets Manager secrets with automatic rotation
- Security groups with least-privilege HTTPS-only rules
- CloudWatch Log Groups with KMS encryption and 90-day retention
- IAM roles with explicit deny for non-encrypted operations
- Proper resource tagging (Environment, DataClassification, Owner)
- Documentation on deployment and configuration
