# Infrastructure Quality Assurance System

Hey team,

We need to build an automated infrastructure quality assurance system that continuously monitors our AWS environment for compliance issues. The business is concerned about untagged resources and misconfigured services that could lead to security vulnerabilities and cost overruns. I've been asked to create this monitoring solution in TypeScript using Pulumi.

The system needs to automatically scan our EC2 instances, S3 buckets, and RDS databases to ensure they meet our organizational standards. We're particularly concerned about resources that are missing required tags like Environment, Owner, and CostCenter. These tags are critical for our cost allocation and accountability processes. Additionally, we need to catch S3 buckets that might be publicly accessible, as that's a major security risk.

Management wants alerts when compliance drops below acceptable levels, and they want a dashboard where they can see compliance metrics at a glance. We also need to keep a history of our compliance scans so we can track trends over time and demonstrate improvement to auditors.

## What we need to build

Create an automated infrastructure compliance monitoring system using **Pulumi with TypeScript** that continuously scans AWS resources and alerts on violations.

### Core Requirements

1. **EC2 Tagging Compliance Scanner**
   - Lambda function to scan all EC2 instances for required tags (Environment, Owner, CostCenter)
   - Automated execution every 6 hours using EventBridge scheduled rule
   - Publish compliance metrics to CloudWatch custom namespace

2. **S3 Security Configuration Scanner**
   - Lambda function to analyze S3 bucket configurations for public access violations
   - Detect buckets with public read/write permissions
   - Report findings to CloudWatch metrics

3. **Compliance Metrics and Monitoring**
   - Custom CloudWatch namespace 'InfraQA/Compliance' for all metrics
   - Track percentage of compliant vs non-compliant resources
   - Metrics for EC2 tag compliance, S3 security compliance, and RDS configurations
   - CloudWatch dashboard displaying real-time compliance status across all resource types

4. **Alerting and Notifications**
   - CloudWatch alarms that trigger when more than 10% of resources are non-compliant
   - SNS topic for alert delivery
   - Email subscription to receive notifications

5. **Compliance History Tracking**
   - DynamoDB table to store scan results and historical compliance data
   - TTL configured for 30 days to automatically remove old records
   - Partition key design optimized for querying by resource type and time range

6. **Security and IAM**
   - IAM roles for Lambda functions following least-privilege principle
   - Read-only permissions to scan EC2, S3, and RDS resources
   - Write permissions only for CloudWatch metrics and DynamoDB table
   - Separate role for each Lambda function with minimal required permissions

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** for compliance scanning functions
- Use **Amazon EventBridge** (CloudWatch Events) for scheduling scans every 6 hours
- Use **Amazon CloudWatch** for metrics, alarms, and dashboard
- Use **Amazon SNS** for alert notifications
- Use **Amazon DynamoDB** for scan history storage with TTL
- Use **AWS IAM** for security roles and policies
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Lambda runtime: Node.js 18.x or later

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain deletion policies)
- RemovalPolicy must be DESTROY for DynamoDB table
- Use environmentSuffix parameter in all resource names for environment isolation
- Lambda functions should be self-contained with inline code or code assets
- No hardcoded account IDs or region names (use Pulumi SDK functions)

### Constraints

- Scan must run automatically every 6 hours without manual intervention
- Alarm threshold must be configurable but default to 10% non-compliant
- DynamoDB scan records must automatically expire after 30 days using TTL
- Lambda functions must handle errors gracefully and log to CloudWatch
- No external dependencies for Lambda code (use AWS SDK v3 included in Node.js 18+)
- Dashboard must be readable and show all three resource types (EC2, S3, RDS)
- SNS email subscription requires manual confirmation (document this)

## Success Criteria

- **Functionality**: Lambda functions successfully scan EC2 instances and S3 buckets on schedule
- **Monitoring**: CloudWatch dashboard displays compliance metrics for all resource types
- **Alerting**: Alarms trigger and send notifications when threshold exceeded
- **History**: Compliance scan results are stored in DynamoDB with automatic 30-day expiration
- **Security**: All Lambda functions use least-privilege IAM roles with only required permissions
- **Resource Naming**: All resources include environmentSuffix in their names
- **Code Quality**: TypeScript code is well-structured, typed, and documented
- **Destroyability**: All resources can be cleanly destroyed without manual intervention

## What to deliver

- Complete Pulumi TypeScript implementation
- Lambda functions for EC2 tag scanning and S3 security analysis
- EventBridge rule scheduling scans every 6 hours
- CloudWatch metrics in 'InfraQA/Compliance' namespace
- CloudWatch alarms with 10% non-compliance threshold
- CloudWatch dashboard showing EC2, S3, and RDS compliance
- SNS topic with email subscription configuration
- DynamoDB table with 30-day TTL configuration
- IAM roles and policies following least-privilege principle
- Clear deployment instructions and documentation