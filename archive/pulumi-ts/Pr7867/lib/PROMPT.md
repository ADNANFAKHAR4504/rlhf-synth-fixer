# Infrastructure Compliance Monitoring System

Hey team,

We need to build a comprehensive infrastructure compliance monitoring system for our EC2 instances. I've been asked to create this using **Pulumi with TypeScript**. The business wants automated scanning, reporting, and alerting for EC2 instances that don't have the proper tags.

The compliance team is struggling with manual audits and needs an automated solution that runs continuously, stores historical data, and sends alerts when violations are found. They also need daily summary reports in JSON format for their compliance dashboard.

## What we need to build

Create an infrastructure compliance monitoring system using **Pulumi with TypeScript** that automatically scans EC2 instances for compliance violations and generates reports.

### Core Requirements

1. **Storage Infrastructure**
   - S3 bucket with versioning enabled for audit trail
   - Store compliance scan results and daily reports
   - Lifecycle policy to transition reports older than 90 days to Glacier storage (not delete, transition)
   - All resources must include **environmentSuffix** for uniqueness

2. **Compliance Scanner Lambda**
   - Scan all EC2 instances in the region for required tags: Environment, Owner, CostCenter
   - Check security group rules for compliance
   - Triggered automatically every 6 hours via EventBridge/CloudWatch Events
   - Store scan results in S3 bucket
   - Publish CloudWatch metrics for compliance percentage
   - Send SNS notifications when violations are found

3. **Daily Report Generator Lambda**
   - Generate daily compliance reports in JSON format
   - Aggregate compliance data from the previous 24 hours
   - Store reports in S3 bucket
   - Run automatically once per day

4. **Monitoring and Alerting**
   - CloudWatch Logs for both Lambda functions with 30-day retention
   - CloudWatch alarms for Lambda function failures (both functions)
   - CloudWatch alarm for Lambda duration exceeding 5 minutes (both functions)
   - SNS topic with email subscription for all alerts and notifications

5. **Security and Access Control**
   - IAM roles and policies following least privilege principles
   - Lambda execution role with minimal required permissions
   - Separate permissions for S3, EC2, CloudWatch, and SNS access

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for report storage with versioning and Glacier lifecycle
- Use **Lambda** (two functions: scanner and report generator)
- Use **CloudWatch Events/EventBridge** for scheduling (6-hour scanner, daily reports)
- Use **CloudWatch Logs** with 30-day retention for Lambda execution logs
- Use **CloudWatch Alarms** for Lambda failures and duration thresholds (>5 minutes)
- Use **SNS** for email notifications and alarm actions
- Use **IAM** for least privilege access control
- Use **EC2** describe permissions for scanning instances
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: All resource names MUST include this suffix for uniqueness and parallel deployments
- **Destroyability**: All resources must use DESTROY removal policy (no Retain or Snapshot policies)
- **S3 Lifecycle**: Must TRANSITION to Glacier after 90 days, not expire/delete
- **Log Retention**: CloudWatch Logs must have exactly 30-day retention (not 7 days)
- **Two Lambda Functions**: One for scanning (every 6 hours), one for daily reports
- **Node.js 18+ Lambda**: Use AWS SDK v3 clients (do not set AWS_REGION environment variable - Lambda provides it automatically)

### Constraints

- Lambda functions must complete within 5 minutes (timeout: 300 seconds)
- Scanner runs every 6 hours, report generator runs daily
- All scan results and reports stored in S3 for audit history
- CloudWatch alarms must trigger on Lambda failures and duration >5 minutes
- SNS email address configurable via Pulumi config
- All resources must have appropriate tags including Environment
- Follow least privilege IAM principles - no overly broad permissions

## Success Criteria

- **Functionality**: Both Lambda functions deploy and execute successfully
- **Monitoring**: CloudWatch alarms trigger correctly for failures and long-running functions
- **Storage**: S3 versioning enabled, lifecycle policy transitions to Glacier (not expires)
- **Logging**: CloudWatch Logs configured with 30-day retention
- **Alerting**: SNS notifications sent for compliance violations and Lambda failures
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: TypeScript code with proper error handling and logging
- **IAM Security**: Least privilege permissions for all operations

## What to deliver

- Complete Pulumi TypeScript implementation in lib/index.ts
- Two Lambda functions:
  - Compliance scanner (lib/lambda/scanner/index.js) - scans EC2 instances every 6 hours
  - Report generator (lib/lambda/reporter/index.js) - generates daily JSON reports
- S3 bucket with versioning and Glacier lifecycle policy
- CloudWatch Events/EventBridge rules for both Lambda functions (6-hour and daily schedules)
- CloudWatch Log Groups with 30-day retention for both functions
- CloudWatch Alarms for Lambda failures and duration >5 minutes (both functions)
- SNS topic with email subscription
- IAM roles and policies with least privilege
- Stack outputs: S3 bucket name, SNS topic ARN, both Lambda function names
- Documentation in lib/README.md with deployment instructions
