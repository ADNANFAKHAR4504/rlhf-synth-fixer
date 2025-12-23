# Secure Transaction Processing Pipeline

Hey team,

We've been asked to build a secure transaction processing pipeline for a financial services company that handles customer transaction analytics. They need infrastructure that meets strict compliance requirements - everything encrypted, network isolated, and fully auditable. The system needs to process real-time transaction data while maintaining complete security and compliance.

The business requirements are pretty comprehensive. They want a Lambda-based processing system that runs in complete network isolation, uses DynamoDB for transactional data storage, and Kinesis Data Streams for real-time analytics. Everything has to use customer-managed KMS keys with automatic rotation, and all AWS service access must go through VPC endpoints - no internet routing allowed. They also need comprehensive monitoring and audit logging through CloudWatch.

This is for their development environment first, then production after testing. They're very particular about destroyability since this is a testing account, and they want CloudWatch logs retained for 90 days for audit compliance. The infrastructure needs to span three availability zones in US East for resilience.

## What we need to build

Create a secure financial transaction processing pipeline using **CloudFormation with YAML** for a financial services company requiring strict compliance and security controls.

### Core Requirements

1. **Encryption and Key Management**
   - Create KMS customer-managed key (CMK) with automatic rotation enabled
   - Use this KMS key to encrypt all resources (Lambda environment, DynamoDB, Kinesis, CloudWatch Logs)
   - Configure key policy for least-privilege access to Lambda and services

2. **Transaction Processing Lambda**
   - Deploy Lambda function with 1GB memory allocation
   - Must run in private subnets across 3 availability zones
   - Configure Lambda to use VPC endpoints for all AWS service access
   - Encrypt environment variables using KMS key
   - No internet access - all AWS service calls through VPC endpoints

3. **DynamoDB Storage**
   - Create DynamoDB table with on-demand billing
   - Enable point-in-time recovery (PITR) for data protection
   - Encrypt table using customer-managed KMS key
   - Configure appropriate read/write capacity for transaction workload

4. **Kinesis Data Streams**
   - Deploy Kinesis Data Stream for real-time transaction analytics
   - Enable server-side encryption using customer-managed KMS key
   - Configure appropriate shard count for expected throughput

5. **VPC and Network Isolation**
   - Create VPC with private subnets across 3 availability zones
   - No NAT Gateway or Internet Gateway - complete network isolation
   - Deploy VPC endpoints for DynamoDB, Lambda, Kinesis, KMS, and CloudWatch Logs services
   - Configure security groups allowing only required traffic between components
   - Security groups must use specific CIDR ranges - no 0.0.0.0/0 allowed

6. **CloudWatch Monitoring and Audit Logging**
   - Create CloudWatch Logs log group with 90-day retention period
   - Encrypt CloudWatch Logs using customer-managed KMS key
   - Configure Lambda to write logs to CloudWatch
   - Enable CloudWatch metrics for Lambda, DynamoDB, and Kinesis

7. **AWS Config Compliance Monitoring**
   - Deploy AWS Config configuration recorder to monitor encryption compliance
   - Create Config rules to verify KMS encryption on all resources
   - Configure Config to use IAM role with service-role/AWS_ConfigRole managed policy
   - Store Config snapshots in S3 bucket with encryption

8. **IAM Security Controls**
   - Create IAM roles with explicit least-privilege permissions
   - No wildcard (*) permissions allowed in any policy
   - Lambda execution role with specific permissions for DynamoDB, Kinesis, KMS, CloudWatch
   - Config service role with AWS managed policy for Config access
   - All IAM policies must specify exact resource ARNs where possible

9. **Termination Protection**
   - Add CloudFormation stack parameter for termination protection (default: false)
   - Allow developers to enable protection for production stacks

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **KMS** for customer-managed key with automatic rotation
- Use **Lambda** (1GB memory) for transaction processing in private subnets
- Use **DynamoDB** with point-in-time recovery and KMS encryption
- Use **Kinesis Data Streams** with KMS server-side encryption
- Use **VPC** with private subnets across 3 availability zones
- Use **VPC Endpoints** for DynamoDB, Lambda, Kinesis, KMS, CloudWatch Logs
- Use **CloudWatch Logs** with 90-day retention and KMS encryption
- Use **AWS Config** with Config rules for encryption compliance monitoring
- Use **Security Groups** with explicit rules (no 0.0.0.0/0 ranges)
- Deploy to **us-east-1** region
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: `ResourceType-${EnvironmentSuffix}`
- All resources must be destroyable (DeletionPolicy: Delete, no deletion protection)

### Deployment Requirements (CRITICAL)

- **EnvironmentSuffix**: All named resources MUST include the EnvironmentSuffix parameter using CloudFormation !Sub intrinsic function
- **Destroyability**: All resources must have DeletionPolicy: Delete or no explicit policy (defaults to Delete). NO RemovalPolicy: Retain or DeletionProtection: true
- **AWS Config IAM**: Use the correct managed policy arn:aws:iam::aws:policy/service-role/AWS_ConfigRole for Config service role
- **GuardDuty**: Do NOT create GuardDuty detector - it is an account-level service and will conflict with existing detectors
- **Lambda Runtime**: If using Node.js 18+, do not require aws-sdk as it is not included by default. Use AWS SDK v3 or extract data from event object
- **VPC Endpoints**: Required for all AWS service access since Lambda runs in private subnets with no internet access

### Constraints

- All data encrypted using AWS KMS customer-managed keys with automatic rotation enabled
- Lambda functions must use VPC endpoints for AWS service access without internet routing
- DynamoDB tables must have point-in-time recovery enabled for data protection
- All IAM roles must follow least-privilege principle with no wildcard (*) permissions in resource ARNs
- Security groups must explicitly define all ingress and egress rules with specific CIDR ranges - no 0.0.0.0/0 allowed
- CloudWatch Logs must have encryption enabled using customer-managed KMS key
- CloudWatch Logs retention must be set to 90 days for audit compliance
- All resources must have deletion protection disabled (DeletionPolicy: Delete) for testing environments
- VPC must span 3 availability zones with private subnets only
- No NAT Gateway or Internet Gateway - use VPC endpoints for AWS service access

## Success Criteria

- **Functionality**: Lambda can process transactions, write to DynamoDB, publish to Kinesis, all through VPC endpoints
- **Encryption**: All data encrypted at rest using customer-managed KMS key with automatic rotation
- **Network Isolation**: Lambda runs in private subnets with no internet access, all AWS service calls through VPC endpoints
- **Security**: IAM roles follow least privilege with no wildcard permissions, security groups use specific CIDR ranges
- **Compliance**: AWS Config monitors encryption compliance, CloudWatch Logs retained for 90 days
- **Reliability**: Multi-AZ deployment across 3 availability zones, DynamoDB point-in-time recovery enabled
- **Resource Naming**: All named resources include EnvironmentSuffix parameter for uniqueness
- **Destroyability**: All resources can be deleted cleanly without retention policies blocking cleanup
- **Code Quality**: Valid CloudFormation YAML, well-documented with inline comments, parameterized for reusability

## What to deliver

- Complete CloudFormation YAML template implementing all requirements
- KMS customer-managed key with automatic rotation
- Lambda function (1GB memory) deployed in private subnets across 3 AZs
- DynamoDB table with PITR and KMS encryption
- Kinesis Data Stream with KMS server-side encryption
- VPC with private subnets and VPC endpoints (DynamoDB, Lambda, Kinesis, KMS, CloudWatch Logs)
- Security groups with explicit rules for Lambda and VPC endpoints
- CloudWatch Logs log group with 90-day retention and KMS encryption
- AWS Config configuration recorder and rules for encryption compliance
- IAM roles for Lambda and Config with least-privilege permissions
- CloudFormation parameters including EnvironmentSuffix and optional termination protection
- Comprehensive inline comments explaining security and compliance configurations
- CloudFormation Outputs for all resource ARNs and identifiers for testing
