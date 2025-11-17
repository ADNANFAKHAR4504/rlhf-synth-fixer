# Secure Cloud Infrastructure with Aurora PostgreSQL

Hey team,

We need to build a secure and compliant cloud infrastructure for our Test Automation Platform (TAP). The focus is on implementing security best practices, encryption at rest and in transit, comprehensive monitoring, and compliance tracking.

I've been asked to implement this using **CDKTF (Cloud Development Kit for Terraform) with Python**. We need a production-grade infrastructure in us-east-1 with proper security controls, monitoring, and a highly available Aurora PostgreSQL 16.9 database cluster.

The immediate priority is getting the core infrastructure automated with proper security controls, encryption, and monitoring. We can iterate on advanced features in future phases.

## What we need to build

Create a secure cloud infrastructure using **CDKTF with Python** in AWS us-east-1 region for the Test Automation Platform.

### Core Requirements

1. **Database Tier - Aurora PostgreSQL 16.9**
   - Aurora PostgreSQL cluster with version 16.9
   - Multi-AZ deployment for high availability
   - Custom cluster and DB parameter groups
   - Enhanced monitoring enabled (60-second intervals)
   - Performance Insights enabled (7-day retention)
   - CloudWatch logs exports enabled for PostgreSQL
   - Automated backups with 7-day retention
   - Storage encryption enabled
   - Master password stored in AWS Secrets Manager
   - VPC deployment with private subnets
   - SSL/TLS enforced for connections

2. **Compute Tier - Lambda Functions**
   - Lambda function for data processing
   - VPC integration with private subnets
   - IAM execution role with least privilege
   - Environment variables for bucket and KMS key
   - Python 3.11 runtime
   - Security group with egress rules only

3. **Object Storage - S3 Buckets**
   - Secure data bucket with KMS encryption
   - S3 access logs bucket for audit trails
   - Versioning enabled on all buckets
   - Bucket policies enforcing encryption
   - MFA required for object deletion
   - Server-side encryption with KMS

4. **Security - KMS and IAM**
   - KMS key for encryption with automatic rotation
   - KMS key policy for CloudWatch Logs access
   - IAM roles for Lambda execution
   - IAM role for RDS Enhanced Monitoring
   - IAM role for AWS Config
   - Security groups for Lambda and Aurora
   - Region restriction policies (us-east-1 only)

5. **Monitoring - CloudWatch and AWS Config**
   - CloudWatch Log Groups with KMS encryption (90-day retention)
   - Metric filters for security events:
     - Unauthorized API calls
     - Root account usage
     - Security group changes
   - CloudWatch alarms for security metrics
   - SNS topic for alarm notifications
   - AWS Config for compliance tracking
   - Config rules for encryption validation
   - EventBridge rules for GuardDuty/Security Hub events

6. **Networking - VPC**
   - VPC with DNS support and hostnames enabled
   - Private subnets across multiple availability zones
   - DB subnet group for Aurora
   - VPC Flow Logs to S3
   - Security groups with minimal access

7. **Secrets Management**
   - AWS Secrets Manager for database credentials
   - Random password generation via Terraform
   - Secret recovery window configured

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use Construct pattern to organize infrastructure modules
- Primary region: us-east-1
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Organize code into separate modules: networking, security, data_processing, monitoring
- S3 backend for Terraform state with encryption and locking

### AWS Services Required

- Amazon Aurora PostgreSQL 16.9
- AWS Lambda
- Amazon S3
- AWS KMS
- AWS IAM
- Amazon VPC
- Amazon CloudWatch
- Amazon SNS
- AWS Config
- Amazon EventBridge
- AWS Secrets Manager

### Constraints

- Primary region must be us-east-1
- All resources must be destroyable (no Retain policies or deletion protection)
- All S3 buckets must have versioning and KMS encryption enabled
- CloudWatch logs must be encrypted with KMS
- Lambda functions must run in VPC
- Aurora must be in private subnets only (not publicly accessible)
- IAM policies must include region restrictions where applicable
- All resources should have Name tags with environment suffix

## Success Criteria

- Functionality: Complete secure infrastructure with all components deployed in us-east-1
- Database: Aurora PostgreSQL 16.9 cluster with custom parameter groups and enhanced monitoring
- Security: All data encrypted at rest with KMS, SSL/TLS enforced
- Monitoring: CloudWatch alarms, metric filters, and AWS Config rules operational
- Compliance: VPC Flow Logs, access logs, and security event tracking enabled
- IAM: Least privilege roles for Lambda, RDS monitoring, and AWS Config
- Resource Naming: All resources include environmentSuffix for deployment isolation
- Code Quality: Python code organized with Construct pattern, well-structured modules
- Testing: Unit tests achieving >90% coverage (90+ test cases)
- Integration Tests: Comprehensive validation of deployed infrastructure

## What to deliver

- Complete CDKTF Python program organized with modular Construct pattern
- Main stack file (tap_stack.py) with:
  - Aurora PostgreSQL 16.9 cluster and instance
  - VPC with subnets and DB subnet group
  - Security groups for Aurora and Lambda
  - IAM roles for RDS monitoring
  - Parameter groups (cluster and DB)
  - Secrets Manager integration
  - S3 backend configuration
  - Tagging strategy

- Networking module (networking.py) with:
  - VPC with DNS support
  - Private subnets across multiple AZs
  - VPC Flow Logs to S3
  - S3 bucket for flow logs

- Security module (security.py) with:
  - KMS key with rotation enabled
  - KMS key policy for CloudWatch
  - IAM roles for Lambda
  - IAM policies with region restrictions
  - Security groups for Lambda

- Data processing module (data_processing.py) with:
  - S3 data bucket with KMS encryption
  - S3 access logs bucket
  - Bucket versioning configuration
  - Bucket policies enforcing encryption
  - Lambda function for data processing
  - Lambda deployment package
  - Secrets Manager data source

- Monitoring module (monitoring.py) with:
  - CloudWatch Log Groups with KMS encryption
  - Metric filters for security events
  - CloudWatch alarms for unauthorized access
  - SNS topic for notifications
  - AWS Config recorder and delivery channel
  - Config rules for compliance
  - EventBridge rules for security events

- Lambda function code (lambda/data_processor.py) with:
  - S3 data processing logic
  - Error handling
  - Environment variable usage

- Unit tests achieving >90% coverage (90+ tests)
- Integration tests validating deployed infrastructure (9+ tests)
