Hey team,

We need to build an automated infrastructure compliance monitoring system for our AWS environment. The business is concerned about maintaining proper resource tagging standards across our infrastructure, and they want a solution that continuously monitors compliance and alerts us when resources don't meet our policies.

I've been asked to create this solution using TypeScript with Pulumi. The main challenge is that we have resources spread across EC2, RDS, and S3, and we need to ensure every resource has proper tags for Environment, CostCenter, and Owner. Right now, compliance checks are manual and time-consuming, leading to gaps in our governance posture.

The system should run automated scans every 6 hours, generate detailed reports showing which resources are missing required tags, and immediately alert the operations team via email when non-compliant resources are discovered. All compliance reports need to be stored in S3 with versioning so we can track compliance trends over time.

## What we need to build

Create an automated infrastructure compliance monitoring system using **Pulumi with TypeScript** for continuously auditing AWS resource tagging compliance.

### Core Requirements

1. **Compliance Scanning Lambda Function**
   - Scan EC2 instances, RDS databases, and S3 buckets for required tags
   - Check for presence of Environment, CostCenter, and Owner tags
   - Generate detailed compliance reports in JSON format
   - Include resource ID, type, missing tags, and last modified date in reports

2. **Automated Scheduling**
   - Configure CloudWatch Events to trigger Lambda every 6 hours
   - Ensure reliable execution with proper error handling

3. **Report Storage**
   - Deploy S3 bucket with versioning enabled
   - Store compliance reports with timestamps
   - Implement proper lifecycle management

4. **Alert System**
   - Create SNS topic for compliance notifications
   - Configure email subscription for operations team
   - Send alerts for non-compliant resources with details

5. **Observability**
   - Set up CloudWatch Logs for Lambda execution logs
   - Configure 30-day log retention period
   - Enable detailed logging for troubleshooting

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Lambda** for compliance scanning logic
- Use **CloudWatch Events/EventBridge** for scheduled triggers
- Use **S3** for report storage with versioning
- Use **SNS** for alert notifications
- Use **CloudWatch Logs** for execution logging
- Use **IAM** for least-privilege access controls
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Lambda environment variables for required tag names and SNS topic ARN

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - NO Retain policies allowed
- Use proper RemovalPolicy settings for cleanup
- Include environmentSuffix parameter for all named resources to avoid conflicts
- This is essential for testing and cleanup in automation pipelines

### IAM and Security

- Create IAM roles with least-privilege policies
- Lambda needs read permissions for EC2, RDS, and S3
- Lambda needs write permissions to S3 for reports
- Lambda needs publish permissions to SNS
- No overly permissive wildcard policies

### Constraints

- Lambda must handle errors gracefully without failing silently
- Reports must be timestamped and uniquely named
- All compliance data must be structured as valid JSON
- Email subscription to SNS must be configurable
- System must handle large numbers of resources efficiently

## Success Criteria

- Functionality: Lambda scans all specified resource types for required tags
- Automation: Compliance scans run every 6 hours automatically
- Reporting: Detailed JSON reports stored in versioned S3 bucket
- Alerting: Email notifications sent for non-compliant resources
- Security: IAM roles follow least-privilege principle
- Observability: CloudWatch Logs capture all Lambda executions with 30-day retention
- Resource Naming: All resources include environmentSuffix for uniqueness
- Code Quality: TypeScript implementation with proper error handling and documentation

## What to deliver

- Complete Pulumi TypeScript implementation
- Lambda function with compliance scanning logic (Node.js runtime)
- CloudWatch Events rule for 6-hour scheduling
- S3 bucket with versioning for report storage
- SNS topic with email subscription capability
- CloudWatch Logs configuration with retention
- IAM roles and policies with least-privilege access
- Environment variable configuration for Lambda
- Export outputs: S3 bucket name, SNS topic ARN, Lambda function name
- Documentation covering deployment and configuration