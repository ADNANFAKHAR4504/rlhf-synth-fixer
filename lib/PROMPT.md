# Task: Compliance Validation and Remediation Module

## Task ID: 101912441

## Platform: Terraform (HCL)

## Complexity: Expert

## Subject Labels
- Cloud Environment Setup
- Security Configuration as Code

## Task Description

Create a Terraform configuration for an automated AWS infrastructure compliance validation and remediation system. The system monitors resource configurations and automatically remediates non-compliant resources through event-driven workflows.

## Requirements

Build a compliance monitoring system where AWS Config continuously evaluates infrastructure against compliance rules and triggers automated remediation when violations are detected. AWS Config stores configuration snapshots and compliance evaluation results in an S3 bucket encrypted with KMS. When Config detects non-compliance, it publishes events to EventBridge, which routes them to a Lambda remediation function. The Lambda function processes the non-compliance event, applies automated fixes to the resources, and sends notifications through SNS to alert administrators. CloudWatch logs all remediation actions and monitors the Lambda function execution for debugging and audit purposes. IAM roles and policies grant Config the permissions to evaluate resources, Lambda the permissions to remediate them, and EventBridge the permissions to route events between services.

## Deliverables

- Complete Terraform configuration in lib/ directory
- AWS Config rules with compliance checks
- Lambda function code for automated remediation
- EventBridge rules for event routing
- S3 bucket with KMS encryption for Config data
- SNS topic for notifications
- IAM roles connecting all services
- CloudWatch log groups for monitoring
- Appropriate test files in test/ directory
- All code must follow Terraform and HCL best practices
