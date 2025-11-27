# Secure Data Processing Pipeline for Financial Services

Hey team,

We've got a critical project from one of our financial services clients who needs to build a secure data processing pipeline that meets strict regulatory compliance requirements. They handle sensitive customer transaction data and need everything locked down with encryption, fine-grained access controls, and comprehensive audit logging for their compliance team.

The business requirements are pretty clear: they need a complete end-to-end pipeline that processes financial transactions securely, stores them with proper encryption and backup capabilities, and provides APIs for their applications to interact with the system. Everything needs to run in isolated environments with zero internet exposure, and all AWS service communication must go through private VPC endpoints.

What makes this particularly challenging is the zero-tolerance security posture. No shortcuts allowed. Every resource needs KMS encryption, all IAM roles must follow strict least-privilege principles with no wildcards, Lambda functions must run in completely isolated VPC environments, and they need automatic credential rotation for database access. Their compliance team also requires detailed CloudWatch logging with encryption and specific retention policies.

## What we need to build

Create a secure data processing pipeline using **CloudFormation with JSON** for a financial services company handling sensitive transaction data.

### Core Requirements

1. **Encryption Infrastructure**
   - KMS customer-managed key with automatic key rotation enabled
   - All resources encrypted with this KMS key (S3, DynamoDB, Lambda environment variables, CloudWatch Logs)
   - Key policies that enforce encryption requirements across all services

2. **Data Storage Layer**
   - S3 bucket with SSE-KMS encryption using the customer-managed key
   - Bucket versioning enabled for compliance and data recovery
   - Lifecycle policies for archival of compliance data
   - Block all public access configurations
   - DynamoDB table for transaction records with KMS encryption
   - Point-in-time recovery enabled on DynamoDB table
   - Contributor insights enabled for monitoring access patterns

3. **Compute and API Layer**
   - Lambda functions deployed in VPC private subnets (no internet access)
   - Environment variables encrypted using KMS key
   - API Gateway REST API with request validation enabled
   - API key requirements for all endpoints
   - CloudWatch logging enabled on API Gateway with encryption

4. **Secrets Management**
   - Secrets Manager for RDS database credentials
   - Automatic rotation configured every 30 days
   - KMS encryption for secrets at rest
   - IAM policies restricting access to specific Lambda roles only

5. **Network Isolation**
   - VPC with private subnets across multiple availability zones
   - No NAT gateways or internet gateways
   - VPC endpoints for S3, DynamoDB, and Secrets Manager
   - Security groups with explicit ingress and egress rules (no wildcards)
   - All traffic stays within AWS private network

6. **Monitoring and Alarms**
   - CloudWatch Log Groups for all services with KMS encryption
   - 90-day retention policy on all log groups
   - CloudWatch alarms for failed API requests
   - CloudWatch alarms for Lambda function errors
   - Detailed logging for audit trail requirements

7. **Access Control**
   - IAM roles for each service with least-privilege permissions
   - No wildcard actions allowed in any IAM policy
   - Explicit resource ARNs for all permissions
   - Separate roles for Lambda, API Gateway, and administrative access
   - Service-linked roles where appropriate

8. **Compliance and Tagging**
   - Cost allocation tags on all resources for tracking
   - Environment, project, and compliance-level tags
   - Tags for automated compliance scanning

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **KMS** for customer-managed encryption keys with rotation
- Use **S3** for data storage with versioning and lifecycle policies
- Use **DynamoDB** for transaction records with encryption and PITR
- Use **Lambda** for data processing in isolated VPC subnets
- Use **API Gateway** for REST API with validation and API keys
- Use **Secrets Manager** for credential storage and automatic rotation
- Use **IAM** roles with explicit least-privilege permissions
- Use **VPC** with private subnets and VPC endpoints (no internet access)
- Use **CloudWatch** for logs (encrypted) and alarms
- Use **Security Groups** with explicit port and CIDR configurations
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All S3 buckets MUST use SSE-KMS encryption with customer-managed keys (no default S3 encryption)
- Lambda functions MUST run in VPC private subnets with no internet gateway or NAT gateway access
- DynamoDB tables MUST have point-in-time recovery enabled and use KMS encryption
- IAM roles MUST follow least-privilege principle with no wildcard actions (explicit permissions only)
- API Gateway endpoints MUST require API keys and implement request validation
- CloudWatch Logs MUST be encrypted with KMS and have 90-day retention minimum
- Security groups MUST explicitly define all ingress and egress rules with specific ports and CIDRs
- All resources MUST have cost allocation tags (Environment, Project, ComplianceLevel)
- Secrets Manager MUST rotate database credentials every 30 days automatically
- All resources must be destroyable (use DeletionPolicy: Delete, no Retain policies)
- All resources must include **environmentSuffix** parameter for unique naming

### Constraints

- Zero internet access for Lambda functions (VPC isolated environment)
- No wildcards in IAM policies (explicit ARNs and actions only)
- All encryption must use customer-managed KMS keys (no AWS-managed keys)
- VPC endpoints required for all AWS service communication
- Multi-AZ deployment for high availability
- Strict CIDR blocks for security group rules
- Mandatory cost allocation tags on all billable resources
- 90-day minimum retention for CloudWatch Logs
- 30-day credential rotation for Secrets Manager
- All resources must be in us-east-1 region

## Success Criteria

- **Functionality**: Complete pipeline processes transactions securely with encrypted storage, API access, and credential management
- **Security**: All data encrypted at rest and in transit, zero internet exposure, least-privilege IAM policies
- **Compliance**: Point-in-time recovery enabled, audit logs encrypted and retained, cost allocation tags present
- **High Availability**: Multi-AZ deployment with VPC endpoints across availability zones
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Code Quality**: Valid CloudFormation JSON template, well-documented parameters and outputs, follows AWS best practices

## What to deliver

- Complete CloudFormation JSON template implementation
- KMS key with rotation, S3 bucket with versioning, DynamoDB table with PITR
- Lambda functions in VPC, API Gateway with validation and API keys
- Secrets Manager with automatic rotation, IAM roles with least-privilege
- VPC with private subnets and endpoints, Security Groups with explicit rules
- CloudWatch Logs with encryption and alarms for monitoring
- Parameters for environmentSuffix and other configurable values
- Outputs for resource ARNs and identifiers
- Documentation of deployment process and security configurations
