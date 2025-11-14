# Task 101912435 - Complete Context

## Task Identification
- **Task ID**: 101912435
- **Platform**: Terraform
- **Language**: HCL
- **Difficulty**: hard
- **Subtask**: AWS CloudFormation
- **Status**: Selected and ready for implementation
- **Team**: synth
- **Turn Type**: single
- **Started At**: 2025-11-14T07:43:35

## Worktree Information
- **Location**: /var/www/turing/iac-test-automations/worktree/synth-101912435
- **Branch**: synth-101912435
- **Template**: tf-hcl (Terraform HCL)

## Problem Statement
Create a CloudFormation template to deploy an automated infrastructure compliance checking system.

## MANDATORY REQUIREMENTS (Must Complete)
1. Configure AWS Config with a configuration recorder for S3, RDS, and EC2 resources (CORE: Config)
2. Create a Lambda function to analyze Config snapshots and identify non-compliant resources (CORE: Lambda)
3. Set up Config rules to detect unencrypted S3 buckets using AWS managed rule
4. Set up Config rules to detect publicly accessible RDS instances
5. Configure Lambda to process Config compliance events and log violations
6. Create CloudWatch Log groups with 30-day retention for all components
7. Implement SNS topic for compliance violation notifications
8. Ensure all IAM roles use least-privilege permissions without wildcards

## OPTIONAL ENHANCEMENTS (If Time Permits)
- Add custom Config rule for EC2 tag compliance (OPTIONAL: Config Rules) - enforces tagging standards
- Implement EventBridge rules for real-time compliance alerts (OPTIONAL: EventBridge) - enables immediate response
- Add Systems Manager Parameter Store for dynamic rule thresholds (OPTIONAL: SSM) - allows configuration updates without redeployment

## Background
A financial services company needs to implement automated infrastructure compliance checking for their AWS accounts. The security team requires real-time monitoring of resource configurations against company policies, with automated alerts for non-compliant resources.

## Environment Details
Infrastructure compliance monitoring system deployed in us-east-1 region using AWS Config for continuous resource monitoring and Lambda for custom compliance rules. Requires AWS CLI configured with appropriate permissions. The solution monitors S3 buckets for encryption status, RDS instances for public accessibility, and EC2 instances for required tags. CloudWatch Logs captures all Config and Lambda execution logs. No VPC requirements as Config and Lambda operate at the account level. Deployment requires CloudFormation JSON template with proper IAM roles and permissions.

## Constraints
- Use only AWS Config and Lambda for compliance checking
- All Lambda functions must have 256MB memory allocation
- Config rules must check for unencrypted S3 buckets and public RDS instances
- Lambda execution timeout must be exactly 60 seconds
- CloudWatch Logs retention must be set to 30 days
- All IAM roles must follow least-privilege principle with no wildcard actions
- Enable AWS Config recording for S3, RDS, and EC2 resource types only
- Lambda functions must use Python 3.11 runtime

## AWS Services Required
Core Services:
- AWS Config (configuration recorder, config rules)
- AWS Lambda (compliance analysis, event processing)
- CloudWatch Logs (logging with 30-day retention)
- SNS (compliance violation notifications)
- IAM (roles and permissions)
- S3 (monitoring target)
- RDS (monitoring target)
- EC2 (monitoring target)

Optional Services:
- EventBridge (real-time compliance alerts)
- Systems Manager Parameter Store (dynamic rule thresholds)

## Expected Output
A CloudFormation JSON template that deploys a fully functional compliance monitoring system that continuously analyzes infrastructure configurations, detects policy violations, and sends notifications for non-compliant resources.

## Subject Labels
- aws
- infrastructure
- infrastructure-analysis-/-qa

## Implementation Notes
NOTE: Despite the task mentioning "CloudFormation template", the platform is Terraform (HCL). The implementation should use Terraform to create the AWS Config compliance checking system, not a CloudFormation template. The task description refers to the infrastructure being deployed, which would handle compliance checking of CloudFormation and other AWS resources.

## Setup Status
- Worktree created and verified
- metadata.json generated with all required fields
- PROMPT.md created with complete task details
- Terraform template copied from templates/tf-hcl
- Terraform initialized (without backend)
- All validation scripts passed

## Next Steps
1. Implement Terraform HCL code in lib/ directory
2. Create AWS Config configuration recorder
3. Implement Lambda function for compliance analysis
4. Set up Config rules for S3 and RDS compliance
5. Configure CloudWatch Logs with proper retention
6. Implement SNS notifications
7. Ensure IAM roles follow least-privilege principle
8. Run tests and validation
9. Create pull request when complete
