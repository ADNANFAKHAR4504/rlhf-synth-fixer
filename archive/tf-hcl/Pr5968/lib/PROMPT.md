Hey team,

We've been tasked with building out a secure payment processing environment for a financial services company. They're processing sensitive transaction data and need to meet PCI-DSS compliance requirements, so security is absolutely critical here. The infrastructure needs to follow defense-in-depth principles with multiple layers of security controls.

I've been asked to create this infrastructure using **Terraform with HCL** for the us-east-1 region. The business is pretty adamant about having zero-trust network architecture, encrypted data everywhere, comprehensive logging, and automated threat detection. They want everything locked down tight since this will be handling real payment transactions.

The company currently has their payment processing workloads scattered across different environments without proper security controls. They've had a few close calls with security audits and want to get ahead of any potential compliance issues. This new infrastructure will serve as their reference architecture for all future payment processing deployments.

## What we need to build

Create a secure payment processing infrastructure using **Terraform with HCL** that implements defense-in-depth security controls across networking, encryption, access management, and monitoring layers.

### Core Requirements

1. **Network Security**
   - VPC with 3 private subnets distributed across different availability zones
   - VPC flow logs enabled and stored in dedicated S3 bucket
   - VPC endpoints for S3, EC2, and RDS to prevent data exfiltration through internet gateway
   - Security groups allowing only HTTPS (443) between application tiers and PostgreSQL (5432) from app tier to database
   - Network ACLs explicitly denying all traffic except required ports

2. **Encryption and Key Management**
   - KMS keys with automatic rotation enabled
   - Separate KMS key aliases for each service (rds, s3, logs)
   - All S3 buckets using SSE-KMS encryption with customer-managed keys
   - RDS PostgreSQL with encryption at rest using KMS
   - Automated backups encrypted with KMS

3. **Data Storage and Database**
   - RDS PostgreSQL instance configured to enforce SSL connections only
   - S3 buckets for application logs and audit trails with versioning enabled
   - Lifecycle policies on S3 buckets
   - Bucket policies denying unencrypted uploads
   - VPC flow logs stored for 90 days minimum

4. **Identity and Access Management**
   - IAM roles for EC2 instances with inline session policies
   - Session policies limiting actions to specific resources only
   - IAM roles must use session policies with maximum 1-hour duration
   - All EC2 instances must use IMDSv2 only

5. **Threat Detection and Monitoring**
   - GuardDuty enabled with S3 protection
   - EventBridge rule to send HIGH severity findings to SNS topic
   - AWS Config with rules checking for encrypted volumes, IMDSv2 enforcement, and public S3 bucket exposure
   - CloudWatch alarms for root account login attempts, failed authentication events, and unauthorized API calls
   - GuardDuty findings automatically sent to SNS for incident response

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Terraform 1.5+** with AWS provider 5.x
- Deploy to **us-east-1** region across 3 availability zones
- Use **VPC** with private subnets only (no public subnets)
- Use **VPC Flow Logs** for network traffic monitoring
- Use **S3** for logs and audit trails storage
- Use **KMS** with rotation for encryption keys
- Use **RDS PostgreSQL** for transaction data
- Use **EC2 instances** for payment processing applications
- Use **IAM roles and policies** for access control
- Use **Security Groups** for network filtering
- Use **GuardDuty** for threat detection
- Use **EventBridge** for event routing
- Use **SNS** for notifications
- Use **AWS Config** for compliance monitoring
- Use **CloudWatch Alarms** for security monitoring
- Use **VPC Endpoints** for S3, EC2, and RDS services
- Resource names must include **environmentSuffix** variable for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (no Retain policies)

### Constraints

- Production payment processing infrastructure deployed across 3 availability zones
- All resources must comply with PCI-DSS requirements
- KMS keys managed with cross-account access considerations
- Security groups must follow least-privilege principle with no 0.0.0.0/0 ingress rules
- All RDS instances must have encrypted storage and TLS-only connections
- CloudWatch alarms must trigger on any root account usage
- Network ACLs must explicitly deny all traffic except required ports
- All resources must be tagged with Environment, Purpose, and Compliance tags
- Modular Terraform configuration with separate files for networking, security, database, and monitoring components

## Success Criteria

- Functionality: All AWS services deployed and properly configured for payment processing
- Security: Zero-trust network architecture with encryption at rest and in transit
- Compliance: All resources meet PCI-DSS requirements with proper logging and monitoring
- Reliability: Multi-AZ deployment with automated backups and disaster recovery capabilities
- Resource Naming: All resources include environmentSuffix variable for uniqueness
- Code Quality: Clean HCL code, well-organized modules, comprehensive documentation
- Monitoring: Automated threat detection with GuardDuty and Config compliance rules
- Access Control: Least-privilege IAM policies with session restrictions

## What to deliver

- Complete Terraform HCL implementation with modular structure
- Separate files for networking, security, database, and monitoring components
- VPC with 3 private subnets and flow logs
- KMS keys with rotation for rds, s3, and logs
- RDS PostgreSQL with encryption and SSL enforcement
- S3 buckets with versioning, encryption, and lifecycle policies
- IAM roles with session policies
- Security groups with least-privilege rules
- GuardDuty with EventBridge integration to SNS
- AWS Config with compliance rules
- CloudWatch alarms for security events
- VPC endpoints for S3, EC2, and RDS
- Comprehensive tagging strategy
- Variables file with environmentSuffix parameter
- Outputs file with key resource identifiers
