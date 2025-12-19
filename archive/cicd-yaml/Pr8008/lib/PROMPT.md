# Task: Automated Compliance Auditing System

## Background
A financial services company needs to implement automated compliance auditing for their AWS infrastructure. The security team requires continuous monitoring of resource configurations against industry standards and internal policies. They need a solution that can detect non-compliant resources and generate detailed reports for quarterly audits.

## Environment
Production compliance monitoring infrastructure deployed in us-east-1 as the primary region with cross-region aggregation from us-east-1 and us-east-1. Uses AWS Config for resource tracking, Lambda for custom compliance rules, S3 for long-term storage, SNS for alerting, and Systems Manager Parameter Store for configuration. Requires CDK 2.x with TypeScript, Node.js 18+, and AWS CLI configured with appropriate permissions. VPC endpoints required for private subnet Lambda execution.

## Problem Statement
Create a CDK TypeScript program to deploy an automated compliance auditing system for AWS resources. The configuration must:

1. Set up AWS Config with recording enabled for all resource types in us-east-1.
2. Deploy three custom Config Rules using Lambda functions to check: EC2 instances for approved AMIs, S3 buckets for encryption, and RDS instances for backup retention.
3. Create an S3 bucket with versioning and lifecycle rules to archive compliance data after 90 days and delete after 7 years.
4. Implement cross-region Config aggregation from us-east-1 and us-east-1 to us-east-1.
5. Configure SNS topic with email subscription for critical compliance violations.
6. Store compliance thresholds in Parameter Store (e.g., minimum backup retention days).
7. Create IAM roles with least privilege for Config, Lambda, and aggregation.
8. Deploy Lambda functions that evaluate resources and return compliance status.
9. Set up CloudWatch Logs retention for Lambda functions at 30 days.
10. Tag all resources with CostCenter and ComplianceLevel tags.

## Expected Output
A CDK application that deploys the complete compliance infrastructure, with Config Rules automatically evaluating resources every 24 hours and sending notifications for violations.

## Constraints
- Use AWS Config Rules exclusively for compliance checking
- All Config Rules must be custom Lambda-based rules, not managed rules
- Lambda functions must be written in Python 3.9 runtime
- Store compliance results in S3 with lifecycle policies for 7-year retention
- Enable cross-region aggregation for Config data
- Implement SNS notifications for critical non-compliance events
- Use Systems Manager Parameter Store for storing compliance thresholds
