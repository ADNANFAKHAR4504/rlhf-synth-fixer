# Secure Infrastructure Baseline for Financial Services

Hey team,

We've been tasked with building a complete security baseline infrastructure for a financial services company that needs to meet SOC2 and PCI-DSS compliance requirements. The security team has been very clear about their expectations around encryption, access control, and audit logging, and everything needs to be enforced through infrastructure as code so there's no room for manual configuration drift.

This is a production environment deployment in us-east-1, and we need to implement this using **CDK with TypeScript**. The company has a zero-trust security model, so every component needs proper encryption, strict access controls, and comprehensive monitoring. They're particularly concerned about data residency, audit trails, and being able to prove compliance to auditors at any time.

The infrastructure will support their core banking application which handles sensitive financial data. They need a highly available database setup that's encrypted at rest and in transit, secure storage for both application data and audit logs with versioning enabled, and a full monitoring and alerting system that can catch any security anomalies or unauthorized access attempts. Everything needs to be tagged properly for cost allocation and compliance tracking.

## What we need to build

Create a secure infrastructure baseline using **CDK with TypeScript** that enforces organizational security policies and compliance requirements for a financial services company.

### Core Requirements

1. **Encryption and Key Management**
   - Create a KMS customer-managed key with automatic rotation enabled
   - Use this key for encrypting all data at rest across services
   - Enable key policies that restrict access to authorized services only

2. **Database Infrastructure**
   - Deploy RDS Aurora MySQL cluster with encryption at rest using the KMS key
   - Enable automated backups with appropriate retention period
   - Enable deletion protection to prevent accidental data loss
   - Configure connections to require TLS 1.2 or higher
   - Deploy across multiple availability zones for high availability

3. **Network Infrastructure**
   - Create VPC with private subnets across 3 availability zones
   - Database subnets must not have internet gateway routes
   - Enable VPC flow logs and send to centralized S3 bucket
   - Configure security groups with explicit egress rules
   - No 0.0.0.0/0 destinations except for HTTPS traffic

4. **Storage Infrastructure**
   - Create S3 bucket for application data with versioning and encryption
   - Create separate S3 bucket for audit logs with 90-day retention
   - Enable access logging on application data bucket
   - Use SSE-KMS encryption with customer-managed keys
   - Block all public access on all buckets
   - Implement lifecycle policies where appropriate

5. **Identity and Access Management**
   - Create IAM roles following least-privilege principles
   - Configure session duration limits on all roles
   - Add MFA requirements for sensitive operations
   - Include explicit deny statements for sensitive operations

6. **Compliance Monitoring**
   - Deploy AWS Config rules to monitor encryption compliance
   - Monitor access policy compliance
   - Enable continuous compliance checking
   - Configure Config to send findings to SNS topic

7. **Logging and Monitoring**
   - Create CloudWatch Log groups with KMS encryption
   - Set up metric filters for security events
   - Configure alarms for unauthorized API calls
   - Configure alarms for privilege escalation attempts
   - Send all security alerts to SNS topic

8. **Alerting Infrastructure**
   - Create SNS topics with encrypted message delivery
   - Configure subscriptions for security alerts
   - Ensure all messages are encrypted in transit

9. **Configuration Management**
   - Store database endpoints in Systems Manager Parameter Store
   - Store secure configuration values as SecureString parameters
   - Enable encryption for all parameter store values

10. **Stack Protection**
    - Enable stack-level termination protection
    - Implement drift detection capabilities
    - Ensure all resources are destroyable for testing environments

11. **Compliance Reporting**
    - Generate stack outputs showing KMS key ARN
    - Report count of encrypted resources
    - List all enabled security features
    - Show Config rule compliance status

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use **KMS** for encryption key management with automatic rotation
- Use **RDS Aurora MySQL** for database with encryption and deletion protection
- Use **VPC** with private subnets, no IGW on database subnets, and VPC flow logs
- Use **S3** for application data and audit logs with versioning and encryption
- Use **IAM** for roles with session duration limits and MFA requirements
- Use **AWS Config** for compliance rule monitoring
- Use **CloudWatch Logs** with KMS encryption and metric filters
- Use **SNS** for encrypted security alerts
- Use **Systems Manager Parameter Store** for secure configuration storage
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- CDK version 2.x with Node.js 18+

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (RemovalPolicy.DESTROY for testing, not RETAIN)
- All resources must include environmentSuffix in their names for multi-environment support
- All database connections must enforce TLS 1.2 or higher with certificate validation
- All S3 buckets must block public access with no exceptions
- VPC flow logs must be enabled and retained for 90 days minimum
- Do NOT create GuardDuty detectors as they are account-level resources limited to one per account
- AWS Config service-linked role should use "service-role/AWS_ConfigRole" IAM policy
- Lambda functions using Node.js 18+ should use AWS SDK v3 bundled with runtime, not layer

### Constraints

- All resources must be tagged with DataClassification, Environment, and Owner tags
- Security groups must have explicit egress rules with no 0.0.0.0/0 except HTTPS
- CloudWatch alarms must trigger on unauthorized API calls or privilege escalations
- IAM roles must follow least-privilege with explicit deny statements
- VPC flow logs must be sent to centralized S3 bucket with 90-day retention
- All S3 buckets must use SSE-KMS encryption with customer-managed keys
- Database backups must be encrypted and retained according to compliance requirements
- All logging must be centralized and encrypted at rest
- Stack must support drift detection and termination protection
- No hardcoded secrets or credentials in code
- All configuration values must be parameterized

## Success Criteria

- **Functionality**: All AWS services properly configured and integrated
- **Security**: All data encrypted at rest and in transit, strict access controls enforced
- **Compliance**: AWS Config rules passing, all required security features enabled
- **Monitoring**: CloudWatch alarms configured for security events with SNS notifications
- **Reliability**: Multi-AZ deployment for database, automated backups enabled
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Tagging**: All resources tagged with DataClassification, Environment, Owner
- **Documentation**: Clear deployment instructions and architecture overview
- **Testing**: Comprehensive unit and integration tests with high coverage
- **Code Quality**: TypeScript code following CDK best practices, well-documented

## What to deliver

- Complete CDK TypeScript implementation in lib/tap-stack.ts
- Stack initialization in bin/tap.ts with environment configuration
- Unit tests in test/tap-stack.unit.test.ts covering all resources
- Integration tests in test/tap-stack.int.test.ts validating deployments
- README.md with architecture overview and deployment instructions
- Stack outputs showing compliance summary:
  - KMS key ARN
  - Count of encrypted resources
  - List of enabled security features
  - Config rule compliance status
  - VPC and subnet information
  - Database endpoint parameter name
  - SNS topic ARN for alerts
