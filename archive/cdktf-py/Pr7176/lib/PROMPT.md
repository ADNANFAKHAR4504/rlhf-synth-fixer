Hey team,

We need to build a secure data processing environment for a financial services company that handles sensitive customer information. The business is very concerned about security and compliance, especially around encryption and audit trails. I've been asked to create this infrastructure in Python using CDKTF, which will let us define everything as code while maintaining strict security boundaries.

The regulatory requirements are pretty strict here - we need encryption at rest and in transit, automated key rotation, and comprehensive audit trails. The security team has emphasized defense-in-depth principles, so we're implementing multiple layers of security controls. This infrastructure will process sensitive financial data, so there's no room for shortcuts on security.

The architecture needs to be completely private - no public subnets, no internet gateways, nothing exposed to the internet. All AWS service communication will go through VPC endpoints to keep traffic within the AWS network. We're using Lambda for data processing because it gives us the isolation and security we need, plus it scales automatically with the workload.

## What we need to build

Create a secure data processing pipeline using **CDKTF with Python** for handling sensitive financial customer data in a completely private network environment.

### Core Requirements

1. **Network Infrastructure**
   - Create VPC with 2 private subnets across different availability zones
   - No public subnets or NAT gateways - completely isolated network
   - Deploy VPC endpoints for S3 and Secrets Manager with private DNS enabled
   - All AWS service communication must stay within AWS network backbone

2. **Data Processing**
   - Deploy Lambda function that reads from and writes to S3
   - Lambda must use customer-managed KMS key for CloudWatch log encryption
   - Enable CloudWatch Logs with KMS encryption using same key as Lambda
   - Lambda runtime environment must be isolated within VPC

3. **Storage and Encryption**
   - Configure S3 bucket with versioning enabled
   - Implement SSE-S3 encryption with bucket key enabled
   - Store database credentials in Secrets Manager
   - Disable automatic rotation for Secrets Manager (manual rotation only)
   - Use customer-managed KMS keys with automatic rotation enabled

4. **Security Controls**
   - Implement IAM roles with separate policies for Lambda execution and S3 access
   - Follow least-privilege principle with no inline policies
   - Configure security groups allowing only HTTPS traffic between Lambda and VPC endpoints
   - All security group rules must explicitly define sources without using 0.0.0.0/0
   - Tag all resources with Environment=secure and DataClassification=sensitive

5. **Observability**
   - Implement stack outputs for Lambda function ARN and S3 bucket name
   - Enable CloudWatch Logs for Lambda with encryption

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS Lambda for serverless data processing
- Use Amazon S3 for encrypted object storage
- Use AWS KMS for encryption key management
- Use AWS Secrets Manager for credential storage
- Use Amazon VPC for network isolation
- Use VPC Endpoints for S3 and Secrets Manager
- Use IAM for access control
- Use CloudWatch Logs for monitoring
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: resource-type-environment-suffix
- Deploy to **eu-central-1** region
- Python 3.9 or higher runtime for Lambda
- CDKTF 0.19 or higher
- Terraform 1.5 or higher

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter in their names for uniqueness
- All resources must be **destroyable** - no RETAIN removal policies allowed
- S3 buckets must use DESTROY removal policy for clean teardown
- KMS keys must use DESTROY removal policy
- CloudWatch log groups must use DESTROY removal policy
- All resources must be fully automated for creation and deletion

### Optional Enhancements

- Add AWS Config rules to monitor security compliance
- Add SNS topic with KMS encryption for security alerts
- Note: GuardDuty should be enabled manually at the account level - do not create GuardDuty detector in code as only one detector is allowed per account

### Constraints

- All S3 buckets must have versioning enabled and use SSE-S3 encryption with bucket keys
- No public subnets or internet gateways allowed
- Lambda functions must use customer-managed KMS keys with automatic rotation enabled
- VPC endpoints must be used for all AWS service communications to avoid internet exposure
- IAM roles must follow least-privilege principle with no inline policies allowed
- All security group rules must explicitly define source IPs without using 0.0.0.0/0
- All data must remain encrypted at rest and in transit
- All resources must support automated deployment and teardown

## Success Criteria

- Functionality: Lambda can successfully read from and write to S3 through VPC endpoint
- Security: All traffic remains private, no internet exposure
- Encryption: All data encrypted at rest with KMS, in transit with TLS
- Compliance: All resources properly tagged with Environment and DataClassification
- Resource Naming: All resources include environmentSuffix for deployment isolation
- Code Quality: Well-structured Python code, follows CDKTF patterns, includes proper error handling
- Destroyability: All resources can be cleanly destroyed without manual intervention

## What to deliver

- Complete CDKTF Python implementation with proper project structure
- VPC with private subnets, security groups, and VPC endpoints
- Lambda function with KMS-encrypted CloudWatch logs
- S3 bucket with versioning and SSE-S3 encryption
- KMS keys with automatic rotation
- IAM roles and policies following least-privilege
- Secrets Manager secret for database credentials
- Stack outputs for Lambda ARN and S3 bucket name
- Comprehensive tagging for all resources
- Documentation covering deployment and testing procedures