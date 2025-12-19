Hey team,

We need to build a zero-trust data processing pipeline with end-to-end encryption for our organization. The security team has been pushing hard for SOC 2 compliance, and they've mandated encryption at every layer, strict network isolation, and comprehensive audit logging. I've been asked to create this infrastructure using **CDK with Python**.

Our current architecture doesn't meet the security requirements. We have Lambda functions that access the internet directly, S3 buckets using default encryption, and no proper key rotation policies. The audit found multiple compliance gaps, and we need to fix this before the next review cycle.

The business wants a complete security overhaul. We need customer-managed KMS keys that rotate automatically, Lambda functions running in isolated private subnets with no internet exposure, and VPC endpoints for all AWS service communication. Every environment needs its own encryption keys, and we can't have any shared encryption contexts between dev, staging, and prod.

## What we need to build

Create a zero-trust data processing pipeline using **CDK with Python** for SOC 2 compliance and end-to-end encryption.

### Core Requirements

1. **Network Isolation**
   - Deploy Lambda functions in isolated private subnets with no internet access
   - Configure VPC with private subnets only (no internet gateway)
   - Set up VPC endpoints for S3, Lambda, KMS, and Secrets Manager services
   - Create security groups allowing only HTTPS traffic between components
   - No 0.0.0.0/0 inbound rules in security groups

2. **Encryption at Rest**
   - Create customer-managed KMS keys with automatic rotation every 90 days
   - Configure S3 buckets with bucket encryption using separate KMS keys per environment
   - Enable CloudWatch Logs encryption with dedicated KMS key
   - Each environment (dev/staging/prod) must have isolated KMS keys

3. **Secrets Management**
   - Implement Secrets Manager for storing API credentials with automatic rotation
   - Fetch from existing Secrets Manager entries (do NOT create new secrets)
   - Use VPC endpoint for Secrets Manager access from Lambda

4. **Storage Security**
   - Enable S3 bucket versioning and MFA delete protection
   - Use separate KMS keys per environment for S3 encryption
   - No shared encryption contexts between environments

5. **Access Control**
   - Configure IAM roles with explicit deny statements for non-encrypted operations
   - Follow least-privilege principle for all IAM policies
   - Implement resource tagging for compliance tracking (Environment, DataClassification, Owner)

6. **Audit and Logging**
   - Enable CloudWatch Logs with 90-day retention
   - Encrypt all log groups with dedicated KMS key
   - Log all API calls for compliance auditing

### Technical Requirements

- All infrastructure defined using **CDK with Python**
- Use **Lambda** for data processing functions
- Use **KMS** for customer-managed encryption keys with 90-day rotation
- Use **S3** with bucket encryption and versioning
- Use **Secrets Manager** for credential storage (fetch existing, don't create)
- Use **VPC** with private subnets only, no internet gateway
- Use **VPC Endpoints** for S3, Lambda, KMS, and Secrets Manager
- Use **Security Groups** with HTTPS-only rules
- Use **CloudWatch Logs** with encryption and 90-day retention
- Use **IAM** with explicit deny for non-encrypted operations
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{environment-suffix}
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** in their names for environment isolation
- All resources must be destroyable: use RemovalPolicy.DESTROY (no RETAIN policies)
- Lambda functions must use VPC endpoints to access AWS services
- KMS keys must enable automatic rotation (every 90 days)
- Security groups must follow least-privilege (no 0.0.0.0/0 inbound)
- Each environment must have isolated KMS keys (no shared encryption contexts)

### Constraints

- Lambda functions must run in private subnets with no internet access
- All AWS service calls must go through VPC endpoints
- KMS keys must rotate automatically every 90 days
- S3 buckets must have versioning and MFA delete enabled
- CloudWatch Logs must have 90-day retention and encryption
- IAM roles must include explicit deny statements for non-encrypted operations
- Security groups must allow only HTTPS traffic
- No shared encryption contexts between environments
- All resources must be tagged with Environment, DataClassification, and Owner
- All resources must be destroyable (no Retain policies)

## Success Criteria

- Functionality: Lambda functions process data securely in isolated network
- Security: All data encrypted at rest with customer-managed KMS keys
- Compliance: Resource tagging enables compliance tracking
- Network Isolation: No internet access from Lambda, all traffic through VPC endpoints
- Key Rotation: KMS keys rotate automatically every 90 days
- Audit: CloudWatch Logs capture all API calls with 90-day retention
- Resource Naming: All resources include environmentSuffix for uniqueness
- Code Quality: Python CDK code, well-tested, documented

## What to deliver

- Complete CDK Python implementation with zero-trust architecture
- VPC with private subnets and VPC endpoints (S3, Lambda, KMS, Secrets Manager)
- Lambda functions deployed in private subnets
- Customer-managed KMS keys with 90-day rotation
- S3 buckets with encryption, versioning, and MFA delete
- Secrets Manager integration (fetch existing secrets)
- Security groups with HTTPS-only rules
- CloudWatch Logs with encryption and 90-day retention
- IAM roles with explicit deny for non-encrypted operations
- Resource tagging (Environment, DataClassification, Owner)
- Unit tests for all components
- Documentation and deployment instructions
