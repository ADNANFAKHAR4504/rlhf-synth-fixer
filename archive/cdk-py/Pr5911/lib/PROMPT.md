# Secure Financial Data Infrastructure

Hey team,

We need to build a secure infrastructure stack for handling sensitive financial data. A financial services company has asked us to implement strict security controls that meet PCI-DSS compliance requirements. They need automated compliance checking and remediation capabilities to ensure their AWS infrastructure hosting customer data meets all necessary regulatory standards.

The security team is particularly concerned about enforcing encryption at all layers, implementing proper access controls, and maintaining comprehensive audit logging across all resources. They want infrastructure that enforces these security controls automatically rather than relying on manual configuration.

This needs to be implemented using **AWS CDK with Python** for their production environment in us-east-1. The business wants everything encrypted at rest and in transit, with automated monitoring and alerting for any security violations.

## What we need to build

Create a secure infrastructure stack using **AWS CDK with Python** for handling sensitive financial data with automated compliance checking.

### Core Requirements

1. **Encryption and Key Management**
   - Create a KMS key with strict key policies allowing only specific IAM roles to encrypt/decrypt
   - All S3 buckets must use AES-256 encryption with the customer-managed KMS key
   - Lambda environment variables containing secrets must use KMS encryption

2. **Secure Storage**
   - Deploy an S3 bucket with versioning enabled for data retention
   - Configure lifecycle rules to transition old versions to Glacier after 30 days
   - Configure bucket policies that deny all requests not using HTTPS
   - Block all public access to the bucket
   - Create a separate S3 bucket for VPC flow logs with encryption

3. **Serverless Processing**
   - Create a Lambda function that scans S3 objects for PII using regex patterns
   - Deploy the Lambda in a VPC with private subnets
   - Configure VPC endpoints for S3 and KMS access to keep traffic off public internet

4. **API Access Layer**
   - Set up an API Gateway REST API with API key requirement
   - Enable request validation for API Gateway
   - Configure the API to trigger the Lambda function

5. **Network Security**
   - Deploy infrastructure in a VPC with private subnets
   - Create security groups that allow only HTTPS traffic (port 443)
   - Enable VPC flow logs and direct them to the separate S3 bucket

6. **Monitoring and Logging**
   - Configure CloudWatch Log groups for Lambda with 90-day retention
   - Configure CloudWatch Log groups for API Gateway with 90-day retention
   - Add CloudWatch alarms for detecting unauthorized access attempts
   - Add CloudWatch alarms for policy violations

7. **Access Control**
   - Set up IAM roles with minimal required permissions following the principle of least privilege
   - No wildcard permissions in IAM policies
   - KMS key policies must restrict access to specific IAM roles only

8. **Integration Outputs**
   - Output the API endpoint URL for integration
   - Output the API key ID for client configuration
   - Output the S3 bucket name for data operations

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use KMS for encryption key management across all services
- Use S3 for secure storage with versioning and lifecycle policies
- Use Lambda for PII scanning and compliance checking
- Use API Gateway REST API for secure API access
- Use VPC with private subnets for network isolation
- Use VPC endpoints to avoid public internet traffic
- Use CloudWatch Logs for comprehensive audit trails
- Deploy to us-east-1 region
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix

### Constraints

- All S3 buckets must use AES-256 encryption with customer-managed KMS keys
- IAM roles must follow least-privilege principle with no wildcard permissions
- Security groups must explicitly deny all traffic except required ports (443)
- CloudWatch Logs must retain audit logs for exactly 90 days
- Lambda functions must use VPC endpoints for AWS service calls
- All API Gateway endpoints must require API keys and use request validation
- KMS key policies must restrict access to specific IAM roles only
- S3 bucket policies must block public access and enforce HTTPS
- Lambda environment variables containing secrets must use KMS encryption
- VPC flow logs must be enabled and sent to a centralized S3 bucket
- All resources must be destroyable for CI/CD workflows (no Retain policies)
- Multi-AZ deployment across at least 2 availability zones

## Success Criteria

- Functionality: All components deployed and operational with Lambda successfully scanning for PII
- Performance: Lambda executes within reasonable time limits with proper timeout configuration
- Reliability: Multi-AZ deployment ensures high availability for VPC resources
- Security: All data encrypted at rest and in transit, least-privilege IAM policies enforced
- Compliance: PCI-DSS requirements met including encryption, access control, and audit logging
- Resource Naming: All resources include environmentSuffix for multi-environment support
- Monitoring: CloudWatch alarms configured for security violations and unauthorized access
- Code Quality: Clean Python code, well-tested, properly documented

## What to deliver

- Complete AWS CDK Python implementation in lib/tap_stack.py
- KMS key with appropriate key policies for encryption
- S3 bucket for data storage with encryption, versioning, and lifecycle rules
- Separate S3 bucket for VPC flow logs with encryption
- Lambda function for PII scanning with VPC configuration and KMS encryption
- VPC with private subnets across multiple availability zones
- VPC endpoints for S3 and KMS to keep traffic private
- API Gateway REST API with API key authentication and request validation
- Security groups restricting traffic to HTTPS only
- IAM roles with least-privilege permissions
- CloudWatch Log groups with 90-day retention for Lambda and API Gateway
- CloudWatch alarms for security monitoring
- VPC flow logs enabled and configured
- Stack outputs for API endpoint URL, API key ID, and S3 bucket name
- Comprehensive integration tests validating deployed resources
- Documentation including deployment instructions and security considerations
