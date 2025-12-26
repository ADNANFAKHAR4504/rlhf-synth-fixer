# Automated Infrastructure Compliance Scanning System

Hey team,

We need to build an automated compliance scanning system for a financial services company. They have regulatory requirements that mandate continuous monitoring of AWS resources and regular audit reports for both internal reviews and external auditors. The business wants this implemented using **Pulumi with Python** to track compliance across their production environment.

The compliance team has been manually checking resources against security standards, which is slow and error-prone. They need an automated solution that continuously validates EC2 instances, RDS databases, S3 buckets, and IAM resources. When resources drift out of compliance, the system should alert the team immediately and maintain a historical record for auditing purposes.

The finance department also wants automated reporting capabilities that can generate compliance summaries on demand. These reports need to be stored securely and versioned for audit trails.

## What we need to build

Create an automated infrastructure compliance scanning system using **Pulumi with Python** for continuous AWS resource validation and audit reporting.

### Core Requirements

1. **AWS Config Setup**
   - Enable AWS Config with recording for EC2, RDS, S3, and IAM resources
   - Create configuration recorder and delivery channel
   - Store configuration snapshots in S3

2. **Custom Compliance Rules (Lambda Functions)**
   - Lambda function to check EC2 instances for required tags
   - Lambda function to validate S3 bucket encryption is enabled
   - Lambda function to ensure RDS instances have automated backups configured
   - Each Lambda needs proper IAM execution role with minimal permissions

3. **Compliance History Storage**
   - DynamoDB table with partition key 'resource_id' and sort key 'evaluation_timestamp'
   - Store all compliance evaluation results for historical tracking
   - Enable point-in-time recovery for data protection

4. **Periodic Compliance Evaluation**
   - CloudWatch Events rules to trigger compliance evaluations every 6 hours
   - Integrate with Lambda functions for automated execution
   - Ensure consistent scheduling across all compliance rules

5. **Compliance Alerting**
   - SNS topic for sending compliance alerts
   - Email subscription endpoint for notifications
   - Publish alerts when resources fail compliance checks

6. **Report Generation**
   - Lambda function to aggregate compliance data from DynamoDB
   - Generate comprehensive JSON reports with compliance status
   - Include resource details, evaluation timestamps, and compliance scores

7. **Report Storage**
   - S3 bucket with versioning enabled for compliance reports
   - Secure bucket configuration with encryption at rest
   - Organized folder structure for easy report retrieval

8. **IAM Security**
   - Create least-privilege IAM roles for each Lambda function
   - Separate roles for Config recorder, compliance evaluators, and report generator
   - Follow principle of minimal required permissions

9. **Resource Tagging**
   - Apply tags to all resources: 'Environment:Production', 'Compliance:Required', 'ManagedBy:Pulumi'
   - Include **environmentSuffix** in resource names for uniqueness
   - Use naming convention: `{resource-type}-{environmentSuffix}`

10. **Required Outputs**
    - AWS Config recorder name
    - DynamoDB table name
    - SNS topic ARN
    - S3 report bucket name

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS Config** for resource compliance tracking
- Use **Lambda** for custom compliance rules and report generation
- Use **DynamoDB** for compliance history storage
- Use **SNS** for compliance alerts
- Use **CloudWatch Events** for periodic evaluation triggers
- Use **IAM** for least-privilege role definitions
- Use **S3** for report storage with versioning
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region
- Python 3.9+ runtime for Lambda functions
- boto3 library for AWS SDK operations

### Constraints

- Must support multi-account compliance scanning in future
- Compliance evaluations must complete within 5 minutes
- Reports must be generated in valid JSON format
- All Lambda functions must log to CloudWatch Logs
- SNS topic must support multiple subscription types
- DynamoDB table must support efficient time-range queries
- AWS Config must not exceed service limits

## Success Criteria

- **Functionality**: All compliance rules evaluate correctly on schedule
- **Performance**: Compliance evaluations complete within required timeframe
- **Reliability**: No missed evaluations or lost compliance data
- **Security**: IAM roles follow least-privilege principle
- **Auditability**: Complete compliance history stored in DynamoDB
- **Alerting**: SNS notifications sent for non-compliant resources
- **Reporting**: JSON reports generated and stored successfully
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: Python code, well-structured, properly documented
- **Destroyability**: All resources can be cleaned up completely

## Deployment Requirements (CRITICAL)

- All resources must be destroyable (no RETAIN policies, no deletion protection)
- Use Pulumi's protection=False for all resources or ensure default behavior allows deletion
- No deletion_protection=True allowed on RDS or DynamoDB
- Lambda functions must handle resource discovery using environmentSuffix
- S3 buckets must allow force deletion (force_destroy=True or equivalent)
- Resource names MUST include environmentSuffix for uniqueness

### Important AWS Config Guidance

- AWS Config recorder is account-level, limited to ONE per account
- Do NOT create multiple Config recorders - check if one exists first
- Use managed service role: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
- Config delivery channel requires S3 bucket for configuration snapshots

## What to deliver

- Complete Pulumi Python implementation
- `__main__.py` with all resource definitions
- `requirements.txt` with dependencies
- Lambda function code for:
  - EC2 tag compliance checker
  - S3 encryption validator
  - RDS backup verifier
  - Compliance report generator
- IAM roles with least-privilege policies
- CloudWatch Events rules for scheduling
- DynamoDB table with proper key schema
- SNS topic with email subscription
- S3 buckets for Config and reports
- AWS Config recorder and delivery channel
- Comprehensive resource tagging
- Stack outputs for key resource identifiers
- Documentation with deployment instructions