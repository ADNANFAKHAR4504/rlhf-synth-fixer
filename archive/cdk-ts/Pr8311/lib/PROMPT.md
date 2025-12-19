# Secure AWS CDK Environment Task

## Problem Statement

You are tasked with developing a robust AWS CDK application in TypeScript that configures a secure cloud environment for a new application. The CDK stack should adhere to the following security requirements:

1. **S3 Encryption**: Ensure all S3 buckets are encrypted using AES-256 encryption.
2. **EC2 Network Security**: EC2 instances should be launched within a VPC, specifically in private subnets.
3. **IAM Least Privilege**: IAM roles should have the least privilege permissions necessary for operations.
4. **Comprehensive Logging**: Enable logging for all AWS services utilized in the stack for audit purposes.

The CDK application must be written in TypeScript and designed to deploy successfully without errors. Tests must verify correctness against these security constraints.

**Expected output**: A TypeScript CDK stack file named `secure-environment-stack.ts`.

## Environment Context

Your company is using AWS CDK with TypeScript to manage its cloud infrastructure. The AWS region in use is **us-east-1**. The environment needs to adhere to best security practices for AWS resources such as S3, EC2, IAM, and CloudTrail.

## Security Requirements Details

### 1. S3 Bucket Security
- All S3 buckets must use AES-256 server-side encryption
- Block public access by default
- Enable versioning where appropriate
- Implement bucket policies for access control

### 2. VPC and Network Security
- EC2 instances must be deployed in private subnets only
- Proper security group configurations
- NAT Gateway for outbound internet access from private subnets
- No direct internet access to EC2 instances

### 3. IAM Security
- Follow principle of least privilege
- Create specific roles for each service/resource
- No overly permissive policies
- Use AWS managed policies where appropriate

### 4. Audit and Logging
- Enable CloudTrail for API logging
- Configure CloudWatch for monitoring
- VPC Flow Logs for network monitoring
- S3 access logging where needed

## Success Criteria

1. CDK stack synthesizes without errors
2. Deployment succeeds in us-east-1 region
3. All security requirements are implemented
4. Tests validate security constraints
5. Resources can be destroyed cleanly
6. No security best practices violations