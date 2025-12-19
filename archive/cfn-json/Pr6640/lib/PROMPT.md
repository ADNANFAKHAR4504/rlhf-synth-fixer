Hey team,

We've got a critical project for a healthcare technology company that needs to implement secure data processing infrastructure for handling patient records. They're dealing with HIPAA compliance requirements and need everything encrypted at rest and in transit. The system will process sensitive patient data, so we need to be really careful about access controls and audit logging.

The business wants this deployed in us-east-2 and they've asked us to build it using **CloudFormation with JSON**. They're particular about this because their ops team has standardized on CloudFormation templates in JSON format for their healthcare workloads. The infrastructure needs to handle patient record uploads to S3, process them securely through Lambda functions, and maintain comprehensive audit trails for compliance audits.

The interesting challenge here is the level of security hardening required. We're not just talking about basic encryption - they need MFA delete protection on buckets, explicit denials for unencrypted uploads, KMS encryption for Lambda environment variables, and strict least-privilege IAM roles with no wildcard permissions. Plus, everything needs to be tagged for compliance tracking and have retention policies that meet their 90-day audit requirements.

## What we need to build

Create a secure patient data processing system using **CloudFormation with JSON** that handles HIPAA-compliant healthcare data with encrypted storage, secure compute, and comprehensive audit logging.

### Core Requirements

1. **Encrypted Storage Infrastructure**
   - Create S3 bucket with AES-256 server-side encryption
   - Enable versioning for data integrity
   - Configure MFA delete protection for added security
   - Implement bucket policies that explicitly deny unencrypted object uploads
   - Require SSL/TLS for all bucket requests
   - Configure S3 event notifications to trigger Lambda on new object creation

2. **Secure Compute Layer**
   - Deploy Lambda function with 1024MB memory for patient record processing
   - Use reserved concurrent executions to prevent resource exhaustion
   - Encrypt Lambda environment variables containing database credentials using KMS
   - Implement strict IAM execution role with no wildcard permissions
   - Configure least-privilege access to S3 and CloudWatch Logs

3. **Encryption and Key Management**
   - Create customer-managed KMS key for encrypting Lambda environment variables
   - Configure key policies with appropriate permissions
   - Enable key rotation for enhanced security

4. **Audit and Logging**
   - Set up CloudWatch Logs group for Lambda function logs
   - Configure 90-day retention period for compliance requirements
   - Tag all resources for compliance tracking

5. **IAM Security Hardening**
   - Create IAM roles with least-privilege permissions
   - No wildcard permissions allowed in any policy
   - Include external ID requirement for cross-account access scenarios
   - Implement explicit allow/deny policies

6. **Data Protection and Compliance**
   - Set DeletionPolicy to Retain for all stateful resources (S3, CloudWatch Logs)
   - Add resource tags: Environment, DataClassification, ComplianceScope
   - Ensure all data encryption at rest and in transit

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **S3** for encrypted patient record storage with versioning and MFA delete
- Use **Lambda** with 1024MB memory for secure data processing
- Use **KMS** for customer-managed encryption keys
- Use **CloudWatch Logs** with 90-day retention for audit trails
- Use **IAM** for least-privilege roles with external ID support
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-2** region

### Constraints

- All S3 buckets must use AES-256 server-side encryption with S3-managed keys
- S3 bucket policies must explicitly deny unencrypted uploads (require aws:SecureTransport)
- S3 buckets must have versioning enabled and MFA delete protection configured
- Lambda functions must have execution roles with no wildcard permissions
- Lambda environment variables containing sensitive data must use KMS encryption
- Lambda functions must use reserved concurrent executions
- All CloudWatch Logs groups must have 90-day retention for compliance
- All IAM roles must include external ID for cross-account access scenarios
- All resources must have DeletionPolicy set to Retain for production data protection
- All resources must be destroyable (no permanent retention where not required)
- Include proper error handling and logging
- VPC endpoints for S3 access recommended to avoid internet transit

## Success Criteria

- **Functionality**: S3 bucket stores encrypted patient data with versioning, Lambda processes new uploads securely, CloudWatch captures all logs
- **Performance**: Lambda configured with 1024MB memory and reserved concurrency for reliable processing
- **Reliability**: MFA delete protection prevents accidental data loss, versioning enables data recovery
- **Security**: All data encrypted at rest and in transit, no wildcard IAM permissions, explicit deny for unencrypted uploads, KMS encryption for sensitive environment variables
- **Compliance**: 90-day log retention, comprehensive resource tagging, audit trails for all access
- **Resource Naming**: All resources include environmentSuffix for multi-environment deployments
- **Code Quality**: Clean JSON syntax, well-structured, properly documented

## What to deliver

- Complete CloudFormation JSON template implementation
- S3 bucket with encryption, versioning, MFA delete, and secure bucket policies
- Lambda function with KMS-encrypted environment variables and least-privilege IAM role
- KMS customer-managed key with appropriate key policies
- CloudWatch Logs group with 90-day retention
- IAM roles with no wildcards and external ID support
- S3 event notifications configured for Lambda triggers
- Stack outputs for S3 bucket ARN, Lambda function ARN, and KMS key ID
- Resource tags for compliance tracking
- DeletionPolicy configured appropriately for all resources
- Documentation with deployment instructions
