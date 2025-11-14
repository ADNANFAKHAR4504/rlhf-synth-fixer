# Task: AWS CloudFormation

## Problem Statement
Create a CloudFormation template to deploy an automated infrastructure compliance checking system.

MANDATORY REQUIREMENTS (Must complete):
1. Configure AWS Config with a configuration recorder for S3, RDS, and EC2 resources (CORE: Config)
2. Create a Lambda function to analyze Config snapshots and identify non-compliant resources (CORE: Lambda)
3. Set up Config rules to detect unencrypted S3 buckets using AWS managed rule
4. Set up Config rules to detect publicly accessible RDS instances
5. Configure Lambda to process Config compliance events and log violations
6. Create CloudWatch Log groups with 30-day retention for all components
7. Implement SNS topic for compliance violation notifications
8. Ensure all IAM roles use least-privilege permissions without wildcards

OPTIONAL ENHANCEMENTS (If time permits):
� Add custom Config rule for EC2 tag compliance (OPTIONAL: Config Rules) - enforces tagging standards
� Implement EventBridge rules for real-time compliance alerts (OPTIONAL: EventBridge) - enables immediate response
� Add Systems Manager Parameter Store for dynamic rule thresholds (OPTIONAL: SSM) - allows configuration updates without redeployment

Expected output: A CloudFormation JSON template that deploys a fully functional compliance monitoring system that continuously analyzes infrastructure configurations, detects policy violations, and sends notifications for non-compliant resources.

## Background
A financial services company needs to implement automated infrastructure compliance checking for their AWS accounts. The security team requires real-time monitoring of resource configurations against company policies, with automated alerts for non-compliant resources.

## Environment
Infrastructure compliance monitoring system deployed in us-east-1 region using AWS Config for continuous resource monitoring and Lambda for custom compliance rules. Requires AWS CLI configured with appropriate permissions. The solution monitors S3 buckets for encryption status, RDS instances for public accessibility, and EC2 instances for required tags. CloudWatch Logs captures all Config and Lambda execution logs. No VPC requirements as Config and Lambda operate at the account level. Deployment requires CloudFormation JSON template with proper IAM roles and permissions.

## Constraints
Use only AWS Config and Lambda for compliance checking | All Lambda functions must have 256MB memory allocation | Config rules must check for unencrypted S3 buckets and public RDS instances | Lambda execution timeout must be exactly 60 seconds | CloudWatch Logs retention must be set to 30 days | All IAM roles must follow least-privilege principle with no wildcard actions | Enable AWS Config recording for S3, RDS, and EC2 resource types only | Lambda functions must use Python 3.11 runtime

## Platform & Language
- Platform: Terraform
- Language: HCL
- Difficulty: hard

## Subject Labels
aws; infrastructure; infrastructure-analysis-/-qa
