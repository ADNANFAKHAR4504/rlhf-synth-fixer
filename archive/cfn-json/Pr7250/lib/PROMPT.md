# PCI-DSS Compliant Payment Processing Infrastructure

Hey team,

We need to build a secure payment processing infrastructure that meets PCI-DSS requirements. The business is expanding into payment processing and requires a highly secure, isolated environment for handling cardholder data. I've been asked to create this using JSON with CloudFormation. The business wants strict network isolation, encryption at rest and in transit, comprehensive audit logging, and real-time security monitoring.

Our payment processing system needs to be completely isolated from other systems. All data must be encrypted, all access must be logged, and we need automated compliance monitoring. The security team has mandated PCI-DSS Level 1 compliance, which means we need proper network segmentation, encryption key management, automated configuration auditing, and real-time alerting for security events.

This is a mission-critical system handling sensitive cardholder data, so we can't compromise on security or compliance. Every resource needs to be properly tagged for compliance tracking, and we need full visibility into configuration changes and security events.

## What we need to build

Create a PCI-DSS compliant payment processing infrastructure using **CloudFormation with JSON** for secure cardholder data handling.

### Core Requirements

1. **Network Isolation**
   - Create dedicated VPC with private subnets across 3 availability zones
   - No internet gateway or NAT gateway (completely isolated)
   - Enable VPC Flow Logs to CloudWatch for network traffic monitoring
   - Private subnets must span us-east-1a, us-east-1b, us-east-1c

2. **Lambda Processing Function**
   - Deploy Lambda function in private subnets for payment processing
   - Lambda must have no internet access
   - Configure Lambda to use VPC endpoints for AWS service access
   - Include proper IAM role with least privilege access

3. **Data Encryption**
   - Customer-managed KMS key for all encryption operations
   - Enable automatic key rotation
   - S3 buckets must use KMS encryption with bucket key enabled
   - All data encrypted at rest using customer-managed keys

4. **Secure Storage**
   - Create S3 bucket for encrypted cardholder data storage
   - Create S3 bucket for audit logs and Flow Logs
   - Enable S3 bucket versioning on data bucket
   - Block all public access on both buckets
   - Enforce SSL/TLS for all bucket access

5. **VPC Endpoints for Private AWS Access**
   - VPC endpoint for S3 (gateway type)
   - VPC endpoint for Lambda (interface type)
   - Endpoints must be restricted to VPC traffic only
   - Proper security groups for interface endpoints

6. **Compliance Monitoring with AWS Config**
   - Create Config Recorder to track all resource configurations
   - Create Config Delivery Channel to S3 audit bucket
   - Implement Config Rules for PCI-DSS compliance automation:
     - s3-bucket-server-side-encryption-enabled
     - encrypted-volumes
     - vpc-flow-logs-enabled
   - Create IAM role for Config with AWS managed policy: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
   - Enable continuous compliance monitoring

7. **Security Alerting with SNS**
   - Create SNS topic for security alerts: SecurityAlerts-${EnvironmentSuffix}
   - Create separate KMS key for SNS encryption
   - Add email subscription endpoint (use parameter for email address)
   - Configure SNS topic policy for least privilege access
   - Enable encryption at rest for SNS messages

8. **Proactive Monitoring with CloudWatch Alarms**
   - VPC Flow Logs alarm: Alert on rejected connection attempts greater than 100 per 5 minutes
   - Lambda error alarm: Alert on Lambda invocation errors greater than 5 per 5 minutes
   - S3 bucket alarm: Alert on unauthorized access attempts
   - KMS key alarm: Alert on KMS key usage anomalies
   - All alarms must publish notifications to SNS topic
   - Configure appropriate evaluation periods and thresholds

9. **Secure Configuration Management with Systems Manager**
   - Create SSM Parameter Store SecureString parameters for:
     - Lambda configuration settings
     - Application secrets (use placeholder values)
     - Environment-specific configurations
   - Encrypt all parameters with customer-managed KMS key
   - Grant Lambda IAM role GetParameter permissions for parameter access
   - Update Lambda environment variables to reference parameter names

10. **Compliance Tagging**
    - All resources must include tags: DataClassification=PCI, ComplianceScope=Payment
    - Tag all resources for cost allocation and compliance tracking
    - Use consistent tagging across all infrastructure components

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** for network isolation with private subnets
- Use **Lambda** for payment processing in private subnets
- Use **S3** for encrypted data storage and audit logs
- Use **KMS** for customer-managed encryption keys with rotation
- Use **CloudWatch Logs** for VPC Flow Logs and Lambda logs
- Use **AWS Config** for compliance monitoring and configuration tracking
- Use **SNS** for security alerting and notifications
- Use **CloudWatch Alarms** for proactive monitoring
- Use **Systems Manager Parameter Store** for secure configuration
- Use **IAM** for least privilege access control
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-${EnvironmentSuffix}
- No NAT Gateways or Internet Gateways (cost optimization and security)

### Deployment Requirements (CRITICAL)

- All named resources MUST include ${EnvironmentSuffix} parameter reference
- Example: PaymentVpc-${EnvironmentSuffix}, DataBucket-${EnvironmentSuffix}
- All resources must be destroyable (use RemovalPolicy: Delete where applicable)
- FORBIDDEN: Do not use RemovalPolicy: Retain except for main KMS key and data S3 bucket
- AWS Config: Use correct IAM managed policy arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
- AWS Config: Do not create GuardDuty detector (account-level limitation, only one allowed)
- Lambda: If using Node.js 18+, include aws-sdk as dependency (not in runtime)
- SNS: Separate KMS key required for SNS encryption (different from data encryption key)
- CloudWatch Alarms: Use appropriate metric filters and threshold values
- SSM Parameters: Must be SecureString type with KMS encryption

### Constraints

- No internet connectivity (no IGW, no NAT Gateway)
- All traffic must stay within AWS network via VPC endpoints
- All data must be encrypted at rest with customer-managed KMS keys
- All data must be encrypted in transit using TLS
- Block all public S3 access
- Private subnets only (no public subnets)
- Least privilege IAM permissions
- All resources must include proper PCI compliance tags
- All resources must be destroyable for testing and development
- Include proper error handling and logging for all Lambda functions
- Config rules must cover core PCI-DSS requirements
- SNS topics must be encrypted with dedicated KMS key
- CloudWatch alarms must have actionable thresholds
- SSM parameters must be encrypted SecureStrings

## Success Criteria

- Functionality: Lambda can process payments in isolated VPC using VPC endpoints
- Functionality: All AWS service access through VPC endpoints (S3, Lambda)
- Functionality: AWS Config continuously monitors compliance with automated rules
- Functionality: SNS delivers security alerts to email subscription
- Functionality: CloudWatch alarms trigger on security events
- Functionality: Lambda reads configuration from SSM Parameter Store
- Performance: Lambda cold start under 3 seconds with VPC configuration
- Performance: S3 operations complete with encryption enabled
- Reliability: Deployment succeeds across 3 availability zones
- Reliability: All alarms properly configured with SNS notification
- Security: All data encrypted with customer-managed KMS keys (separate keys for data and SNS)
- Security: No internet connectivity possible from any resource
- Security: All S3 public access blocked
- Security: SSL/TLS enforced for all S3 access
- Security: Config rules automatically detect non-compliant resources
- Security: SSM parameters encrypted with KMS
- Compliance: PCI and Payment tags on all resources
- Compliance: VPC Flow Logs capturing all network traffic
- Compliance: Config Recorder tracking all resource changes
- Compliance: Automated compliance validation with Config Rules
- Resource Naming: All named resources include environmentSuffix parameter
- Code Quality: JSON CloudFormation template, well-structured, documented

## What to deliver

- Complete CloudFormation JSON implementation (single TapStack.json file)
- VPC with 3 private subnets, route table, and Flow Logs
- Lambda function in private subnets with VPC configuration
- 2 S3 buckets (data and audit logs) with encryption and versioning
- Customer-managed KMS keys (one for data/Lambda/S3/SSM, one for SNS) with rotation
- VPC endpoints for S3 (gateway) and Lambda (interface)
- IAM roles for Lambda, VPC Flow Logs, and AWS Config with least privilege
- CloudWatch Log Groups for Flow Logs and Lambda
- AWS Config Recorder, Delivery Channel, and 3 Config Rules for PCI-DSS
- SNS topic with KMS encryption, email subscription, and topic policy
- 4 CloudWatch Alarms (VPC, Lambda, S3, KMS) with SNS actions
- 3-5 SSM Parameter Store SecureString parameters with KMS encryption
- CloudWatch Logs metric filters for S3 and KMS alarms
- Unit tests for all 38-42 resources
- Integration tests validating Config rules, SNS delivery, alarms, and parameter access
- Documentation with deployment instructions and architecture diagram
- Parameters: EnvironmentSuffix (string), EmailAddress (string for SNS subscription)
