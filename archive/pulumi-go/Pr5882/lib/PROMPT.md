# Security Configuration as Code

## Problem Statement

Create a Pulumi Go program to implement a zero-trust security infrastructure for a microservices platform. The configuration must:

1. Create a VPC with 3 private subnets across different AZs with no internet gateway.
2. Set up VPC endpoints for S3 and DynamoDB with appropriate security group rules.
3. Create an S3 bucket with versioning, SSE-S3 encryption, and bucket policies that deny unencrypted uploads.
4. Configure Lambda functions with customer-managed KMS keys for environment variable encryption.
5. Set up API Gateway with AWS_IAM authorization and request validation enabled.
6. Create IAM roles with explicit deny policies for unauthorized actions and assume role policies restricted by source IP.
7. Configure CloudWatch Log groups with 90-day retention and KMS encryption.
8. Implement security groups that allow only specific ports between services with no 0.0.0.0/0 rules.
9. Set up Network ACLs that explicitly deny all traffic except ports 443 and 3306 between subnets.
10. Enable AWS Config rules to monitor compliance for encryption and access policies.
11. Create a KMS key with key rotation enabled and restricted key policies.
12. Ensure all EC2 instances use IMDSv2 by setting HttpTokens to 'required'.

Expected output: A complete Pulumi Go program that creates all security infrastructure components with proper encryption, access controls, and network isolation. The program should output the VPC ID, subnet IDs, S3 bucket name, KMS key ARN, and API Gateway endpoint URL.

## Real-World Context

A financial services company needs to implement zero-trust network access for their microservices architecture. They require strict IAM policies, network segmentation, and encryption for all data at rest and in transit to meet PCI DSS compliance requirements.

## Environment Details

Zero-trust security infrastructure deployed in us-east-1 across 3 availability zones. Uses VPC with private subnets only, VPC endpoints for S3 and DynamoDB, Lambda functions with KMS encryption, API Gateway with IAM authorization, and CloudWatch Logs for audit trails. Requires Go 1.19+, Pulumi 3.x, AWS CLI v2 configured with appropriate permissions. No internet gateway or NAT gateway - all traffic flows through VPC endpoints. Resources span multiple AWS accounts with cross-account IAM roles for least privilege access.

## Explicit Requirements

- All S3 buckets must have versioning enabled and use SSE-S3 encryption
- IAM roles must follow the principle of least privilege with explicit deny statements
- VPC endpoints must be used for S3 and DynamoDB access to avoid internet exposure
- Security groups must have no ingress rules allowing 0.0.0.0/0
- All EC2 instances must use IMDSv2 only
- CloudWatch Logs must retain logs for exactly 90 days
- Lambda functions must use customer managed KMS keys for environment variables
- API Gateway must enforce AWS_IAM authorization
- All resources must be tagged with CostCenter, Environment, and DataClassification
- Network ACLs must explicitly deny all traffic except required ports
