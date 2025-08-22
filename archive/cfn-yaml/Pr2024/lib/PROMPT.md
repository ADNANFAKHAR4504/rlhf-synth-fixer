# Security Configuration as Code - CloudFormation YAML

## Task ID: trainr934
## Problem ID: SecurityConfigurationAsCode_CloudFormation_YAML_c832bd7fcb12

## Task Description
You have been tasked with creating a CloudFormation template that emphasizes security in its AWS resource configurations. The primary goal is to set up a robust security framework using AWS best practices.

## Requirements
1. Define security groups for EC2 instances that by default deny all traffic except SSH from a specific IP range.
2. Create S3 buckets with policy enforcement to enable server-side encryption using AWS-managed keys.
3. Ensure the RDS database is deployed in a private subnet and is not publicly accessible.
4. Implement IAM roles to restrict access based on least privilege principles, ensuring roles are tightly scoped to the required actions.
5. Develop an SNS topic to alert of any non-compliance in security settings.

## Constraints
1. Ensure all S3 buckets created in the stack have server-side encryption enabled.
2. All security group rules must deny public access unless explicitly stated otherwise.

## Environment
The target environment involves a single AWS account with multiple VPCs and regions. The resources include EC2 instances, S3 buckets, and RDS databases. Security is a paramount aspect of this infrastructure.

## Expected Output
The completion of this task will be graded based on the correctness and security compliance of your CloudFormation YAML template. The resources should be configurable and successfully deployable in an AWS environment meeting the above requirements.

## Platform Details
- Platform: CloudFormation (cfn)
- Language: YAML
- Difficulty: Hard