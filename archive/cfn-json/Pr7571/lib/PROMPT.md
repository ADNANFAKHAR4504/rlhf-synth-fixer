# Secure Payment Processing Infrastructure

Hey team,

We need to build a PCI-DSS compliant payment processing infrastructure for a financial services client. This is mission-critical - we're handling payment card data, so everything needs to be encrypted at rest and in transit, with strict access controls and comprehensive audit logging for regulatory compliance.

I've been asked to create this using **CloudFormation with JSON**. The business requirements are clear: all data must be encrypted, no data can traverse the public internet, and we need detailed audit trails for every action. This is a multi-AZ deployment in us-east-1 that needs to meet the strictest security standards.

The architecture involves processing encrypted payment files from S3 using Lambda functions that run in isolated private subnets. All transaction data gets stored in DynamoDB with point-in-time recovery. Everything communicates through VPC endpoints to avoid internet routing, and we're using customer-managed KMS keys for all encryption.

## What we need to build

Create a secure payment card data processing infrastructure using **CloudFormation with JSON** for PCI-DSS compliance.

### Core Requirements

1. **Encryption and Key Management**
   - Create KMS key with automatic rotation enabled for encrypting all resources
   - All encryption must use customer-managed keys (no AWS-managed keys)
   - KMS key must be used for S3, DynamoDB, Lambda environment variables, and CloudWatch Logs

2. **Compute Layer**
   - Deploy Lambda function in private subnets for processing encrypted payment files
   - Lambda must have no direct internet access
   - Environment variables encrypted with KMS
   - CloudWatch Logs encryption enabled with 30-day retention

3. **Data Storage**
   - S3 bucket with SSE-KMS encryption, versioning, and block all public access
   - Bucket policies that deny unencrypted uploads and enforce HTTPS only
   - DynamoDB table with encryption at rest using KMS key
   - Point-in-time recovery enabled on DynamoDB table

4. **Network Security**
   - VPC with private subnets across 3 availability zones
   - VPC endpoints for S3 and DynamoDB to avoid internet routing
   - NAT instances or NAT Gateway for controlled outbound traffic
   - No resources in public subnets except NAT

5. **Access Control**
   - IAM roles with minimal permissions following least privilege principle
   - No wildcard permissions in IAM policies
   - Separate roles for Lambda execution, S3 access, and DynamoDB access

6. **Audit and Compliance**
   - CloudTrail logging to a separate encrypted S3 bucket
   - All S3 buckets must use SSE-KMS with customer-managed keys
   - Comprehensive logging of all API calls and data access

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Multi-AZ deployment for high availability
- All resources must be destroyable (no Retain deletion policies)

### Deployment Requirements (CRITICAL)

- All resources MUST include environmentSuffix in their names for multi-deployment support
- Resource naming format: `payment-processing-{resource}-{environmentSuffix}`
- All resources MUST use RemovalPolicy: Delete or DeletionPolicy: Delete
- FORBIDDEN: Any Retain policies that prevent stack deletion
- NAT Gateway note: Use NAT instances if cost is a concern, but NAT Gateways are preferred for production

### Constraints

- All S3 buckets must use SSE-KMS encryption with customer-managed keys
- Lambda functions must run in private subnets with no direct internet access
- DynamoDB tables must have point-in-time recovery enabled
- All IAM roles must follow least privilege with no wildcard permissions
- CloudWatch Logs must have encryption enabled using KMS
- VPC endpoints must be used for all AWS service communications
- No data can traverse public internet
- All resources must support clean teardown for testing

## Success Criteria

- **Functionality**: Lambda can read from S3, write to DynamoDB, all through VPC endpoints
- **Performance**: Multi-AZ deployment with low-latency VPC endpoints
- **Reliability**: Point-in-time recovery enabled, versioning on S3
- **Security**: All data encrypted at rest and in transit, no public access, comprehensive audit logs
- **Compliance**: Meets PCI-DSS requirements for encryption, access control, and audit logging
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean JSON CloudFormation template, well-documented, ready for production

## What to deliver

- Complete CloudFormation JSON template
- KMS key with automatic rotation
- Lambda function code in Python for payment processing
- S3 bucket with encryption and strict access policies
- DynamoDB table with encryption and PITR
- VPC with private subnets across 3 AZs
- VPC endpoints for S3 and DynamoDB
- NAT Gateway or NAT instances for outbound access
- IAM roles and policies with least privilege
- CloudWatch Logs configuration with encryption
- CloudTrail with encrypted logging bucket
- Deployment instructions and architecture documentation
