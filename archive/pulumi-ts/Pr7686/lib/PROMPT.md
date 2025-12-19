# AWS Inspector v2 Security Assessment Infrastructure

## Task Description

Create a comprehensive AWS Inspector v2 security assessment infrastructure using Pulumi TypeScript that automates vulnerability detection, alerting, and compliance reporting for EC2 instances.

## Requirements

Build a Pulumi stack that implements the following components:

### 1. Enable AWS Inspector v2

- Enable Inspector v2 scanning for EC2 instances in the AWS account
- Configure for EC2 resource type scanning
- Handle the Inspector enablement process which may take several minutes

### 2. Create SNS Topic for Security Findings

- Create an SNS topic to receive and distribute security finding notifications
- Configure appropriate topic settings for security alerting

### 3. Set Up EventBridge Rules for HIGH and CRITICAL Findings

- Create EventBridge rule to capture Inspector2 findings
- Filter events to only process HIGH and CRITICAL severity findings
- Route filtered findings to the appropriate processing target

### 4. Configure Email Notifications for Critical Findings

- Create SNS email subscription for security team notifications
- Support configurable email address (default: security@company.com)
- Ensure immediate notification delivery for security findings

### 5. Create EC2 IAM Infrastructure for Inspector Tagging

- Create IAM role for EC2 instances to support Inspector scanning
- Attach SSM managed instance policy for Inspector agent communication
- Create instance profile for EC2 attachment

### 6. Create Lambda Function to Parse Inspector Findings

- Implement Node.js 20.x Lambda function
- Parse EventBridge Inspector finding events
- Extract severity, title, description, resource ID, and status
- Publish formatted alerts to SNS topic
- Export finding summaries to S3 for compliance reporting
- Use AWS SDK v3 for SNS and S3 operations

### 7. Set Up CloudWatch Dashboard for Security Metrics

- Create CloudWatch dashboard with security-focused widgets
- Display Lambda invocation metrics (findings processed)
- Show Lambda error and duration metrics
- Include CloudWatch Logs Insights query for severity breakdown
- Display SNS notification count metrics

### 8. Configure Inspector Assessments on Tagged Instances

- Ensure Inspector scans EC2 instances in the account
- Support assessment targeting through resource types

### 9. Implement Least Privilege IAM Roles

- Create Lambda execution role with minimal permissions
- Grant SNS publish permission only to the findings topic
- Grant S3 write permission only to the compliance bucket
- Grant Inspector read permissions for listing/getting findings
- Attach only AWSLambdaBasicExecutionRole managed policy

### 10. Enable Finding Aggregation (Organizations - Optional)

- Include Organizations configuration as optional feature
- Document that it requires AWS Organizations admin permissions
- Make it non-blocking for deployments in single-account environments

### 11. Create S3 Compliance Bucket

- Create S3 bucket for storing compliance reports and finding exports
- Enable server-side encryption (AES256)
- Enable versioning for audit trail
- Block all public access
- Configure bucket to be destroyable (forceDestroy: true)

## Technical Requirements

### Pulumi/TypeScript

- Use Pulumi AWS provider
- Implement as a ComponentResource class (TapStack)
- Export key resources as public readonly properties
- Use environmentSuffix for all resource naming
- Include proper resource dependencies with dependsOn
- Add custom timeouts for long-running operations (Inspector enablement)

### Security

- All S3 buckets must block public access
- All S3 buckets must have encryption enabled
- IAM policies must follow least privilege principle
- No wildcard permissions on specific resources

### Tagging

- All resources must support custom tags via args.tags
- Include common tags on all resources

### Configuration

- Support configurable security email address
- Support configurable CloudWatch Logs retention period
- Use environment variable ENVIRONMENT_SUFFIX for unique naming

### Testing Requirements

#### Unit Tests

- Test stack initialization with various argument combinations
- Verify all resources are created with correct naming
- Validate S3 encryption and public access blocking
- Test Lambda configuration (runtime, timeout, memory)
- Verify IAM policy structure and permissions
- Check CloudWatch dashboard widget configuration

#### Integration Tests

- Read deployed resource names from cfn-outputs/flat-outputs.json
- Verify S3 bucket exists and has correct configuration
- Validate SNS topic creation and subscriptions
- Test Lambda function deployment and configuration
- Verify EventBridge rule configuration
- Check CloudWatch dashboard deployment
- Validate IAM role and policy attachments

## Expected Outputs

The stack should export the following outputs:

- complianceBucketName: S3 bucket ID
- complianceBucketArn: S3 bucket ARN
- findingsTopicArn: SNS topic ARN
- findingsProcessorArn: Lambda function ARN
- securityDashboardName: CloudWatch dashboard name
- ec2InstanceProfileArn: EC2 instance profile ARN
- inspectorEnabled: Inspector enabler resource ID

## AWS Services Used

- AWS Inspector v2
- Amazon SNS
- AWS Lambda
- Amazon EventBridge
- Amazon CloudWatch (Logs, Dashboard, Metrics)
- Amazon S3
- AWS IAM

## Constraints

- All resources must include the environmentSuffix in their names
- All resources must be destroyable (no retain policies)
- Lambda must use Node.js 20.x runtime
- Lambda must use AWS SDK v3
- S3 resources should use non-deprecated Pulumi resources where possible
