Hey team,

We need to build a HIPAA-compliant data processing infrastructure for a healthcare analytics SaaS platform. I've been asked to create this using Go with AWS CDK. The business requires secure handling of patient data with full compliance controls and proper audit logging.

The platform will process sensitive healthcare data, so we need multiple security layers, encryption everywhere, and complete audit trails. This is mission-critical for our healthcare clients, so reliability and compliance are non-negotiable.

## What we need to build

Create a secure multi-tier data processing pipeline using **AWS CDK with Go** for healthcare analytics SaaS platform with full HIPAA compliance.

### Core Requirements

1. **Secure Data Ingestion**
   - S3 buckets with server-side encryption for incoming patient data
   - Versioning enabled to track all data modifications
   - MFA delete protection for compliance requirements
   - Lifecycle policies for data retention compliance

2. **Data Processing Layer**
   - Lambda functions for processing healthcare data
   - VPC isolation for all processing functions
   - Private subnet deployment with no internet access
   - Encrypted environment variables for sensitive configuration

3. **Encryption and Key Management**
   - KMS customer-managed keys for all data encryption
   - Separate keys for different data sensitivity levels
   - Key rotation policies enabled
   - Strict key usage policies with least privilege access

4. **Network Security**
   - VPC with private subnets for Lambda isolation
   - No public subnets or internet gateways
   - VPC endpoints for S3 access (no NAT gateway needed)
   - Security groups with minimal required access

5. **Audit and Compliance**
   - CloudTrail for all API activity tracking
   - CloudWatch log groups with encryption enabled
   - Log retention policies meeting HIPAA requirements (at least 6 years)
   - All logs encrypted with KMS

6. **Access Control**
   - IAM roles with least privilege principles
   - Service-specific IAM policies (no wildcards)
   - Resource-based policies on S3 and KMS
   - Role separation between data ingestion and processing

### Technical Requirements

- All infrastructure defined using **AWS CDK with Go**
- Use **S3 buckets** with encryption, versioning, and bucket policies
- **Lambda functions** deployed in VPC private subnets
- **KMS keys** with customer-managed encryption
- **VPC** with private subnets only (no public access)
- **CloudTrail** for audit logging with encryption
- **CloudWatch Logs** with encryption and retention policies
- **IAM roles** following least privilege principles
- Resource names must include a **string suffix** for uniqueness
- Follow naming convention: `healthcare-resource-type-suffix`
- Deploy to **eu-central-2** region

### Constraints

- HIPAA compliance mandatory for all resources
- Encryption required at rest and in transit
- No public network access to processing functions
- Audit logging must be enabled for all resource access
- All data must be encrypted with customer-managed KMS keys
- Log retention must meet healthcare compliance requirements (minimum 6 years)
- All resources must be destroyable (no Retain policies for synthetic environment)
- MFA delete enabled on S3 buckets for compliance
- No hardcoded sensitive values in code

### HIPAA Compliance Checklist

- S3 bucket encryption enabled (SSE-KMS with customer-managed keys)
- S3 versioning enabled for data integrity
- S3 MFA delete enabled for critical buckets
- Lambda functions in VPC private subnets
- All logs encrypted with KMS
- CloudTrail enabled for audit logging
- Access logging enabled on S3 buckets
- IAM policies with least privilege
- Resource tagging for compliance tracking
- Key rotation enabled on KMS keys
- No public access to any resources

## Success Criteria

- **Functionality**: Complete data processing pipeline with ingestion, processing, and storage
- **Security**: All data encrypted at rest and in transit with KMS customer-managed keys
- **Network Isolation**: Lambda functions deployed in VPC private subnets with no internet access
- **Compliance**: CloudTrail and CloudWatch logging enabled with proper retention
- **Access Control**: IAM roles with least privilege, no wildcard permissions
- **Audit**: Complete audit trail of all resource access and API calls
- **Resource Naming**: All resources include string suffix for uniqueness
- **Code Quality**: Go code following CDK best practices, well-documented
- **Destroyability**: All resources can be destroyed cleanly for testing environment

## What to deliver

- Complete AWS CDK Go implementation
- S3 buckets with encryption, versioning, and lifecycle policies
- Lambda functions with VPC configuration and IAM roles
- KMS customer-managed keys with rotation enabled
- VPC with private subnets and VPC endpoints
- CloudTrail configuration with encryption
- CloudWatch log groups with retention policies
- IAM roles and policies with least privilege
- Resource tagging strategy for compliance
- Documentation explaining HIPAA compliance measures
- Unit tests for infrastructure validation
