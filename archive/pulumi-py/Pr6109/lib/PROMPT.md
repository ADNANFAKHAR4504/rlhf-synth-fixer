Hey team,

We need to build a secure payment processing API infrastructure for one of our financial services clients. They're dealing with sensitive payment data and need to meet PCI-DSS compliance requirements. The security team has mandated encryption at all layers, network isolation, and comprehensive access controls. I've been asked to create this infrastructure using **Pulumi with Python** and deploy it to the us-east-1 region.

The client is processing thousands of payment transactions daily and needs a highly secure, isolated environment that protects against common web attacks while maintaining audit trails for compliance. They've had security audits flag several requirements around encryption key management, network segmentation, and access controls that we need to address comprehensively.

The infrastructure needs to support a REST API backend with serverless compute, encrypted storage for payment documents, and a transaction database with point-in-time recovery. All of this needs to be locked down with defense-in-depth security controls including WAF protection, mutual TLS, and least privilege IAM policies.

## What we need to build

Create a secure payment processing API infrastructure using **Pulumi with Python** that provisions a fully isolated and encrypted environment for handling payment transactions in AWS.

### Core Requirements

1. **Network Infrastructure**
   - Create a VPC with 3 private and 3 public subnets across different availability zones
   - Private subnets for Lambda execution with no direct internet access
   - Public subnets for load balancers and WAF
   - Proper route tables and network ACLs for traffic isolation

2. **API Gateway and Security**
   - Set up an API Gateway for REST endpoints
   - Configure mutual TLS authentication for all API endpoints
   - Integrate API Gateway with Lambda functions for serverless compute
   - Attach Web Application Firewall (WAF) with OWASP Top 10 rule set protection

3. **Serverless Compute**
   - Deploy Lambda functions in private subnets
   - Configure VPC endpoints for AWS service access without internet routing
   - Set up proper security groups restricting inbound and outbound traffic
   - Enable CloudWatch logging with encryption

4. **Encrypted Storage**
   - Configure S3 buckets with server-side encryption using customer-managed KMS keys
   - Enable versioning on all S3 buckets
   - Block all public access to S3 buckets
   - Set up bucket policies restricting access to specific IAM roles

5. **Database Infrastructure**
   - Create a DynamoDB table for transaction records
   - Enable point-in-time recovery for data protection
   - Configure encryption at rest using customer-managed KMS keys
   - Implement proper capacity settings for payment workloads

6. **Encryption Key Management**
   - Create KMS keys with automatic rotation enabled
   - Separate KMS keys for S3, CloudWatch Logs, and DynamoDB
   - Configure key policies with least privilege access
   - Enable CloudTrail logging for all key usage

7. **Identity and Access Management**
   - Create IAM roles for Lambda execution with least privilege policies
   - Include explicit deny statements for destructive actions
   - Implement resource-based policies on S3 and DynamoDB
   - Use IAM conditions to restrict access based on encryption and MFA

8. **Logging and Monitoring**
   - Set up CloudWatch Log Groups for all Lambda functions
   - Enable encryption on all log groups using KMS
   - Configure 90-day retention for compliance requirements
   - Implement log metric filters for security events

9. **Web Application Firewall**
   - Deploy AWS WAF with OWASP Top 10 protection rules
   - Configure rate limiting to prevent abuse
   - Set up geo-blocking rules if needed
   - Attach WAF to API Gateway

10. **Compliance and Tagging**
    - Tag all resources with mandatory compliance tags: Environment, DataClassification, ComplianceScope
    - Enable AWS Security Hub for continuous compliance scanning
    - Configure resource-level encryption validation
    - Implement deletion protection where appropriate

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **Amazon VPC** for network isolation with 3 AZs
- Use **API Gateway** with mutual TLS and Lambda integration
- Use **AWS Lambda** in private subnets with VPC endpoints
- Use **Amazon S3** with encryption, versioning, and public access blocking
- Use **AWS WAF** with OWASP Top 10 rule set attached to API Gateway
- Use **AWS KMS** for customer-managed encryption keys with automatic rotation
- Use **Amazon CloudWatch Logs** with encryption and 90-day retention
- Use **Amazon DynamoDB** with point-in-time recovery and encryption
- Use **AWS IAM** for least privilege access control
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region across 3 availability zones
- Use Pulumi 3.x with Python 3.9 or later

### Security Constraints

- All data must be encrypted at rest using customer-managed KMS keys with automatic rotation enabled
- Network traffic must flow through a Web Application Firewall with OWASP Top 10 protection rules
- Lambda functions must run in private subnets with no direct internet access
- S3 buckets must have versioning enabled and block all public access
- API Gateway must enforce mutual TLS authentication for all endpoints
- CloudWatch Logs must be encrypted and retention set to 90 days for compliance
- IAM roles must follow least privilege principle with explicit deny statements for sensitive actions
- All resources must be tagged with Environment, DataClassification, and ComplianceScope tags
- All resources must be fully destroyable with no Retain deletion policies
- Include proper error handling and logging for all Lambda functions
- VPC endpoints must be used for AWS service access from private subnets

### Performance and Reliability

- Lambda functions should have appropriate memory and timeout configurations
- DynamoDB should use on-demand capacity for variable payment workloads
- API Gateway should have throttling configured to prevent abuse
- S3 should use intelligent tiering for cost optimization
- CloudWatch alarms for critical metrics like API errors and Lambda failures

## Success Criteria

- **Functionality**: API Gateway successfully routes requests to Lambda functions in private subnets with mutual TLS authentication
- **Network Isolation**: Lambda functions in private subnets access AWS services through VPC endpoints without internet routing
- **Encryption**: All data encrypted at rest using customer-managed KMS keys with automatic rotation
- **WAF Protection**: OWASP Top 10 rules block common web attacks at API Gateway layer
- **Access Control**: IAM roles enforce least privilege with explicit denies for destructive operations
- **Logging**: All Lambda functions log to encrypted CloudWatch Log Groups with 90-day retention
- **Compliance**: All resources tagged with mandatory compliance tags for audit trails
- **Reliability**: DynamoDB point-in-time recovery enabled for transaction data protection
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Code Quality**: Clean Python code, well-structured, properly documented, and fully deployable

## What to deliver

- Complete Pulumi Python implementation in __main__.py or tap_stack.py
- VPC with 3 private and 3 public subnets across availability zones
- API Gateway with mutual TLS, Lambda integration, and WAF attachment
- Lambda functions with VPC configuration, security groups, and IAM roles
- S3 buckets with encryption, versioning, public access blocking
- DynamoDB table with encryption, point-in-time recovery
- KMS keys for S3, CloudWatch Logs, and DynamoDB with automatic rotation
- CloudWatch Log Groups with encryption and 90-day retention
- WAF WebACL with OWASP Top 10 rule set
- IAM roles and policies following least privilege principle
- VPC endpoints for AWS services (S3, DynamoDB, CloudWatch)
- Security groups and network ACLs for traffic control
- Proper resource tagging with compliance tags
- Unit tests for infrastructure validation
- Documentation with deployment and testing instructions
