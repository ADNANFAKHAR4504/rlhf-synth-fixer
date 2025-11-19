Hey team,

We need to build a secure transaction processing infrastructure for our financial services division that handles credit card transaction analysis. The business requirements are strict - we need to meet PCI DSS compliance with full encryption at rest and in transit, comprehensive audit logging, and strict access controls. I've been asked to create this using CloudFormation with YAML.

The challenge here is that we're dealing with sensitive financial data that requires complete isolation. We can't have any internet exposure, everything needs to be encrypted with customer-managed keys, and we need full audit trails for compliance. The security team has been very clear - no shortcuts, no wildcards in IAM policies, and separate encryption keys for different data classifications.

## What we need to build

Create a secure transaction processing infrastructure using **CloudFormation with YAML** for PCI-compliant credit card transaction analysis.

### Core Requirements

1. **Network Isolation**
   - VPC with 3 private subnets across different availability zones
   - No internet gateway - complete isolation
   - VPC endpoints for S3, DynamoDB, and Lambda service access
   - Security groups with explicit rules for inter-service communication only
   - No security group egress rules allowing 0.0.0.0/0 destinations

2. **Transaction Processing**
   - Lambda function for processing transactions
   - 1GB memory allocation
   - 5-minute timeout
   - Deployed in VPC private subnets
   - Must use VPC endpoints to access AWS services

3. **Data Storage**
   - DynamoDB table with on-demand billing mode
   - Point-in-time recovery enabled for data protection
   - Encryption at rest with KMS

4. **Audit Logging**
   - S3 bucket for audit logs with SSE-KMS encryption using customer-managed key
   - Versioning enabled on S3 bucket
   - Lifecycle policies for log retention
   - VPC Flow Logs storing to the encrypted S3 bucket

5. **Encryption Management**
   - Two separate KMS customer-managed keys
   - One KMS key dedicated for S3 encryption
   - One KMS key dedicated for CloudWatch Logs encryption
   - Keys must have CloudFormation stack policy preventing updates

6. **Logging and Monitoring**
   - CloudWatch Log groups with KMS encryption
   - 90-day retention policy
   - Separate encryption key from S3 (use CloudWatch Logs KMS key)

7. **Access Control**
   - IAM roles with explicit permissions for each service
   - No wildcard actions allowed in IAM policies
   - Least-privilege principle enforcement
   - Separation of duties between services

8. **Observability**
   - Outputs for all resource ARNs
   - Outputs for encryption key IDs
   - CloudFormation drift detection configuration

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Deploy to **us-east-1** region
- Use **VPC** for network isolation with 3 private subnets
- Use **Lambda** for transaction processing (1GB memory, 5-minute timeout)
- Use **DynamoDB** for transaction storage with point-in-time recovery
- Use **S3** for audit logs with versioning and lifecycle policies
- Use **KMS** for encryption - two separate customer-managed keys
- Use **VPC Endpoints** for S3, DynamoDB, and Lambda service access
- Use **IAM** roles with explicit permissions only (no wildcards)
- Use **CloudWatch Logs** with KMS encryption and 90-day retention
- Use **VPC Flow Logs** storing to encrypted S3 bucket
- Use **Security Groups** with explicit inter-service communication rules
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix pattern
- Use CloudFormation intrinsic function !Sub for dynamic resource naming

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - NO RemovalPolicy: Retain allowed
- All resources must be destroyable - NO DeletionProtection: true allowed
- Lambda functions in Node.js runtime should use Node.js 18.x or later (AWS SDK v3 included)
- All named resources (S3 buckets, DynamoDB tables, KMS keys, Log groups) must include environmentSuffix parameter
- Use !Sub "${AWS::StackName}-resource-name-${EnvironmentSuffix}" pattern for resource naming

### Constraints

- All S3 buckets must use SSE-KMS encryption with customer-managed keys (no SSE-S3 or SSE-AES256)
- Lambda functions must be deployed in VPC and use VPC endpoints (no NAT Gateway or internet access)
- DynamoDB tables must have point-in-time recovery enabled
- All IAM roles must follow least-privilege principle with explicit actions only (no wildcards like s3:* or dynamodb:*)
- CloudWatch Logs must use KMS encryption with separate key from S3
- VPC must have flow logs enabled and stored in encrypted S3 bucket
- Security groups must have explicit egress rules (no 0.0.0.0/0 destinations)
- All resources must have deletion protection disabled for testing environments
- Stack must include CloudFormation drift detection configuration
- No Retain deletion policies on any resources
- VPC spans 3 availability zones in us-east-1 (use us-east-1a, us-east-1b, us-east-1c)

## Success Criteria

- Functionality: Complete transaction processing pipeline with Lambda, DynamoDB, and audit logging
- Security: All data encrypted at rest with customer-managed KMS keys, no internet exposure
- Compliance: PCI DSS requirements met - encryption, audit logs, access controls
- Network: VPC with 3 private subnets, VPC endpoints for service access, no internet gateway
- IAM: Explicit permissions only, no wildcard actions, least-privilege principle
- Logging: CloudWatch Logs encrypted, 90-day retention, VPC Flow Logs to S3
- Resource Naming: All resources include environmentSuffix for uniqueness
- Destroyability: All resources can be deleted cleanly (no Retain policies)
- Drift Detection: CloudFormation drift detection enabled
- Outputs: All resource ARNs and encryption key IDs exported

## What to deliver

- Complete CloudFormation YAML template with all resources
- VPC with 3 private subnets across different AZs
- Lambda function (1GB memory, 5-minute timeout) with VPC configuration
- DynamoDB table with on-demand billing and point-in-time recovery
- S3 bucket with versioning, lifecycle policies, and SSE-KMS encryption
- Two KMS customer-managed keys (S3 and CloudWatch Logs)
- VPC endpoints for S3, DynamoDB, and Lambda
- IAM roles with explicit permissions (no wildcards)
- CloudWatch Log groups with KMS encryption and 90-day retention
- VPC Flow Logs configuration
- Security groups with explicit rules
- Stack policy for KMS key protection
- Comprehensive outputs section with all ARNs and key IDs
- Lambda function code (inline or as separate file in lib/lambda/)
- CloudFormation Parameters section including EnvironmentSuffix parameter
