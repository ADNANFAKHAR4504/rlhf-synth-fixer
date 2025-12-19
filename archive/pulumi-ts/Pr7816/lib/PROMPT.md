# Automated Compliance System with AWS Config

Hey team,

We need to set up an automated compliance checking system for our AWS infrastructure. The business is concerned about security and compliance posture across our resources, and they want a proactive system that continuously monitors and reports on violations. I've been asked to build this using **Pulumi with TypeScript** so we can leverage our existing infrastructure-as-code patterns.

The main challenge here is that we have resources spread across our AWS account, and we need to ensure they meet our security standards - things like S3 buckets having encryption enabled and EC2 instances being properly tagged for cost tracking. Management wants real-time notifications when something violates our policies, plus regular compliance reports they can review.

## What we need to build

Create an automated compliance checking system using **Pulumi with TypeScript** for AWS Config that monitors and enforces security policies.

### Core Requirements

1. **S3 Storage for Config Data**
   - S3 bucket with versioning enabled to store Config snapshots
   - Store compliance results and historical data
   - Proper lifecycle policies for cost optimization

2. **AWS Config Setup**
   - Configuration recorder to track resource changes
   - Delivery channel to send data to S3
   - Enable recording for all supported resource types

3. **Compliance Rules**
   - Custom Config rule to verify S3 buckets have encryption enabled
   - Config rule to check EC2 instances have required tags (Environment, Owner, CostCenter)
   - Rules should evaluate on resource changes and periodic schedules

4. **Compliance Reporting**
   - Lambda function to aggregate compliance findings
   - Generate compliance reports automatically
   - Parse Config evaluation results and create summary reports

5. **Alerting System**
   - SNS topic for compliance violation notifications
   - Trigger notifications when resources become non-compliant
   - Email alerts to security team

6. **Monitoring Dashboard**
   - CloudWatch dashboard to visualize compliance metrics
   - Show compliance score, violations by resource type
   - Track trends over time

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Config** for continuous compliance monitoring
- Use **Lambda** (Python or Node.js) for report generation
- Use **S3** for Config snapshot storage with versioning
- Use **SNS** for compliance notifications
- Use **CloudWatch** for metrics dashboard
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region

### Security and IAM

- IAM role for AWS Config with least privilege
  - Use managed policy: `service-role/AWS_ConfigRole`
  - Grant S3 write permissions for Config delivery
  - Do NOT create GuardDuty detector (account-level resource, may already exist)
- IAM role for Lambda execution with minimum permissions
  - Config read permissions for evaluation results
  - S3 write for storing reports
  - SNS publish for notifications
  - CloudWatch Logs for function logging
- All S3 buckets must have encryption enabled
- Bucket policies to restrict access appropriately

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (use `retain: false` or equivalent)
- No RETAIN policies that would block stack cleanup
- Resource names must include environmentSuffix parameter for uniqueness
- All Lambda functions must handle errors gracefully
- Include proper logging with structured output
- AWS Config recorder is account-level (only one per region) - check if exists before creating
- Do NOT use Lambda reserved concurrency (account limit issues)

### Constraints

- Must work in shared AWS account (use environmentSuffix to avoid conflicts)
- Keep costs low - use serverless where possible
- All resources must support automated deployment and teardown
- Handle edge cases: Config recorder may already exist in account

## Success Criteria

- **Functionality**: Config recorder captures resource changes, rules evaluate compliance
- **Alerting**: SNS notifications sent when violations detected
- **Reporting**: Lambda generates compliance reports successfully
- **Monitoring**: CloudWatch dashboard displays compliance metrics
- **Security**: IAM roles follow least privilege principle
- **Resource Naming**: All resources include environmentSuffix in their names
- **Code Quality**: TypeScript code is well-typed, tested, and documented
- **Destroyability**: All resources can be deleted without errors

## What to deliver

- Complete Pulumi TypeScript implementation
- S3 bucket for Config data storage
- AWS Config recorder and delivery channel
- Custom Config rules for S3 encryption and EC2 tagging
- Lambda function for compliance report generation
- SNS topic for violation notifications
- CloudWatch dashboard for compliance visualization
- IAM roles with appropriate permissions
- Unit tests for all infrastructure components
- Documentation including deployment instructions

## Outputs Required

- Config recorder name
- S3 bucket ARN
- SNS topic ARN
