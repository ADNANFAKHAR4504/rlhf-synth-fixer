# Infrastructure Compliance Auditing System

Hey team,

We need to build an automated compliance auditing system for a financial services company. They're facing quarterly compliance reviews and need continuous monitoring of their AWS infrastructure to meet regulatory requirements. I've been asked to create this infrastructure using **AWS CDK with Python** to deploy a complete compliance auditing platform.

The business requirement is straightforward but critical: they need automated monitoring of S3 bucket encryption, RDS encryption, and EC2 instance metadata configurations. Every quarter, auditors show up and want reports showing compliance status over time. Right now, they're doing this manually, which is error-prone and time-consuming.

The system should continuously scan resources, flag non-compliant ones, generate JSON reports, and alert the security team in real-time when issues are detected. All compliance reports need to be stored with versioning for audit trails spanning 7 years to satisfy regulatory requirements.

## What we need to build

Create a comprehensive compliance auditing system using **AWS CDK with Python** that continuously monitors infrastructure configurations and generates automated compliance reports.

### Core Requirements

1. **AWS Config Monitoring**
   - Deploy AWS Config with custom rules to monitor S3 bucket encryption
   - Monitor RDS instance encryption status
   - Enforce EC2 instance metadata service v2 (IMDSv2)
   - Use AWS managed rules where available to simplify maintenance
   - Configure Config delivery channel with SNS topic for real-time alerts
   - Exclude CloudWatch Logs from recording to avoid circular dependencies

2. **Compliance Report Generation**
   - Create Lambda function to aggregate non-compliant resources
   - Generate structured JSON compliance reports
   - Lambda function must use Python 3.9 runtime with arm64 architecture
   - Function timeout must not exceed 5 minutes
   - Include proper error handling and retry logic

3. **Report Storage and Retention**
   - Store compliance reports in S3 bucket with versioning enabled
   - Implement lifecycle policies for 7-year retention
   - Enable server-side encryption with AWS managed keys (SSE-S3)
   - All S3 buckets must use AWS managed keys for encryption

4. **Security and Access Control**
   - Implement IAM roles with least privilege access for Config and Lambda
   - Use correct AWS Config IAM managed policy: service-role/AWS_ConfigRole
   - Ensure Lambda execution role has only necessary permissions
   - Apply Environment=audit and CostCenter=compliance tags to ALL resources

5. **Monitoring and Alerting**
   - Set up CloudWatch Logs for Lambda with 30-day retention
   - Configure SNS topic with dead letter queue for failed notifications
   - Enable real-time alerts through SNS when non-compliance detected

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **AWS Config** for continuous configuration monitoring
- Use **Lambda** for report processing and aggregation
- Use **S3** for audit trail storage with versioning
- Use **CloudWatch Logs** for Lambda monitoring
- Use **SNS** for real-time alerting with DLQ configuration
- Use **IAM** for least privilege access control
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- All resources must have deletion protection disabled for testing

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter
- NO deletion protection (RemovalPolicy.RETAIN is FORBIDDEN)
- All resources must be destroyable for testing and cleanup
- Tag all resources with Environment=audit and CostCenter=compliance
- AWS Config recording must exclude CloudWatch Logs to prevent circular dependencies
- SNS topic must have a dead letter queue configured
- Lambda must use Python 3.9 runtime with arm64 architecture
- S3 buckets must use SSE-S3 encryption (AWS managed keys)

### Constraints

- All Config rules must use AWS managed rules where available
- Lambda function timeout must not exceed 5 minutes
- S3 buckets must have server-side encryption with AWS managed keys
- Config recording must exclude CloudWatch Logs to avoid circular dependencies
- SNS topic must have a dead letter queue configured
- All resources must have deletion protection disabled for testing
- Lambda function must use Python 3.9 runtime with arm64 architecture
- Config rules evaluate resources every 24 hours with change-triggered evaluations
- Reports stored in versioned S3 buckets with 7-year retention

## Success Criteria

- **Functionality**: AWS Config continuously monitors S3, RDS, and EC2 resources for compliance
- **Reporting**: Lambda successfully aggregates non-compliant resources into JSON reports
- **Storage**: Compliance reports stored in versioned S3 bucket with lifecycle policies
- **Alerting**: SNS delivers real-time notifications when non-compliance detected
- **Security**: IAM roles follow least privilege principle with correct managed policies
- **Monitoring**: CloudWatch Logs capture Lambda execution with 30-day retention
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Tagging**: All resources tagged with Environment=audit and CostCenter=compliance
- **Code Quality**: Clean Python code, well-tested, documented, deployable

## What to deliver

- Complete AWS CDK Python implementation in lib/ directory
- AWS Config with managed rules for S3, RDS, and EC2 monitoring
- Lambda function for compliance report generation (Python 3.9, arm64)
- S3 bucket with versioning and lifecycle policies
- IAM roles with least privilege (using service-role/AWS_ConfigRole)
- SNS topic with DLQ for alerting
- CloudWatch Logs configuration
- Unit tests for all components
- Documentation and deployment instructions
