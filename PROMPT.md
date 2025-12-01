# Task: CloudFormation - Expert

## Background
A financial services company needs to implement a secure data processing pipeline that complies with PCI-DSS requirements. The architecture must encrypt data at rest and in transit, enforce strict access controls, and maintain audit logs for all data access attempts.

## Problem Statement
Create a CloudFormation template to deploy a secure data processing pipeline for handling sensitive payment card data.

MANDATORY REQUIREMENTS (Must complete):
1. Create a VPC with private subnets across 3 availability zones (CORE: VPC)
2. Deploy Lambda function with 1GB memory for data validation in private subnet (CORE: Lambda)
3. Configure S3 bucket with SSE-KMS encryption using customer-managed CMK
4. Implement VPC endpoints for S3 and KMS services
5. Create IAM execution role for Lambda with minimal permissions to read/write S3
6. Enable VPC flow logs with 90-day retention in CloudWatch Logs
7. Configure security groups allowing only HTTPS traffic between components
8. Add stack-level termination protection in template
9. Include mandatory tags DataClassification=PCI and ComplianceScope=Payment
10. Set DeletionPolicy to Retain for KMS key and S3 bucket

OPTIONAL ENHANCEMENTS (If time permits):
• Add AWS Config rules for compliance monitoring (OPTIONAL: Config) - automates compliance checks
• Implement SNS topic for security alerts (OPTIONAL: SNS) - enables real-time notifications
• Add Systems Manager Parameter Store for secure config (OPTIONAL: SSM) - centralizes secret management

Expected output: A CloudFormation JSON template that deploys a PCI-compliant data processing infrastructure with end-to-end encryption, network isolation, and comprehensive audit logging.

## Constraints
1. All S3 buckets must use SSE-KMS encryption with customer-managed keys
2. Lambda functions must run in private subnets with no direct internet access
3. All IAM roles must follow least privilege principle with no wildcard actions
4. VPC flow logs must be enabled and stored for 90 days minimum
5. All security groups must have explicit egress rules with no 0.0.0.0/0 destinations
6. CloudFormation stack must have termination protection enabled
7. All resources must be tagged with DataClassification and ComplianceScope tags

## Environment
Highly secure multi-AZ deployment in us-east-1 for PCI-DSS compliant data processing. Infrastructure includes VPC with private subnets across 3 availability zones, S3 buckets with KMS encryption, Lambda functions in private subnets, and comprehensive CloudWatch logging. Requires AWS CLI configured with appropriate permissions, CloudFormation JSON template deployment capability. Network architecture includes VPC endpoints for S3 and KMS to avoid internet traversal, NAT instances for controlled outbound access, and strict security group rules.

## AWS Services
VPC, Lambda, S3, KMS, IAM, CloudWatch, Config, SNS, SSM

## Task ID
101912902
