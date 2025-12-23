Hey team,

We need to build an automated EC2 tag compliance monitoring system for our AWS infrastructure. The operations team has been struggling with inconsistent tagging across our EC2 instances, which makes cost allocation and compliance auditing difficult. I've been asked to create this in TypeScript using Pulumi to give us better type safety and infrastructure validation.

The business wants an automated system that checks EC2 tag compliance every 6 hours, generates detailed reports, sends alerts when non-compliant instances are found, and provides a dashboard for monitoring. They also want historical analysis capabilities using Athena so we can track compliance trends over time.

This system needs to be production-ready with proper security controls, least-privilege IAM permissions, and comprehensive monitoring. The goal is to catch tagging issues early before they become audit problems.

## What we need to build

Create an EC2 tag compliance monitoring system using **Pulumi with TypeScript** for automated infrastructure quality assurance.

### Core Requirements

1. **Tag Compliance Checking**
   - Lambda function that scans all EC2 instances in the account
   - Validates presence of required tags (e.g., Environment, Owner, CostCenter, Project)
   - Identifies non-compliant instances with missing or invalid tags
   - Generates compliance reports in JSON format

2. **Report Storage and Versioning**
   - S3 bucket for storing compliance reports
   - Enable versioning to track historical compliance data
   - Organize reports by date/time for easy retrieval
   - Lifecycle policies for cost optimization

3. **Alerting System**
   - SNS topic for sending compliance alerts
   - Trigger notifications when non-compliant instances are found
   - Include instance details and missing tags in alerts
   - Support email and other SNS-compatible notification methods

4. **Scheduled Execution**
   - CloudWatch Events rule (EventBridge) running every 6 hours
   - Trigger Lambda function automatically on schedule
   - Ensure reliable execution with proper error handling

5. **Monitoring Dashboard**
   - CloudWatch Dashboard displaying compliance metrics
   - Show total instances scanned, compliant vs non-compliant counts
   - Display recent scan results and trends
   - Include Lambda execution metrics (duration, errors, invocations)

6. **Historical Analysis**
   - AWS Glue Crawler to catalog report data in S3
   - Glue Database and Table for structured queries
   - Athena for ad-hoc analysis of compliance history
   - Enable SQL queries for trend analysis and reporting

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** for tag compliance scanning logic
- Use **Amazon S3** for report storage with versioning enabled
- Use **Amazon SNS** for alerting non-compliant resources
- Use **Amazon CloudWatch Events** for 6-hour scheduled triggers
- Use **Amazon CloudWatch Dashboard** for monitoring and visualization
- Use **AWS Glue** for data cataloging and schema inference
- Use **Amazon Athena** for SQL-based historical analysis
- Use **IAM Roles** with least-privilege permissions for all resources
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region
- Lambda runtime: Node.js 18.x or higher (AWS SDK v3 available by default)

### Constraints

- IAM permissions must follow least-privilege principle
- Lambda function needs EC2 read permissions (ec2:DescribeInstances, ec2:DescribeTags)
- Lambda needs S3 write permissions to specific bucket only
- Lambda needs SNS publish permissions to specific topic only
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging in Lambda code
- CloudWatch Logs retention for Lambda execution logs
- S3 bucket must have versioning enabled
- Glue Crawler should run on-demand or scheduled separately
- No hardcoded values - use Pulumi config for customization

### Deployment Requirements (CRITICAL)

- All resource names MUST include `environmentSuffix` parameter from Pulumi config
- Use string interpolation: `${resourceType}-${environmentSuffix}`
- All resources MUST be destroyable - no `retainOnDelete: true` or Retain deletion policies
- Lambda function must handle AWS SDK v3 (available in Node.js 18+)
- Proper CloudWatch Logs configuration for Lambda debugging
- S3 bucket names must be globally unique using environmentSuffix
- SNS topic names must be unique within account using environmentSuffix

## Success Criteria

- **Functionality**: Lambda successfully scans EC2 instances and validates tags
- **Functionality**: Reports are stored in S3 with proper versioning
- **Functionality**: SNS alerts are sent when non-compliant instances exist
- **Functionality**: CloudWatch Events trigger Lambda every 6 hours
- **Functionality**: Dashboard displays real-time compliance metrics
- **Functionality**: Athena can query historical compliance data
- **Performance**: Lambda execution completes within reasonable time (<5 minutes)
- **Reliability**: Scheduled execution runs consistently without failures
- **Security**: IAM roles follow least-privilege access principle
- **Security**: No overly broad permissions (e.g., no * resources)
- **Resource Naming**: All resources include environmentSuffix from config
- **Code Quality**: TypeScript with proper types, well-tested, documented
- **Destroyability**: All resources can be cleanly destroyed with pulumi destroy

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- Lambda function code for EC2 tag compliance checking
- S3 bucket with versioning for compliance reports
- SNS topic for alerting
- CloudWatch Events rule for 6-hour schedule
- CloudWatch Dashboard with compliance metrics
- AWS Glue Crawler, Database, and Table for data cataloging
- Athena workgroup or query configuration
- IAM roles and policies with least-privilege permissions
- Unit tests for all Pulumi resources
- Documentation covering deployment and usage
- Configuration instructions for environmentSuffix parameter
