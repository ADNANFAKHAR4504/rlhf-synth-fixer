# CDKTF Infrastructure as Code (IAC) Prompt for AWS Security Best Practices

## Objective:
You are tasked with securing an AWS cloud environment using CDKTF. The goal is to implement security best practices that are critical for a secure and compliant infrastructure.

## Constraints:
- **IAM Roles**: Use IAM roles to manage permissions exclusively without using inline IAM policies.
- **Encryption**: Ensure all data stored in S3 buckets is encrypted using AES-256 encryption.
- **VPC Network Isolation**: Implement VPC network isolation for all resources, including private subnet usage.
- **Lambda Trigger Security**: Ensure all Lambda functions are triggered by IAM-authenticated sources only.
- **RDS Logging and Encryption**: Implement logging for all actions on RDS databases and ensure logs are encrypted.
- **EC2 Security Groups**: All EC2 instances must be provisioned with a security group that restricts all inbound traffic except SSH on port 22 from a specified IP range.
- **KMS Key Management**: Use AWS KMS for key management and ensure key rotation is enabled automatically.

## Environment:
You have been tasked with securing an AWS cloud environment using CDKTF. Write a Typescript configuration that meets the following security best practices:

1. Manage permissions using IAM roles exclusively, avoiding inline policies.
2. All data stored in S3 buckets should be encrypted using AES-256 encryption protocols.
3. Ensure network isolation by implementing a VPC with private subnets for all resources.
4. Restrict Lambda function triggers to IAM-authenticated sources only to enhance security.
5. Enable and encrypt logging for every action performed on RDS databases to maintain an audit trail.
6. Limit EC2 instance access by configuring security groups to allow SSH access exclusively through port 22 to a predefined IP range.
7. Utilize AWS KMS for all key management tasks and configure key rotation to occur automatically.

## Expected Output:
Your solution must be a valid CDKTF configuration file named `secure_infrastructure.ts`. Ensure that all configurations align with the security requirements specified. Upon running `terraform apply`, the infrastructure must comply with these constraints and pass a security audit check by AWS Trusted Advisor.

## Proposed Statement:
- AWS account with multiple regions, utilizing Terraform for Infrastructure as Code management.
- Adhere to naming conventions where all resources are prefixed with `prod-`.
- Assume VPC IDs and subnets are predefined based on a CIDR range compatible with your region.
