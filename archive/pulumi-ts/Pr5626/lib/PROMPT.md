# Automated Compliance Monitoring System

Hey team,

We need to build an automated compliance monitoring system for a financial services client. They're facing challenges keeping track of their AWS infrastructure compliance across multiple regions, and their compliance team is spending way too much time manually checking if resources meet regulatory requirements. I've been asked to create this using **Pulumi with TypeScript** to give them real-time visibility and automated alerting when things drift out of compliance.

The client operates primarily in Europe and needs their compliance infrastructure to monitor resources across their eu-west-1 deployment. They want a system that continuously evaluates their infrastructure against their compliance rules - checking things like whether EC2 instances are using approved instance types, if S3 buckets have encryption enabled, and if RDS databases have proper backup retention configured. The compliance team wants to get daily executive summaries and immediate alerts when critical violations occur.

This is a medium complexity project that needs to follow their strict security and operational guidelines. All infrastructure should be defined using Pulumi with TypeScript, and everything needs to be deployed to the eu-west-1 region. They're very particular about resource naming - every resource must include an environmentSuffix parameter for uniqueness across their environments.

## What we need to build

Create an automated compliance monitoring system using **Pulumi with TypeScript** that continuously validates AWS infrastructure configurations against defined compliance rules.

### Core Requirements

1. **AWS Config Setup**
   - Deploy AWS Config service with custom compliance rules
   - Create rule to check EC2 instance types are from approved list
   - Create rule to verify all S3 buckets have encryption enabled
   - Create rule to validate RDS backup retention periods meet minimum requirements
   - Configure rules to evaluate resources at least every 6 hours

2. **Compliance Processing Lambda Functions**
   - Lambda function to process AWS Config compliance results
   - Lambda function to generate detailed compliance reports in JSON format
   - Lambda function to aggregate daily compliance scores
   - Lambda function to generate executive summaries for management
   - All functions must use Node.js 18.x runtime
   - CloudWatch Logs retention set to 7 days for all Lambda functions

3. **Automated Remediation**
   - Lambda functions to automatically remediate specific violation types
   - Handle common remediation scenarios like enabling S3 encryption
   - Log all remediation actions for audit trail

4. **Scheduled Monitoring**
   - CloudWatch Events rules to trigger compliance checks every 6 hours
   - CloudWatch Events rules to schedule daily aggregation jobs
   - Automated execution without manual intervention

5. **Alert Management**
   - SNS topics for critical non-compliance alerts
   - Email subscriptions for the compliance team
   - Delivery retry policies configured for reliability
   - Different alert levels based on violation severity

6. **Report Storage**
   - S3 bucket for storing compliance reports
   - Server-side encryption using AWS KMS
   - Lifecycle policies with 30-day retention
   - Reports stored in JSON format for automated processing

7. **Compliance Dashboard**
   - CloudWatch Dashboard displaying key compliance metrics
   - Trend visualization showing compliance over time
   - Real-time visibility into current compliance status
   - Metrics for different compliance categories

8. **Multi-Region Aggregation**
   - Config aggregator to collect compliance data from multiple regions
   - Must include eu-west-1 and eu-west-1 regions
   - Centralized view of compliance across all regions

9. **Resource Tagging**
   - Apply Owner tag to all resources
   - Apply Environment tag to all resources
   - Apply ComplianceLevel tag to all resources
   - Consistent tagging across entire stack

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Config** for continuous compliance evaluation
- Use **Lambda** for processing, reporting, and remediation
- Use **CloudWatch Events** for scheduling and triggering
- Use **SNS** for alerting and notifications
- Use **S3** for compliance report storage
- Use **CloudWatch Dashboard** for metrics visualization
- Deploy to **eu-west-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Lambda runtime must be Node.js 18.x

### Security and Compliance Constraints

- All S3 buckets MUST have server-side encryption with AWS KMS
- IAM roles MUST follow least-privilege principle
- IAM policies MUST use specific resource ARNs, not wildcards
- Each Lambda function must have its own dedicated IAM role
- Lambda functions MUST have CloudWatch Logs retention set to 7 days
- SNS topics MUST have delivery retry policies configured
- All resources must be destroyable - no Retain deletion policies
- Proper error handling and logging throughout

### Operational Requirements

- Config rules must evaluate resources at least every 6 hours
- Compliance reports must be in JSON format
- Lambda runtime must be Node.js 18.x
- Config aggregator must include both eu-west-1 and eu-west-1
- CloudWatch Logs retention exactly 7 days
- S3 lifecycle policies set to 30-day retention

## Success Criteria

- **Functionality**: All AWS Config rules properly evaluate compliance every 6 hours
- **Monitoring**: CloudWatch Dashboard displays real-time compliance metrics and trends
- **Alerting**: SNS notifications sent immediately for critical violations
- **Reporting**: Daily compliance reports generated and stored in S3 in JSON format
- **Remediation**: Automated fixes applied for specific violation types
- **Multi-Region**: Config aggregator successfully collects data from both regions
- **Security**: All security constraints met - encryption, IAM, logging
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: TypeScript implementation with proper typing and error handling
- **Documentation**: Clear instructions for deployment and usage

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Lambda function code for compliance processing
- Lambda function code for report generation
- Lambda function code for daily aggregation
- Lambda function code for automated remediation
- AWS Config rules for EC2, S3, and RDS compliance
- CloudWatch Events for scheduling
- SNS topics with email subscriptions and retry policies
- S3 bucket with encryption and lifecycle policies
- CloudWatch Dashboard with compliance metrics
- Config aggregator for multi-region data collection
- IAM roles and policies following least-privilege
- Comprehensive documentation in lib/IDEAL_RESPONSE.md
- Deployment instructions and testing procedures
