Hey team,

We need to build a secure document processing pipeline for a financial services company that needs to meet PCI-DSS compliance requirements. They handle sensitive financial documents and need end-to-end encryption, comprehensive audit logging, and automated security scanning. The business has zero tolerance for security gaps, and every aspect of this system needs to be hardened for production use in a highly regulated environment.

I've been asked to create this infrastructure using **AWS CDK with Python**. This is a complex security-focused project spanning multiple AWS services with strict compliance requirements. The system needs to process documents through a secure pipeline with automated compliance checks, real-time security monitoring, and automatic remediation of security findings.

The environment will be deployed across 3 availability zones in us-east-1 with no internet gateway - all AWS service communication goes through VPC endpoints. We're building a zero-trust architecture where everything is encrypted, logged, and monitored.

## What we need to build

Create a secure document processing system using **AWS CDK with Python** that meets PCI-DSS compliance standards with automated security monitoring and remediation.

### Core Requirements

1. **Encryption Infrastructure**
   - KMS keys with automatic rotation enabled for all encryption needs
   - Customer-managed CMKs for S3 bucket encryption
   - Separate KMS keys for Lambda environment variables
   - All data encrypted at rest and in transit

2. **Storage with Security Controls**
   - S3 buckets with versioning enabled for document storage
   - Separate S3 bucket for access logging
   - Block all public access on all buckets
   - SSE-KMS encryption using customer-managed keys
   - Bucket policies enforcing encryption requirements

3. **Document Processing Functions**
   - Lambda function for document validation with 15-second timeout
   - Lambda function for document encryption with 15-second timeout
   - Lambda function for compliance scanning with 15-second timeout
   - Separate execution roles with least-privilege IAM policies
   - KMS permissions for encryption/decryption operations

4. **API Gateway with WAF Protection**
   - API Gateway REST API for document submission
   - WAF rules blocking SQL injection attempts
   - WAF rules blocking cross-site scripting (XSS) attempts
   - API key requirement for all endpoints
   - Request throttling configuration
   - Integration with Lambda processing functions

5. **VPC Architecture**
   - VPC spanning 3 availability zones
   - Private subnets only (no public subnets)
   - VPC endpoints for S3 service access
   - VPC endpoints for DynamoDB service access
   - VPC endpoints for Lambda service access
   - No internet gateway or NAT gateway
   - Security groups denying all traffic except required ports

6. **Audit Logging Infrastructure**
   - DynamoDB table for storing audit logs
   - Point-in-time recovery enabled
   - Encryption at rest enabled
   - GSI for querying by timestamp
   - Lambda functions writing audit entries for all operations

7. **Security Event Monitoring**
   - CloudWatch Events rules capturing all API calls
   - CloudWatch Logs log groups for event storage
   - Retention policies on log groups
   - Lambda functions triggered by security events

8. **Threat Detection and Remediation**
   - GuardDuty integration for security monitoring (do not create detector - one already exists at account level)
   - EventBridge rules triggered by high-severity GuardDuty findings
   - Lambda functions for automated remediation of security findings
   - SNS notifications for security alerts

9. **Secrets Management**
   - Secrets Manager secrets for API keys
   - Secrets Manager secrets for database credentials
   - Automatic rotation enabled (30 days for database credentials)
   - Lambda rotation functions
   - IAM permissions for secret access

10. **Identity and Access Control**
    - IAM roles with external ID requirements for cross-account access
    - Session policies limiting access duration
    - Condition keys restricting access by IP range
    - Condition keys requiring MFA for sensitive operations
    - Least-privilege policies for all resources

11. **Compliance Validation**
    - AWS Config custom rules validating encryption requirements
    - AWS Config custom rules validating access policies
    - AWS Config using service-role/AWS_ConfigRole managed IAM policy
    - Lambda functions for custom compliance checks
    - Automated remediation of compliance violations

12. **Security Alerting**
    - SNS topics for security alerts
    - Encryption enabled on SNS topics
    - Email subscriptions for critical alerts
    - Integration with GuardDuty findings
    - Integration with AWS Config compliance changes

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Deploy to **us-east-1** region
- VPC architecture with 3 AZs in private subnets only
- Use Lambda for all compute workloads
- Use KMS customer-managed keys for all encryption
- Use DynamoDB for audit log storage with PITR
- Use CloudWatch Events for API call capture
- Use EventBridge for GuardDuty integration
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-{environmentSuffix}`
- Python 3.9+ for Lambda runtimes
- AWS SDK v3 for Node.js 18+ Lambda functions (if any)
- All resources must be destroyable (no Retain policies, no DeletionProtection)

### Critical Deployment Requirements (CRITICAL)

**environmentSuffix Requirement**:
- ALL named resources MUST include environmentSuffix parameter
- Pattern: `f"resource-name-{environment_suffix}"` or `f"{resource_type}-{environment_suffix}"`
- At least 80% of resources must use suffix
- This prevents resource name collisions in parallel deployments

**Destroyability Requirement**:
- NO RemovalPolicy.RETAIN on any resources
- NO DeletionProtection=True flags
- All resources must be cleanly destroyable after testing
- Use RemovalPolicy.DESTROY for resources requiring explicit policy

**Service-Specific Warnings**:
- GuardDuty: Do NOT create GuardDuty detector (account-level resource, only one per account/region exists)
- AWS Config: Use managed policy `service-role/AWS_ConfigRole` for Config IAM role
- Lambda Node.js 18+: Use AWS SDK v3 (`@aws-sdk/client-*`) not v2 (`aws-sdk`)
- VPC Endpoints: Required for S3, DynamoDB, Lambda since no internet gateway

### Security and Compliance Constraints

- All S3 buckets must use SSE-KMS with customer-managed CMKs
- Lambda functions must use separate execution roles with least-privilege policies
- All API Gateway endpoints must require API keys and implement throttling
- CloudWatch Events and Logs replace CloudTrail for API call monitoring
- VPC endpoints required for all AWS service communications
- Security groups must explicitly deny all traffic except required ports
- IAM policies must use condition keys for IP and MFA restrictions
- Secrets Manager must rotate database credentials every 30 days
- GuardDuty findings must trigger automated remediation Lambda functions
- AWS Config must validate encryption and access policies continuously

### Cost Optimization Considerations

- Use serverless services (Lambda, API Gateway, DynamoDB) for cost efficiency
- Avoid NAT Gateways (using VPC endpoints instead)
- Use DynamoDB on-demand billing or provision conservatively
- Set CloudWatch Logs retention to 7-14 days for synthetic testing
- Use Aurora Serverless v2 if database required (not in current spec)

## Success Criteria

- **Security**: All data encrypted at rest and in transit with customer-managed keys
- **Compliance**: Meets PCI-DSS requirements with continuous compliance validation
- **Monitoring**: All API calls logged, all security events monitored and alerted
- **Automation**: GuardDuty findings trigger automatic remediation functions
- **Network Isolation**: No internet access, all service communication through VPC endpoints
- **Audit Trail**: Complete audit log in DynamoDB with point-in-time recovery
- **Resource Naming**: All resources include environmentSuffix for parallel deployments
- **Destroyability**: All resources can be cleanly destroyed after testing
- **Code Quality**: Python code following CDK best practices, well-structured and documented
- **Test Coverage**: Comprehensive unit tests for all infrastructure components

## What to deliver

- Complete **AWS CDK Python** implementation in lib/tap_stack.py
- Lambda functions for document validation, encryption, compliance scanning, and GuardDuty remediation
- VPC with 3 AZs, private subnets, security groups, and VPC endpoints (S3, DynamoDB, Lambda)
- KMS keys with automatic rotation
- S3 buckets with versioning, encryption, and logging
- API Gateway REST API with WAF integration
- WAFv2 web ACL with SQL injection and XSS rules
- DynamoDB table for audit logs with PITR
- CloudWatch Events rules and Logs integration
- EventBridge rules for GuardDuty findings
- Secrets Manager secrets with rotation
- IAM roles with external ID and session policies
- AWS Config rules and Lambda functions for compliance checks
- SNS topics with encryption for security alerts
- Comprehensive unit tests in tests/ directory
- README.md with deployment instructions and architecture documentation