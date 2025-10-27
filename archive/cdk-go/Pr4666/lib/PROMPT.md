Hey team,

We need to build a HIPAA-compliant data processing infrastructure for a healthcare analytics SaaS platform. I've been asked to create this using Go with AWS CDK. The business requires secure handling of patient data with full compliance controls and proper audit logging.

The platform will process sensitive healthcare data, so we need multiple security layers, encryption everywhere, and complete audit trails. This is mission-critical for our healthcare clients, so reliability and compliance are non-negotiable.

## What we need to build

Create a secure multi-tier data processing pipeline using **AWS CDK with Go** for healthcare analytics SaaS platform with full HIPAA compliance.

### Core Requirements

1. **Secure Data Storage**
   - Four S3 buckets: data ingestion, processed data, access logs, and CloudTrail logs
   - All buckets encrypted with customer-managed KMS keys
   - Versioning enabled on data and processed buckets for integrity
   - Access logging configured for audit trails
   - Lifecycle policies for cost optimization and compliance
   - Block all public access on all buckets
   - SSL/TLS enforcement for all connections

2. **Data Processing Layer**
   - Lambda function using Go with custom runtime (provided.al2023)
   - Deployed in VPC private isolated subnets with no internet access
   - Triggered automatically by S3 events when files uploaded to incoming/ prefix
   - Processes data and stores results in processed bucket
   - Environment variables for bucket configuration

3. **Encryption and Key Management**
   - Three separate customer-managed KMS keys for different services
   - S3 encryption key for all bucket data
   - CloudWatch Logs encryption key for log data
   - CloudTrail encryption key for audit logs
   - Automatic key rotation enabled on all keys
   - Service principals granted specific permissions via resource policies

4. **Network Security**
   - VPC with only private isolated subnets (no public subnets or internet gateway)
   - Two availability zones for high availability
   - No NAT gateway - uses S3 VPC gateway endpoint instead
   - Security group for Lambda with minimal required access
   - Lambda functions have no internet access at all

5. **Audit and Compliance**
   - CloudTrail tracking all API activity with S3 data events
   - Two CloudWatch log groups: Lambda processing logs and CloudTrail logs
   - 6-year log retention (2192 days) meeting HIPAA requirements
   - Log file integrity validation enabled
   - All logs encrypted with dedicated KMS key
   - CloudTrail sends logs to both S3 and CloudWatch

6. **Access Control**
   - IAM role for Lambda with least privilege
   - Specific S3 read permissions on data bucket
   - Specific S3 read/write permissions on processed bucket
   - KMS decrypt/encrypt permissions for S3 key
   - KMS encrypt permission for logs key
   - Explicit CloudWatch Logs write permissions
   - VPC execution role for network interface management
   - No wildcard permissions used

### Technical Requirements

- All infrastructure defined using **AWS CDK with Go** (CDK v2)
- Four **S3 buckets** with encryption, versioning, and lifecycle policies
- **Lambda function** using custom Go runtime (provided.al2023) deployed in VPC private subnets
- Three **KMS keys** with customer-managed encryption and automatic rotation
- **VPC** with private isolated subnets only (no public access)
- **CloudTrail** for audit logging with encryption and log validation
- Two **CloudWatch Log Groups** with encryption and 6-year retention
- **IAM role** following least privilege principles with specific grants
- Resource names must include **environmentSuffix** parameter for uniqueness
- Additional random 4-character suffix for S3 buckets for global uniqueness
- Follow naming convention: `healthcare-{resource-type}-{random/env-suffix}`
- Region-agnostic deployment (works in any AWS region)

### Constraints

- HIPAA compliance mandatory for all resources
- Encryption required at rest and in transit
- No public network access to processing functions
- Audit logging must be enabled for all resource access
- All data must be encrypted with customer-managed KMS keys
- Log retention must meet healthcare compliance requirements (minimum 6 years)
- All resources must be destroyable (RemovalPolicy.DESTROY for synthetic environment)
- No hardcoded sensitive values in code
- Lambda log group name must match function name pattern

### HIPAA Compliance Checklist

- S3 bucket encryption enabled (SSE-KMS with customer-managed keys)
- S3 versioning enabled for data integrity
- Lambda functions in VPC private isolated subnets
- All logs encrypted with KMS
- CloudTrail enabled for audit logging with data events
- CloudTrail log file validation enabled
- Access logging enabled on data and processed S3 buckets
- IAM policies with least privilege (specific grants only)
- Resource tagging for compliance tracking (Compliance=HIPAA, DataClass=PHI)
- Key rotation enabled on all KMS keys
- No public access to any resources (BlockPublicAccess.BLOCK_ALL)
- SSL/TLS enforcement on all S3 buckets
- VPC endpoints for private S3 access

## Success Criteria

- **Functionality**: Complete data processing pipeline with ingestion, processing, and storage
- **Security**: All data encrypted at rest and in transit with KMS customer-managed keys
- **Network Isolation**: Lambda functions deployed in VPC private isolated subnets with no internet access
- **Compliance**: CloudTrail and CloudWatch logging enabled with 6-year retention
- **Access Control**: IAM roles with least privilege, specific resource grants only
- **Audit**: Complete audit trail of all resource access and API calls with CloudTrail data events
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Go code following CDK best practices, comprehensive documentation
- **Destroyability**: All resources can be destroyed cleanly for testing environment

## What to deliver

- Complete AWS CDK Go implementation with proper API signatures
- Four S3 buckets (data, processed, access logs, trail) with encryption and lifecycle policies
- Lambda function using Go custom runtime with VPC configuration and IAM role
- Lambda function code that processes S3 events and stores results
- Three KMS customer-managed keys (S3, Logs, Trail) with rotation enabled
- VPC with private isolated subnets and S3 VPC gateway endpoint
- CloudTrail configuration with encryption, log validation, and S3 data events
- Two CloudWatch log groups with 6-year retention and KMS encryption
- IAM role and policies with least privilege using specific grants
- Resource tagging strategy for HIPAA compliance tracking
- Stack outputs for all key resource identifiers (bucket names, function ARN, VPC ID, trail ARN)
- Integration tests validating deployed resources against compliance requirements
- Documentation explaining HIPAA compliance measures

## Implementation Details

### S3 Buckets
1. **Data Bucket**: Receives incoming healthcare data in incoming/ prefix, triggers Lambda
2. **Processed Bucket**: Stores processed results from Lambda function
3. **Access Logs Bucket**: Stores S3 access logs for data and processed buckets
4. **Trail Bucket**: Stores CloudTrail audit logs

### Lambda Function
- Runtime: provided.al2023 (custom Go runtime)
- Handler: bootstrap
- Memory: 512 MB
- Timeout: 5 minutes
- Deployment: VPC private isolated subnets
- Trigger: S3 ObjectCreated events on data bucket incoming/ prefix
- Processing: Reads from data bucket, writes to processed bucket with KMS encryption

### KMS Keys
1. **S3 Encryption Key**: Encrypts all S3 bucket data, has S3 service principal permissions
2. **Logs Encryption Key**: Encrypts CloudWatch Logs, has CloudWatch Logs service principal permissions
3. **Trail Encryption Key**: Encrypts CloudTrail logs, has CloudTrail service principal permissions

### Naming Pattern
- Environment suffix: Configurable via props, context, or defaults to "dev"
- Random suffix: 4-character random string for S3 global uniqueness
- Pattern: `healthcare-{type}-{random}-{env}` for buckets
- Pattern: `healthcare-{type}-{env}` for other resources
- Log group: `/aws/lambda/healthcare-data-processing-{env}` (matches function name)
