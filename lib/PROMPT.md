# Secure Data Processing Pipeline for PCI Compliance

Hey team,

We need to build a secure data processing pipeline for handling PCI-compliant payment card data on AWS. The system must enforce strict encryption at rest and in transit, network isolation, and comprehensive audit logging to meet PCI DSS requirements. The business requires a serverless architecture that can scale automatically while maintaining security controls.

This is a critical security infrastructure for a financial services company. The system needs to validate payment card data as it arrives in S3, trigger security alerts, and maintain detailed audit trails. We need to leverage AWS serverless services while ensuring complete network isolation and encryption throughout the data processing pipeline.

## What we need to build

Create a secure data processing infrastructure using **CloudFormation with JSON** for PCI DSS compliant payment card data validation. The solution must enforce encryption, network isolation, and comprehensive audit logging.

### Core Requirements

1. **Network Infrastructure**
   - VPC with CIDR 10.0.0.0/16 across 3 availability zones in us-east-1
   - Private subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) for Lambda functions
   - No public subnets or internet access (fully isolated network)
   - VPC endpoints for S3 and KMS to enable private connectivity
   - VPC Flow Logs to CloudWatch for network traffic analysis

2. **Data Processing Tier**
   - AWS Lambda function for payment card data validation
   - Function deployed in private subnets with VPC configuration
   - Lambda execution role with least privilege permissions for S3, KMS, and CloudWatch
   - Function triggered by S3 events when new data arrives
   - 1024 MB memory allocation with 60-second timeout

3. **Encryption and Key Management**
   - Customer-managed KMS key for encryption at rest
   - KMS key policy allowing S3, Lambda, CloudWatch Logs access
   - All data encrypted in transit using HTTPS/TLS
   - KMS VPC endpoint for private key access from Lambda

4. **Security Configuration**
   - Security groups with least privilege access:
     - Lambda security group allowing HTTPS (443) to KMS endpoint
     - KMS endpoint security group accepting connections from Lambda
   - IAM roles with scoped permissions for S3, KMS, Parameter Store
   - All sensitive configuration values stored in AWS Systems Manager Parameter Store
   - VPC Flow Logs enabled to CloudWatch with 90-day retention
   - Block all public access to S3 buckets

5. **Storage and Data Management**
   - S3 bucket for PCI data with versioning enabled
   - S3 bucket encryption using customer-managed KMS keys
   - Bucket policies enforcing encrypted uploads and secure transport
   - Lifecycle policy for old versions (90-day deletion)
   - Separate S3 bucket for AWS Config compliance data

6. **Monitoring and Compliance**
   - CloudWatch Log Groups for VPC flow logs with 90-day retention
   - SNS topic for security alerts with KMS encryption
   - AWS Config rules for IAM password policy compliance
   - AWS Config bucket for compliance snapshots
   - Systems Manager Parameter Store for configuration management
   - Comprehensive resource tagging (DataClassification: PCI, ComplianceScope: Payment)

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON format**
- Use **AWS Lambda** for serverless data validation in private subnets
- Use **AWS SNS** for security alert notifications with encryption
- Use **AWS Config** for compliance monitoring and IAM policy checks
- Use **KMS** customer-managed keys for encryption at rest (S3, SNS, CloudWatch Logs)
- Use **VPC Endpoints** (Gateway for S3, Interface for KMS) for private connectivity
- Use **Systems Manager Parameter Store** for configuration management
- Use **S3** for PCI data storage with versioning and KMS encryption
- Use **CloudWatch Logs** for VPC flow logs with 90-day retention
- Use **Security Groups** for network segmentation between Lambda and KMS endpoint
- Deploy to **us-east-1** region across 3 availability zones
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resourceType-v7-suffix`
- Most resources destroyable; KMS key and data buckets use Retain policy for safety

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: Template must accept an environmentSuffix parameter and all named resources must include it for uniqueness
- **KMS Keys**: Use DeletionPolicy: Retain and UpdateReplacePolicy: Retain for data protection
- **S3 Buckets**: Data and Config buckets use DeletionPolicy: Retain to prevent accidental data loss
- **Lambda Functions**: Can be deleted without retention policies
- **VPC Resources**: Can be deleted without retention policies
- **No GuardDuty**: Do not create GuardDuty detector (account-level resource, one per account)
- **No CloudFormation Recorder**: AWS Config recorder is account-level, use only Config Rules

### Constraints

- PCI DSS compliance required - encryption at rest and in transit
- Lambda functions must be in private subnets with VPC configuration
- No public internet access - use VPC endpoints for AWS service connectivity
- All S3 uploads must use KMS encryption
- All S3 access must use secure transport (HTTPS only)
- No NAT Gateways - fully isolated network using VPC endpoints
- All resources must be properly tagged with DataClassification and ComplianceScope
- VPC Flow Logs for network traffic monitoring with 90-day retention
- Lifecycle policies for S3 versioned objects (90-day deletion of old versions)
- KMS key and data buckets use Retain policy to prevent accidental data loss

## Success Criteria

- **Functionality**: Complete serverless data processing pipeline with Lambda, SNS, and Config
- **Network Isolation**: Private subnets with VPC endpoints, no public internet access
- **Reliability**: Multi-AZ deployment across 3 availability zones for Lambda
- **Security**: PCI DSS compliant with encryption at rest/transit, least privilege IAM, security groups, and VPC isolation
- **Resource Naming**: All resources include environmentSuffix (v7) for parallel deployment support
- **Monitoring**: VPC Flow Logs and AWS Config provide visibility into network and compliance status
- **Code Quality**: Well-structured CloudFormation JSON template with proper dependencies and parameters

## What to deliver

- Complete CloudFormation JSON template implementation
- VPC with 3 private subnets across 3 availability zones (no public subnets)
- Private route table with associations for all private subnets
- VPC endpoints (S3 Gateway endpoint, KMS Interface endpoint) for private AWS service access
- AWS Lambda function for data validation with VPC configuration
- Lambda execution role with IAM policies for S3, KMS, and CloudWatch access
- Security groups for Lambda and KMS endpoint with least privilege rules
- SNS topic for security alerts with KMS encryption
- AWS Config rule for IAM password policy compliance
- S3 bucket for PCI data with KMS encryption, versioning, and lifecycle policies
- S3 bucket for AWS Config snapshots with encryption
- Bucket policies enforcing encrypted uploads and secure transport
- KMS customer-managed key with key policy for S3, Lambda, and CloudWatch
- VPC Flow Logs to CloudWatch Logs with 90-day retention and KMS encryption
- IAM roles for VPC Flow Logs and AWS Config
- Systems Manager Parameter Store parameters for bucket name and KMS key ID
- Template parameters for environmentSuffix
- Template outputs for VPC ID, subnet IDs, bucket names, Lambda ARN, SNS topic ARN, and KMS key
- Comprehensive tagging with DataClassification and ComplianceScope
