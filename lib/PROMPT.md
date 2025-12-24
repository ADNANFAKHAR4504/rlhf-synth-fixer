# Task: Multi-tier Security Configuration CloudFormation Template

## Problem Description
You are tasked with designing a CloudFormation template to manage the security configuration of a multi-tier architecture within AWS. The architecture involves an S3-based data lake, EC2 instances for computing, RDS for databases, and IAM for access management.

## Requirements

The requirements for this template include:

1. Enabling server-side encryption on S3 buckets using AWS KMS with a custom key.
2. Creating IAM roles that follow least privilege principles.
3. Organizing EC2 instances into a VPC with public and private subnets.
4. Setting up CloudWatch with detailed monitoring for EC2 instances.
5. Restricting security group inbound traffic to a specific IP range.
6. Designing IAM policies to restrict S3 access to specific actions and users.
7. Enabling CloudTrail with storage of logs in encrypted S3 buckets.
8. Encrypting RDS instances at rest and in transit.
9. Ensuring KMS keys are rotated annually and IAM policies once attached are not detachable without procedures.
10. Limiting public access to services except through an API Gateway.
11. Implementing Amazon Inspector for all EC2 instances.

## Environment Details
- **Region**: us-east-1
- **Accounts**: Two accounts (production and development) requiring isolation and identical setup standards
- **VPC Naming**: 'prod-vpc' and 'dev-vpc' for respective environments
- **Tagging**: All resources should be tagged with 'Environment' and 'Project' tags for cost allocation

## Constraints
1. The S3 buckets must have server-side encryption enabled using AWS Key Management Service with a custom key
2. IAM roles should be created with least privilege principle in mind, granting only necessary permissions
3. All EC2 instances should belong to a VPC with public and private subnets set up according to AWS best practices
4. Enable detailed CloudWatch monitoring for all EC2 instances but do not exceed a 1-minute granularity
5. All security groups should only allow inbound traffic from a specific IP range like 192.168.1.0/24 and block all others
6. Create an IAM policy that limits S3 bucket access to specific actions - ListBucket and GetObject only for a specified user group
7. Ensure that CloudTrail is enabled and logs are stored with at least 90 days of retention in an encrypted S3 bucket
8. All RDS instances should be encrypted at rest and in transit
9. Specify that the IAM policy and roles, once attached, should not be easily detachable unless via change control procedures
10. Ensure KMS keys are rotated every 365 days
11. Ensure no AWS services are publicly accessible except via a managed API Gateway
12. Implement Amazon Inspector for all EC2 instances automatically within the template

## Expected Output
A CloudFormation YAML template that fulfills all the stated requirements, deploying the infrastructure security configuration successfully when used. The template should be placed in `lib/TapStack.yml`.

## Platform and Language
- **Platform**: CloudFormation
- **Language**: YAML