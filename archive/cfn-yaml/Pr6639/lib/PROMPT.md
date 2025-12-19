# Secure Financial Transaction Processing Pipeline

Hey team,

We're building a secure data processing pipeline for a financial services company that needs to handle customer transaction analysis. The compliance team has been breathing down our necks about encryption requirements and audit logging, so this needs to be done right. I've been asked to create this using **CloudFormation with YAML** to match our standard deployment practices.

The business problem is pretty straightforward - we're ingesting financial transaction data, processing it through serverless functions, and storing metadata for compliance reporting. But the security requirements are strict: everything needs to be encrypted at rest and in transit, we need comprehensive audit trails, and the access controls have to follow least-privilege principles to the letter.

What makes this interesting is that we can't just throw together a basic pipeline. The compliance team requires specific controls like customer-managed KMS keys, VPC endpoints to avoid internet traffic, CloudTrail data event logging with file validation, and we need to make sure nothing gets accidentally deleted by setting retention policies on critical resources.

## What we need to build

Create a secure serverless data processing pipeline using **CloudFormation with YAML** for financial transaction analysis. This infrastructure will handle sensitive customer data with strict security and compliance requirements.

### Core Requirements

1. **Data Storage with Encryption**
   - S3 bucket with SSE-KMS encryption using customer-managed CMK
   - Enable bucket versioning for data integrity
   - Configure lifecycle policy to transition objects to Infrequent Access after 30 days
   - Apply DeletionPolicy: Retain to prevent accidental data loss

2. **Serverless Processing**
   - Lambda function to process files uploaded to S3
   - Store Lambda environment variables in Secrets Manager
   - Configure CloudWatch Logs with 90-day retention
   - Implement error handling and structured logging

3. **Metadata Storage**
   - DynamoDB table for transaction metadata
   - Enable point-in-time recovery for disaster recovery
   - Apply DeletionPolicy: Retain

4. **Network Security**
   - VPC with private subnets across 2 availability zones
   - VPC endpoints for S3 and DynamoDB to avoid internet traffic
   - No internet gateways or NAT gateways (private-only architecture)

5. **Access Control**
   - IAM role for Lambda with least-privilege permissions
   - Specific permissions for S3 GetObject/PutObject
   - Specific permissions for DynamoDB read/write operations
   - No wildcard permissions on actions

6. **Audit and Compliance**
   - CloudTrail to log S3 data events
   - Enable CloudTrail log file validation
   - Store CloudTrail logs in separate S3 bucket
   - Apply DeletionPolicy: Retain to audit logs

7. **Encryption Keys**
   - Customer-managed KMS key for S3 encryption
   - Key policy allowing CloudTrail and Lambda to use the key
   - Enable automatic key rotation

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **S3** for encrypted data storage with versioning
- Use **Lambda** for serverless file processing
- Use **DynamoDB** for transaction metadata
- Use **KMS** for customer-managed encryption keys
- Use **Secrets Manager** for sensitive Lambda configuration
- Use **CloudTrail** for audit logging with log file validation
- Use **VPC** with private subnets and VPC endpoints
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must use DeletionPolicy: Retain except CloudWatch Log Groups

### Constraints

- All S3 buckets must have versioning enabled and use SSE-KMS encryption with customer-managed keys
- Lambda functions must use environment variables stored in Secrets Manager for sensitive configuration
- All IAM roles must follow least-privilege principles with no wildcard permissions on actions
- VPC endpoints must be used for S3 and DynamoDB to avoid internet-based traffic
- CloudTrail must be configured to log all data events for the S3 buckets with log file validation enabled
- All resources must have DeletionPolicy set to Retain except for CloudWatch Log Groups
- No public internet access - private VPC architecture only

## Success Criteria

- **Functionality**: S3 bucket accepts uploads, Lambda processes files, metadata stored in DynamoDB
- **Security**: All data encrypted with customer-managed KMS keys, no internet traffic, least-privilege IAM
- **Compliance**: CloudTrail logging enabled with validation, point-in-time recovery on DynamoDB
- **Reliability**: Multi-AZ deployment, versioning enabled, lifecycle policies configured
- **Resource Naming**: All resources include environmentSuffix parameter
- **Data Protection**: DeletionPolicy: Retain on all critical resources (S3, DynamoDB, KMS, CloudTrail)
- **Code Quality**: Clean YAML, well-documented, follows CloudFormation best practices

## What to deliver

- Complete CloudFormation YAML template implementation
- S3 bucket with SSE-KMS encryption and lifecycle policies
- Lambda function with Secrets Manager integration
- DynamoDB table with point-in-time recovery
- VPC with private subnets and VPC endpoints for S3 and DynamoDB
- IAM roles with least-privilege permissions
- CloudTrail with S3 data event logging and log file validation
- KMS customer-managed key with automatic rotation
- CloudWatch Logs configuration
- All resources properly configured with DeletionPolicy
- Documentation and deployment instructions
