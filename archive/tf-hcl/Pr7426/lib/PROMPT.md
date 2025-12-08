# Security-Hardened Infrastructure for Payment Processing APIs

Hey team,

We've been tasked with building out a secure infrastructure for a financial services company that needs to handle payment processing APIs. This is a high-stakes project where security isn't optional, it's everything. The business needs infrastructure that passes PCI-DSS compliance and implements defense-in-depth principles from the ground up.

The challenge here is that we're dealing with sensitive payment data, which means encryption everywhere, strict access controls, and audit trails for every action. We can't afford any shortcuts on security. The infrastructure needs to enforce SSL/TLS for all connections, use customer-managed KMS keys for encryption at rest, and ensure all traffic flows through private networks only.

The company operates in AWS across multiple availability zones in us-east-1, and they want everything locked down tight. No public subnets, no internet gateways, just private subnets with VPC endpoints. Think of it as building a fortress where payment data can be processed safely.

## What we need to build

Create a security-focused infrastructure using **Terraform with HCL** for payment processing APIs that meets PCI-DSS compliance requirements.

### Core Requirements

1. **Database Security**
   - RDS PostgreSQL instance with encryption at rest using customer-managed KMS key
   - SSL/TLS enforcement for all database connections
   - Automated backups enabled with encryption
   - Multi-AZ deployment for high availability

2. **Storage Security**
   - S3 buckets with SSE-KMS encryption using customer-managed keys
   - Versioning enabled on all buckets
   - Bucket policies that explicitly deny unencrypted uploads
   - Block all public access configurations

3. **Encryption Key Management**
   - Customer-managed KMS keys with automatic rotation enabled
   - Strict key policies implementing separation of duties
   - Separate keys for RDS, S3, CloudWatch Logs, and Lambda environment variables
   - Key policies that prevent unauthorized usage

4. **Network Isolation**
   - VPC with private subnets only across 3 availability zones
   - No internet gateway or public subnets
   - VPC endpoints for S3 and RDS using AWS PrivateLink
   - NAT Gateways only if outbound internet access is absolutely required

5. **Serverless Computing**
   - Lambda functions with environment variable encryption using KMS
   - VPC configuration to run Lambda in private subnets
   - IAM roles following least privilege principle
   - Example payment processing API function

6. **Logging and Monitoring**
   - CloudWatch log groups with KMS encryption for all services
   - 90-day retention policy on all logs
   - Log groups for Lambda functions, VPC Flow Logs, and RDS
   - Centralized logging for security analysis

7. **Identity and Access Management**
   - IAM roles with external ID requirements for cross-account access
   - Session duration limits set to 1 hour maximum
   - Strict least privilege policies
   - No inline policies allowed, all policies must be managed
   - Separate roles for Lambda execution, RDS access, and monitoring

8. **Network Traffic Monitoring**
   - VPC Flow Logs enabled on the VPC
   - Flow logs stored in encrypted S3 bucket
   - CloudWatch Logs integration for real-time analysis
   - Minimum 90-day retention for flow logs

9. **Security Alerting**
   - CloudWatch alarms for failed authentication attempts
   - Alarms for encryption violation detection
   - Monitoring for RDS connection failures
   - Lambda error rate alarms for anomaly detection

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **RDS PostgreSQL** with encryption at rest and SSL enforcement
- Use **S3** with SSE-KMS encryption and customer-managed keys
- Use **KMS** for all encryption keys with automatic rotation
- Use **VPC** with private subnets spanning 3 AZs in us-east-1
- Use **Lambda** for serverless API processing with VPC integration
- Use **CloudWatch** for comprehensive logging and alarming
- Use **IAM** roles with strict least privilege policies
- Use **VPC Flow Logs** for network traffic analysis
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region

### Deployment Requirements (CRITICAL)

- All resources must include var.environment_suffix in their names to avoid conflicts
- Resources must be destroyable with no deletion protection or Retain policies
- All S3 buckets must use force_destroy for synthetic task cleanup
- RDS instances must have skip_final_snapshot set to true
- No resources should have deletion_protection enabled
- KMS keys should have deletion_window_in_days set to 7

### Constraints

- All S3 buckets must use SSE-KMS encryption with customer-managed keys, not AWS-managed
- RDS instances must enforce SSL connections through parameter groups
- VPC flow logs must be retained for minimum 90 days
- All IAM roles must follow least privilege with no inline policies
- Security groups must explicitly deny all traffic except required ports
- KMS key rotation must be enabled on all customer-managed keys
- All resources must have mandatory tags: Environment, DataClassification, Owner
- CloudWatch alarms must trigger on unauthorized access attempts
- All resources must be destroyable (no Retain or deletion protection policies)
- Include proper error handling and logging throughout

## Success Criteria

- Functionality: All 9 mandatory requirements fully implemented and working
- Performance: Multi-AZ deployment with high availability and failover capability
- Reliability: Automated backups, versioning, and disaster recovery mechanisms
- Security: Encryption at rest and in transit, least privilege access, network isolation
- Resource Naming: All resources include environmentSuffix variable for uniqueness
- Compliance: PCI-DSS compliance requirements met with comprehensive audit logging
- Code Quality: Clean Terraform HCL code, well-documented, follows best practices

## What to deliver

- Complete Terraform HCL implementation in lib/ directory
- provider.tf with AWS provider configuration for us-east-1
- variables.tf defining environment_suffix and other required variables
- main.tf or separate resource files for each AWS service
- KMS keys for RDS, S3, CloudWatch Logs, and Lambda
- VPC with 3 private subnets across availability zones
- RDS PostgreSQL with encryption and SSL enforcement
- S3 buckets with SSE-KMS encryption and versioning
- Lambda function with VPC configuration and encrypted environment variables
- CloudWatch log groups with KMS encryption
- IAM roles and policies following least privilege
- VPC Flow Logs with S3 storage and CloudWatch integration
- CloudWatch alarms for security monitoring
- Security groups with strict ingress/egress rules
- outputs.tf showing important resource identifiers
- Documentation with deployment instructions
