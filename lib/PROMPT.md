# AWS CDK Project Requirements

## Project Overview
I need to build an AWS CDK application in TypeScript that sets up our infrastructure with specific security and compliance requirements.

## Folder Structure
- `bin/tap.ts` - Main entry point for the CDK application
- `lib/tapstack.ts` - Defines the main infrastructure stack
- `test/` - Directory for CDK tests

## Infrastructure Requirements

### VPC Configuration
- All resources must be deployed within a single VPC
- Region: us-west-2 (Oregon)

### EC2 Instances
- Must be launched inside the VPC
- Use IAM roles for access (no embedded credentials)
- SSH access restricted to specific IP CIDR ranges via security groups

### RDS Database
- Deployed within the VPC in private subnets
- Security groups configured to allow inbound access only from approved IP addresses
- Encryption at rest must be enabled

### Lambda Functions
- Deployed within the same VPC
- CloudWatch logging enabled
- Sensitive values (database credentials, etc.) must be retrieved from AWS Secrets Manager

### S3 Buckets
- Naming convention: corp-<project>-<resource-type>
- Server-side encryption enabled
- Block all public access

### IAM Policies & Roles
- Follow least privilege principle
- Attach appropriate roles to EC2, RDS, and Lambda resources
- MFA enforcement required for AWS Management Console access

### Naming Convention
- All resources must use the pattern: "corp" + projectName + resource type
- Examples: corp-nova-ec2, corp-nova-s3

### Exclusions
- Do not include AWS Config Rules
- Do not include CloudTrail in this stack

## Implementation Notes
The code should be well-structured, follow TypeScript best practices, and include proper error handling and logging where appropriate.