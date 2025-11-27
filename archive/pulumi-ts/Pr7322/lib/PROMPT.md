# Security Compliance Monitoring Infrastructure

Hey team,

We've got a financial services client that needs to meet SOC2 compliance requirements, and they need automated infrastructure monitoring to keep track of configuration drift and policy violations. The compliance team has been doing manual audits which is time-consuming and error-prone, so they want a system that continuously monitors their cloud resources and alerts them when something goes wrong. I've been tasked with building this using **Pulumi with TypeScript** to deploy an automated compliance scanning system on AWS.

The company runs critical infrastructure on AWS including EC2 instances, RDS databases, and S3 buckets. They need continuous monitoring for configuration changes and want to detect non-compliant resources automatically. The business wants critical violations reported immediately through notifications, and they need a centralized dashboard to see their compliance posture at a glance. They also want to maintain an audit trail of all compliance findings for their SOC2 audits.

This is an expert-level implementation that needs to handle enterprise-scale compliance monitoring with proper error handling, tracing, and storage of audit data. The system should be able to scan resources every 6 hours and maintain a complete history of compliance violations.

## What we need to build

Create a comprehensive compliance monitoring system using **Pulumi with TypeScript** for automated infrastructure compliance scanning.

### Core Requirements

1. **AWS Config Setup**
   - Enable AWS Config service with recording for EC2, RDS, and S3 resources
   - Create configuration recorder to capture resource changes
   - Configure delivery channel to store configuration snapshots
   - Use IAM role with AWS managed policy: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole

2. **Compliance Analysis**
   - Create Lambda function to analyze Config snapshots and detect non-compliant resources
   - Lambda must use Node.js 18.x runtime with 256MB memory allocation
   - Lambda must use AWS SDK v3 (NOT aws-sdk v2)
   - Enable X-Ray tracing on all Lambda functions for debugging
   - Implement dead letter queue for failed Lambda executions

3. **Data Storage**
   - DynamoDB table to store compliance scan results
   - Table must have partition key 'resourceId' and sort key 'timestamp'
   - Use on-demand billing mode for DynamoDB
   - S3 bucket for Config delivery with AES256 encryption
   - Enable versioning on S3 bucket
   - Configure intelligent tiering and lifecycle policies on S3

4. **Automation and Scheduling**
   - EventBridge rule to trigger compliance scans every 6 hours
   - Automated event-driven scanning when Config detects changes

5. **Alerting and Monitoring**
   - SNS topic for critical compliance violations
   - CloudWatch dashboard showing compliance metrics
   - CloudWatch alarms for system health

6. **Optional Enhancements**
   - Systems Manager automation for auto-remediation of common violations
   - Step Functions for complex multi-step remediation workflows
   - Athena integration for SQL queries on compliance data

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Config** for configuration recording and tracking
- Use **Lambda** for compliance analysis with Node.js 18.x runtime
- Use **DynamoDB** with on-demand billing for storing compliance results
- Use **S3** for Config delivery and audit storage
- Use **EventBridge** for scheduling and event-driven triggers
- Use **SNS** for critical violation notifications
- Use **CloudWatch** for dashboards and metrics
- Use **X-Ray** for Lambda tracing
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** variable for uniqueness
- Follow naming convention: {resource-type}-{purpose}-environment-suffix
- All resources must be destroyable (no Retain deletion policies)
- Lambda functions must use AWS SDK v3 (import from @aws-sdk packages)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Variable**: All named resources MUST include an environmentSuffix parameter to ensure uniqueness across deployments. This includes S3 buckets, DynamoDB tables, Lambda functions, IAM roles, SNS topics, and CloudWatch resources.
- **Destroyability**: All resources MUST be fully destroyable. Do NOT use Retain deletion policies. S3 buckets should allow deletion even with content (use autoDeleteObjects or similar).
- **AWS Config IAM Policy**: The Config service role MUST use the AWS managed policy arn:aws:iam::aws:policy/service-role/AWS_ConfigRole for proper permissions.
- **Lambda SDK Version**: Lambda functions using Node.js 18.x or higher MUST use AWS SDK v3. Import from @aws-sdk/client-* packages, NOT from 'aws-sdk'.
- **X-Ray Tracing**: All Lambda functions MUST have X-Ray tracing enabled (TracingConfig with mode Active).

### Constraints

- Lambda functions require Node.js 18.x runtime with 256MB memory
- DynamoDB must use on-demand billing mode for cost efficiency
- S3 buckets must have versioning enabled for audit compliance
- All asynchronous operations must have dead letter queues
- EventBridge schedules must trigger scans every 6 hours
- Config recording must be limited to EC2, RDS, and S3 resources to control costs
- All Lambda functions must have X-Ray tracing enabled
- Private communication between services should use VPC when necessary
- Follow AWS Well-Architected Framework for security and reliability

## Success Criteria

- **Functionality**: AWS Config successfully records configuration changes for EC2, RDS, and S3 resources
- **Compliance Detection**: Lambda function correctly analyzes snapshots and identifies non-compliant resources
- **Data Persistence**: Compliance results are stored in DynamoDB with correct schema (resourceId, timestamp)
- **Audit Trail**: Config snapshots are stored in S3 with encryption and versioning
- **Automation**: EventBridge successfully triggers scans every 6 hours
- **Alerting**: SNS notifications are sent for critical violations
- **Visibility**: CloudWatch dashboard displays compliance metrics
- **Observability**: X-Ray tracing is enabled and working for all Lambda functions
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be fully destroyed without manual intervention
- **Code Quality**: TypeScript code is well-structured, properly typed, and follows best practices

## What to deliver

- Complete Pulumi TypeScript implementation in the lib/ directory
- AWS Config configuration with recording enabled for EC2, RDS, and S3
- Lambda function for compliance analysis (Node.js 18.x, AWS SDK v3)
- DynamoDB table for compliance results with correct schema
- S3 bucket for Config delivery with encryption and versioning
- EventBridge rule for 6-hour scanning schedule
- SNS topic for critical violation alerts
- CloudWatch dashboard for compliance metrics
- X-Ray tracing configuration for all Lambda functions
- Proper IAM roles and policies for all services
- Dead letter queues for error handling
- Lambda function code in lib/lambda/ or lib/functions/ directory
- README.md documentation with deployment instructions in lib/
