# AWS Config Compliance Analysis System

Hey team,

We need to build an automated infrastructure compliance monitoring system for our organization. The compliance team has been manually reviewing CloudFormation stacks for security violations and tagging standards, and it's become unsustainable. We're getting deployments that don't meet our security baseline, resources without proper tags, and security groups with overly permissive rules.

I've been asked to create this in JSON using CloudFormation. The business wants real-time compliance checking with automated notifications when violations occur, plus the ability to generate compliance reports for audit purposes.

This needs to work across our entire AWS organization, evaluating resources as they're deployed and flagging any that don't meet our standards. We also need remediation capabilities so teams can quickly fix violations without manual intervention.

## What we need to build

Create an automated compliance analysis system using **CloudFormation with JSON** for continuous infrastructure security and compliance monitoring in AWS.

### Core Requirements

1. **AWS Config Setup**
   - Deploy AWS Config with configuration recorder and delivery channel
   - Use SSE-S3 encryption for configuration snapshots
   - Enable resource recording for all supported resource types
   - Configure evaluation frequency within 15 minutes of resource changes

2. **Compliance Rules**
   - Mandatory tag validation: Environment, Owner, CostCenter tags required on all resources
   - Encrypted storage checks for RDS instances, S3 buckets, and EBS volumes
   - Security group validation: prohibit 0.0.0.0/0 ingress on SSH (22) and RDP (3389)
   - Custom Config rules for organization-specific policies

3. **Lambda Processing**
   - Python 3.11 runtime with 256MB memory allocation
   - Process Config evaluation results and generate compliance reports
   - Custom rule evaluation logic for complex compliance scenarios
   - Reserved concurrent executions set to prevent throttling
   - Comprehensive error handling and logging

4. **Compliance Reporting**
   - Store compliance reports in S3 with versioning enabled
   - Implement 90-day lifecycle retention policy
   - Block all public access to compliance data
   - Generate reports in JSON format with timestamps

5. **Notification System**
   - SNS topic for critical non-compliance findings
   - KMS encryption using customer-managed keys (not AWS managed)
   - Email subscriptions for compliance team
   - Severity-based alerting

6. **Remediation Support**
   - SSM automation documents for common violations
   - Automated tag addition for missing required tags
   - Security group rule removal for overly permissive rules
   - Integration with Config rules for automatic remediation

7. **Cross-Account Analysis**
   - Config aggregator for organization-wide visibility
   - Support multi-account compliance reporting
   - Centralized compliance dashboard data

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS Config** for continuous compliance monitoring
- Use **AWS Lambda** for custom evaluation and report generation
- Use **Amazon S3** for compliance report storage with lifecycle policies
- Use **Amazon SNS** with KMS encryption for notifications
- Use **AWS IAM** with custom inline policies (NO AWS managed policies)
- Use **AWS Systems Manager** for remediation automation documents
- Use **AWS KMS** for customer-managed encryption keys
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-{environment-suffix}
- Deploy to **us-east-1** region
- All resources must be fully destroyable (no Retain policies, no DeletionProtection)

### Deployment Requirements (CRITICAL)

- All Lambda functions MUST have ReservedConcurrentExecutions property set
- Lambda execution roles MUST use custom inline policies, not AWS managed policies
- SNS topics MUST use KMS encryption with customer-managed keys (create KMS key in template)
- S3 buckets MUST have versioning enabled and PublicAccessBlockConfiguration
- Config delivery channel MUST use SSE-S3 server-side encryption
- All resources MUST include environmentSuffix in their names for multi-environment support
- NO resources with DeletionPolicy: Retain or DeletionProtectionEnabled: true

### Constraints

- Config rules evaluate resources within 15 minutes of deployment
- Lambda memory fixed at 256MB, Python 3.11 runtime only
- S3 buckets must have versioning and block public access enabled
- Config snapshots encrypted with SSE-S3 (AWS managed S3 encryption)
- Lambda roles must use custom inline policies with least-privilege access
- SNS encryption must use customer-managed KMS keys (not AWS managed)
- All Lambda functions require reserved concurrency to prevent throttling
- Support SSM automation documents for remediation workflows

## Success Criteria

- Functionality: AWS Config evaluates all resources against defined rules within 15 minutes
- Security: All data encrypted in transit and at rest with appropriate KMS keys
- Compliance: Detects missing tags, unencrypted storage, and overly permissive security groups
- Reporting: Generates compliance reports stored in S3 with 90-day retention
- Notifications: SNS alerts sent for critical violations with KMS encryption
- Remediation: SSM documents available for automated violation fixes
- Resource Naming: All resources include environmentSuffix parameter in names
- Code Quality: CloudFormation JSON, properly structured, follows AWS best practices

## What to deliver

- Complete CloudFormation JSON template (lib/TapStack.json)
- Lambda function code for compliance evaluation and report generation (Python 3.11)
- SSM automation documents for common remediation scenarios
- IAM roles and policies with least-privilege inline policies
- KMS key for SNS topic encryption
- S3 bucket with lifecycle policies and encryption
- Config rules for tag validation, encryption checks, security group validation
- SNS topic with KMS encryption configuration
- Comprehensive unit and integration tests
- Documentation including deployment instructions and usage examples
