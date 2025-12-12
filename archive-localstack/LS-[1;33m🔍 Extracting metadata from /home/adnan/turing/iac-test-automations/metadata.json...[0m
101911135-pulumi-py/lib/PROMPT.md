Hey team,

We need to build a zero-trust network security infrastructure for a financial services company running microservices. They're working towards PCI DSS compliance and need strict IAM policies, network segmentation, and encryption everywhere - both data at rest and in transit. The security team is adamant about implementing true zero-trust principles with no exceptions.

I've been asked to create this in **Pulumi with Python**. The business wants a completely isolated network environment with private subnets only, VPC endpoints for AWS service access, and comprehensive encryption using KMS. They also need detailed audit trails through CloudWatch Logs and compliance monitoring through AWS Config.

The architecture needs to support microservices communication through API Gateway with IAM authorization, Lambda functions for serverless workloads, and proper network segmentation using security groups and NACLs. Everything must be encrypted, logged, and monitored for compliance.

## What we need to build

Create a zero-trust security infrastructure using **Pulumi with Python** for a financial services microservices platform.

### Core Requirements

1. **Network Isolation**
   - VPC with 3 private subnets across different availability zones
   - No internet gateway (completely isolated)
   - VPC endpoints for S3 and DynamoDB access
   - Appropriate security group rules for VPC endpoints

2. **Storage and Encryption**
   - S3 bucket with versioning enabled
   - SSE-S3 encryption for S3
   - Bucket policies that explicitly deny unencrypted uploads
   - KMS key with automatic rotation enabled
   - Restricted key policies for KMS

3. **Compute and API Layer**
   - Lambda functions with customer-managed KMS keys for environment variable encryption
   - API Gateway with AWS_IAM authorization
   - Request validation enabled on API Gateway
   - EC2 instances configured to use IMDSv2 only (HttpTokens set to 'required')

4. **Identity and Access Management**
   - IAM roles following principle of least privilege
   - Explicit deny policies for unauthorized actions
   - Assume role policies restricted by source IP
   - Proper role associations for all services

5. **Network Security Controls**
   - Security groups allowing only specific ports between services
   - No 0.0.0.0/0 rules in security groups
   - Network ACLs that explicitly deny all traffic except ports 443 and 3306
   - Proper subnet-level network isolation

6. **Logging and Monitoring**
   - CloudWatch Log groups with exactly 90-day retention
   - KMS encryption for CloudWatch Logs
   - AWS Config rules to monitor encryption compliance
   - AWS Config rules to monitor access policy compliance
   - AWS Config recorder with proper IAM role (use AWS managed policy: service-role/AWS_ConfigRole)

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network isolation
- Use **EC2** for security groups and IMDSv2 instances
- Use **S3** for object storage with encryption
- Use **DynamoDB** accessed via VPC endpoint
- Use **Lambda** for serverless compute
- Use **API Gateway** for API management with IAM auth
- Use **IAM** for identity and access control
- Use **KMS** for encryption key management
- Use **CloudWatch Logs** for audit trails
- Use **AWS Config** for compliance monitoring
- Use **VPC Endpoints** for private AWS service access
- Use **Network ACLs** for subnet-level security
- Resource names must include **environment_suffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environment_suffix}`
- Deploy to **us-east-1** region
- All resources must be tagged with: CostCenter, Environment, DataClassification

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain deletion policies)
- No DeletionProtection flags enabled
- Include environment_suffix as a configuration parameter
- All named resources (S3 buckets, KMS keys, log groups, etc.) must include environment_suffix
- Proper error handling and validation
- CloudWatch Logs retention must be exactly 90 days (compliance requirement)

### Constraints

- All S3 buckets MUST have versioning enabled
- All S3 buckets MUST use SSE-S3 encryption
- IAM roles MUST include explicit deny statements
- VPC endpoints MUST be used for S3 and DynamoDB
- Security groups MUST NOT have 0.0.0.0/0 ingress rules
- All EC2 instances MUST use IMDSv2 only
- CloudWatch Logs MUST retain logs for exactly 90 days
- Lambda functions MUST use customer-managed KMS keys
- API Gateway MUST enforce AWS_IAM authorization
- Network ACLs MUST explicitly deny non-required traffic
- All resources MUST include required tags
- No internet gateway or NAT gateway allowed

## Success Criteria

- **Functionality**: VPC with private subnets, VPC endpoints, encrypted S3, secured Lambda, IAM-authorized API Gateway
- **Security**: Zero-trust network, encryption everywhere, least privilege IAM, no public access
- **Compliance**: 90-day log retention, AWS Config monitoring, proper tagging, KMS rotation
- **Network Isolation**: Private subnets only, VPC endpoints, restrictive security groups and NACLs
- **Resource Naming**: All resources include environment_suffix for uniqueness
- **Destroyability**: All resources can be cleanly destroyed after testing
- **Code Quality**: Python, well-tested, documented, proper error handling

## What to deliver

- Complete Pulumi Python implementation
- VPC with 3 private subnets across availability zones
- VPC endpoints for S3 and DynamoDB with security groups
- S3 bucket with versioning, encryption, and deny policies
- Lambda functions with KMS-encrypted environment variables
- API Gateway with IAM authorization and request validation
- IAM roles with least privilege and explicit denies
- KMS key with rotation and restricted policies
- CloudWatch Log groups with 90-day retention and encryption
- Security groups with no 0.0.0.0/0 rules
- Network ACLs restricting to ports 443 and 3306
- AWS Config rules for compliance monitoring
- EC2 instances configured for IMDSv2
- Unit tests for all components
- Documentation and deployment instructions
- Stack outputs: VPC ID, subnet IDs, S3 bucket name, KMS key ARN, API Gateway endpoint URL
