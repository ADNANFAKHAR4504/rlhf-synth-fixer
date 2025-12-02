Hey team,

We need to build a secure data processing pipeline that handles sensitive payment card data for a financial services company. This is a critical PCI-DSS compliance project where we must encrypt everything at rest and in transit, enforce strict access controls, and maintain comprehensive audit logs for all data access attempts.

The infrastructure needs to be rock solid with proper network isolation, no direct internet exposure for sensitive workloads, and all traffic staying within AWS's backbone network where possible. The security and compliance teams have been very specific about the requirements here.

I've been asked to implement this using **CloudFormation with JSON** for maximum compatibility with our existing deployment pipeline and to ensure strict infrastructure-as-code governance.

## What we need to build

Create a secure data processing pipeline using **CloudFormation with JSON** for handling sensitive payment card data in a PCI-DSS compliant environment.

### Core Requirements

1. **Network Infrastructure**
   - VPC with private subnets across 3 availability zones for high availability
   - No public subnets or internet gateways to minimize attack surface
   - VPC endpoints for S3 and KMS to keep traffic within AWS network

2. **Data Processing**
   - Lambda function with 1GB memory deployed in private subnet
   - Function performs data validation on incoming payment card data
   - No direct internet access for Lambda execution environment

3. **Data Storage**
   - S3 bucket with SSE-KMS encryption using customer-managed CMK
   - Bucket must use KMS key, not default S3 encryption
   - Lambda needs read and write permissions to this bucket

4. **Security and Access Control**
   - KMS customer-managed key for encryption operations
   - IAM execution role for Lambda with minimal permissions
   - Security groups allowing only HTTPS traffic between components
   - All security groups must have explicit egress rules with no 0.0.0.0/0 destinations

5. **Audit and Compliance**
   - VPC flow logs with 90-day retention in CloudWatch Logs
   - Flow logs capture all network traffic for security analysis
   - CloudWatch Logs log group for storing flow logs

6. **Infrastructure Protection**
   - Stack-level termination protection enabled in template
   - DeletionPolicy set to Retain for KMS key and S3 bucket
   - Mandatory tags: DataClassification=PCI and ComplianceScope=Payment on all resources

### Optional Enhancements

The following would improve training quality and provide additional security value:

- AWS Config rules for automated compliance monitoring and policy enforcement
- SNS topic for security alerts and notifications to security operations team
- Systems Manager Parameter Store for secure configuration management and secrets

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON** syntax
- Use AWS VPC for network isolation and private subnets for Lambda
- Use AWS Lambda for serverless data processing
- Use AWS S3 with SSE-KMS for encrypted data storage
- Use AWS KMS for customer-managed encryption key
- Use AWS CloudWatch for logging and monitoring with 90-day retention
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- All resources must be tagged with DataClassification and ComplianceScope

### Deployment Requirements (CRITICAL)

- **EnvironmentSuffix**: All named resources must use the EnvironmentSuffix parameter to ensure unique resource names across parallel deployments
- **Destroyability**: Resources must be removable after testing, but KMS key and S3 bucket should have DeletionPolicy: Retain for data protection
- **No GuardDuty Detector**: Do not create GuardDuty detectors as they are account-level resources (one per account) and may already exist
- **AWS Config IAM Policy**: If implementing Config, use the correct managed policy: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
- **Lambda Runtime**: Use Node.js 16.x or specify compatible runtime for Lambda functions
- **Security Groups**: All security groups must have explicit egress rules, no wildcard 0.0.0.0/0 egress rules

### Constraints

- All S3 buckets must use SSE-KMS encryption with customer-managed keys (no default S3 encryption)
- Lambda functions must run in private subnets with no direct internet access
- All IAM roles must follow least privilege principle with no wildcard actions on resources
- VPC flow logs must be enabled and stored for minimum 90 days
- All security groups must have explicit egress rules with no 0.0.0.0/0 destinations
- CloudFormation stack must have termination protection enabled via StackPolicy or metadata
- All resources must be tagged with DataClassification=PCI and ComplianceScope=Payment tags
- Region constraint: us-east-1 only

## Success Criteria

- **Functionality**: Lambda can process data from S3 with KMS encryption/decryption
- **Network Security**: All Lambda functions isolated in private subnets with VPC endpoints
- **Data Security**: All data encrypted at rest with customer-managed KMS keys
- **Access Control**: IAM roles follow least privilege with specific resource ARNs
- **Audit Trail**: VPC flow logs capturing all network traffic with 90-day retention
- **Compliance**: All resources properly tagged for PCI-DSS compliance tracking
- **Resource Naming**: All resources include EnvironmentSuffix parameter
- **Code Quality**: Valid CloudFormation JSON, well-documented, follows AWS best practices

## What to deliver

- Complete CloudFormation JSON template implementation
- VPC with 3 private subnets across availability zones
- Lambda function for data validation
- S3 bucket with SSE-KMS encryption
- KMS customer-managed key
- IAM roles with least privilege permissions
- VPC endpoints for S3 and KMS
- Security groups with explicit rules
- CloudWatch Logs for VPC flow logs
- VPC flow logs configuration
- Optional: AWS Config rules, SNS topic, SSM parameters
- Unit tests for template validation
- Documentation and deployment instructions
