# AWS CloudFormation Security Configuration Template

Create a production-ready CloudFormation template for IAM security configurations with MFA enforcement and least privilege access.

## Requirements

### IAM Roles and Policies
Create three IAM roles with MFA enforcement:
- Developer Role that connects to S3 buckets for file access and triggers Lambda functions for development testing
- Read-Only Role that accesses CloudWatch Logs for monitoring and retrieves CloudTrail events for auditing
- Operations Role that invokes Systems Manager for instance management and writes to CloudWatch for operational metrics

### Security Architecture
- IAM roles must require MFA for assumption through trust policy conditions
- Developer role grants access to specific S3 bucket prefixes and Lambda functions
- Read-Only role retrieves EC2 instance metadata and CloudFormation stack information
- Operations role connects to SSM Parameter Store for configuration retrieval and sends commands to EC2 instances

### CloudTrail Integration
- CloudTrail writes audit logs to a dedicated S3 bucket for compliance
- Trail captures API events from Lambda and S3 data events
- S3 bucket policy allows CloudTrail service to write log files

### Constraints
- Template must pass cfn-lint validation
- Avoid hardcoding AWS regions
- Use explicit resource ARNs instead of wildcards where possible
- IAM policies must specify exact actions needed for each role
- Include IsLogging property for CloudTrail Trail resource

### Expected Outputs
- Export ARNs for each IAM role
- Export CloudTrail ARN and log bucket name
- Include proper resource dependencies between CloudTrail bucket policy and trail

## Response Format
Provide the CloudFormation template in YAML format with descriptive comments explaining security configurations and resource tags for tracking.
