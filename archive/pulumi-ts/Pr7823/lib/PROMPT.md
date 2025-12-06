# AWS Compliance Monitoring System

Hey team,

We need to build an automated compliance checking system that monitors our AWS resources and helps us stay on top of security best practices and organizational policies. I've been asked to create this infrastructure using Pulumi with TypeScript. The business is concerned about configuration drift and wants real-time visibility into resource compliance across our AWS environment.

Right now, we have resources scattered across accounts without consistent monitoring. Security teams manually review configurations periodically, which is time-consuming and error-prone. We need an automated solution that continuously evaluates our resources against defined standards and alerts us when something doesn't comply.

The system should focus on three critical areas: S3 bucket encryption (we've had issues with unencrypted buckets in the past), EC2 instance tagging for cost allocation and ownership tracking, and IAM password policies to ensure account security. We want daily reports summarizing the compliance status so leadership can track our security posture over time.

## What we need to build

Create an automated compliance checking system using **Pulumi with TypeScript** for continuous AWS resource monitoring and evaluation.

### Core Requirements

1. **AWS Config Setup**
   - Deploy AWS Config service with custom configuration rules
   - Create rules to check S3 bucket encryption status
   - Create rules to verify EC2 instance tagging standards (Environment, Owner, CostCenter tags required)
   - Create rules to validate IAM password policies compliance
   - Enable configuration recorder and delivery channel

2. **Storage and Reporting**
   - Create S3 bucket with versioning enabled for Config snapshots
   - Store compliance reports in the same bucket
   - Bucket must support secure storage of configuration history

3. **Compliance Processing**
   - Deploy Lambda function to process Config evaluation results
   - Lambda should generate compliance summary reports
   - Reports should aggregate findings and provide actionable insights
   - Schedule Lambda to run daily at 2 AM UTC using EventBridge

4. **Alerting System**
   - Configure CloudWatch alarms for non-compliant resource detection
   - Set up SNS topic for compliance notifications
   - Ensure alerts are triggered when resources fail compliance checks

5. **Security and Access Control**
   - Implement IAM roles with least-privilege access for Config service
   - Create IAM role for Lambda function with minimum required permissions
   - Follow AWS best practices for service-to-service authentication

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS Config for continuous compliance monitoring
- Use S3 for snapshot and report storage with versioning enabled
- Use Lambda for compliance report generation (Node.js 18.x or higher runtime)
- Use EventBridge for scheduled Lambda execution (daily at 2 AM UTC)
- Use CloudWatch and SNS for alerting on non-compliant resources
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to us-east-1 region
- IAM role for AWS Config must use the managed policy service-role/AWS_ConfigRole

### Constraints

- All resources must be destroyable (no RemovalPolicy.RETAIN or deletionProtection: true)
- Lambda function must handle AWS SDK v3 (Node.js 18+ does not bundle aws-sdk v2)
- AWS Config rules must be created but not GuardDuty detectors (one per account limitation)
- S3 bucket versioning is mandatory for compliance audit trail
- EventBridge schedule must be cron-based for 2 AM UTC execution
- Include proper error handling and logging in Lambda function
- All IAM policies must follow principle of least privilege

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: All resource names must include the environmentSuffix parameter to ensure uniqueness across environments. Use pattern: resource-name-environmentSuffix
- **Destroyability**: All resources must be fully destroyable. Do NOT use RemovalPolicy.RETAIN or deletionProtection: true on any resource
- **AWS Config IAM**: Use the correct managed policy arn:aws:iam::aws:policy/service-role/AWS_ConfigRole for the Config service role
- **Lambda Runtime**: Use Node.js 18.x or higher. The AWS SDK v3 must be explicitly imported or data extracted from Config event payloads

## Success Criteria

- **Functionality**: Config rules successfully evaluate S3 encryption, EC2 tagging, and IAM policies
- **Storage**: S3 bucket stores Config snapshots with versioning enabled
- **Processing**: Lambda generates compliance reports on schedule and on-demand
- **Alerting**: CloudWatch alarms trigger SNS notifications for non-compliant resources
- **Scheduling**: EventBridge triggers Lambda daily at 2 AM UTC
- **Security**: IAM roles follow least-privilege with appropriate service trust policies
- **Resource Naming**: All resources include environmentSuffix in their names
- **Code Quality**: TypeScript code is well-structured, typed, and documented

## What to deliver

- Complete Pulumi TypeScript implementation with TapStack component
- AWS Config with custom rules for S3, EC2, and IAM compliance checks
- S3 bucket with versioning for Config data and reports
- Lambda function (TypeScript or JavaScript) for compliance report generation
- EventBridge rule for daily 2 AM UTC scheduling
- CloudWatch alarms and SNS topic for alerting
- IAM roles for Config and Lambda with least-privilege policies
- Stack outputs: Config recorder name, S3 bucket ARN, Lambda function name
- Unit tests for infrastructure components
- Documentation with deployment instructions and usage examples
