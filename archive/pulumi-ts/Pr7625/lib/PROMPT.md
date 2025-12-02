# AWS Infrastructure Compliance Analyzer

Hey team,

We've got an interesting challenge from a financial services client. They're drowning in compliance requirements and need an automated way to scan their AWS infrastructure for violations. Think of it like a health check system that runs regularly and tells them what's broken before the auditors show up.

The business wants a tool that can analyze their existing AWS resources across EC2, VPC, S3, IAM, and CloudWatch. They need to know about missing tags, overly permissive security groups, unencrypted buckets, old access keys, orphaned volumes - basically everything that could get them in trouble during an audit. The tool should generate a compliance score and store reports in S3 for the audit trail.

I've been asked to build this using **Pulumi with TypeScript**. We'll deploy Lambda functions to do the heavy lifting, use DynamoDB to track findings over time, EventBridge to schedule regular scans, and CloudWatch for logging and monitoring. The architecture should be serverless to keep costs down and scale automatically.

## What we need to build

Create an AWS infrastructure compliance analysis system using **Pulumi with TypeScript**.

### Core Requirements

1. **EC2 Instance Compliance Checks**
   - Scan all EC2 instances in the account
   - Identify instances missing required tags (Name, Environment, Owner)
   - Tag analyzed resources with LastComplianceCheck timestamp

2. **VPC Security Group Analysis**
   - Check all security groups for overly permissive ingress rules
   - Flag any rules allowing 0.0.0.0/0 access on ports other than 80/443
   - Generate detailed reports of security group violations

3. **S3 Bucket Security Validation**
   - Verify all S3 buckets have encryption enabled
   - Check that block public access settings are configured
   - Report buckets with security misconfigurations

4. **IAM Access Key Age Monitoring**
   - Identify IAM users with access keys older than 90 days
   - Generate list of users requiring key rotation
   - Include key creation dates in reports

5. **EBS Volume Management**
   - Find unattached EBS volumes that may contain sensitive data
   - Report volumes at risk of data leakage
   - Include volume size and creation date

6. **VPC Flow Log Compliance**
   - Validate that CloudWatch logging is enabled for all VPC flow logs
   - Report VPCs without proper logging configuration

7. **Compliance Scoring and Reporting**
   - Generate a compliance score from 0-100 based on violations found
   - Output results to console for immediate feedback
   - Store detailed JSON reports in S3 bucket for audit trail
   - Include resource IDs and recommended remediation steps

### Infrastructure Components

Deploy these AWS services using **Pulumi with TypeScript**:

- **Lambda Functions**: Run compliance checks using AWS SDK v3
- **DynamoDB Table**: Track compliance findings and history over time
- **DynamoDB Streams**: Trigger actions when new violations are detected
- **EventBridge Rules**: Schedule regular compliance scans
- **CloudWatch Log Groups**: Capture Lambda execution logs and metrics
- **S3 Bucket**: Store compliance reports with encryption
- **IAM Roles**: Read-only permissions for resource inspection

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Lambda functions must use Node.js 18.x runtime with AWS SDK v3
- Implement retry logic for AWS API calls with exponential backoff
- Use TypeScript interfaces for all compliance check results
- Generate reports in both human-readable and machine-parseable JSON formats
- Implement parallel scanning with configurable concurrency limits
- Handle pagination for large resource collections properly
- Timestamp all findings in ISO 8601 format
- Calculate separate compliance scores for each service category
- Use async/await patterns throughout

### Deployment Requirements (CRITICAL)

- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `compliance-analyzer-{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region (configurable via AWS_REGION)
- All resources must be destroyable (no Retain policies on any resources)
- Lambda functions should be in `lib/lambda/` directory
- All Pulumi resources must have `deleteBeforeReplace: true` where applicable

### Constraints

- Read-only analysis - do NOT modify any existing infrastructure
- Must handle AWS API throttling gracefully
- Include comprehensive error handling and logging
- Support multiple AWS accounts via IAM role assumption
- Reports must be comprehensive and actionable
- Follow AWS best practices for security and compliance
- Keep Lambda execution time under 15 minutes
- Use Pulumi stack outputs to display summary statistics

### Service-Specific Requirements

**Lambda Considerations**:
- Node.js 18+ runtime does NOT include AWS SDK by default
- Must bundle AWS SDK v3 as dependency in package.json
- Include proper error handling for SDK client initialization

**DynamoDB Configuration**:
- Use on-demand billing mode for cost optimization
- Enable point-in-time recovery for compliance data
- Configure DynamoDB Streams with NEW_AND_OLD_IMAGES

**EventBridge Scheduling**:
- Schedule compliance scans to run daily at configurable time
- Include capability for manual trigger via Lambda invocation

**S3 Bucket Security**:
- Enable server-side encryption with AWS managed keys
- Block all public access by default
- Enable versioning for report history

## Success Criteria

- **Functionality**: All nine compliance checks execute successfully
- **Accuracy**: Correctly identifies violations across all AWS services
- **Performance**: Scans complete within 5 minutes for typical account
- **Reliability**: Handles API throttling and large resource counts
- **Security**: Uses read-only permissions, no infrastructure modification
- **Resource Naming**: All resources include environmentSuffix
- **Destroyability**: All resources can be destroyed without errors
- **Reporting**: JSON reports stored in S3 with proper structure
- **Scoring**: Compliance score accurately reflects violation count
- **Code Quality**: TypeScript with full type safety, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Lambda function code in lib/lambda/ directory with proper structure
- DynamoDB table with Streams configuration
- EventBridge rules for scheduled scanning
- CloudWatch log groups and alarms
- S3 bucket for report storage with encryption
- IAM roles with read-only permissions
- Unit tests for all Lambda functions
- Integration tests for end-to-end compliance scanning
- Documentation and deployment instructions in README.md
