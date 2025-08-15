Here's a prompt that is designed to focus on AWS and Terraform HCL for a Secure AWS Storage and IAM Management infrastructure. It emphasize resource connections, best practices, and detailed output requirements.

# Objective:

Configure an AWS infrastructure using Terraform HCL, focused on secure storage and managing IAM roles. The VPC is already set up, and all resources must be placed within the provided network CIDRs.

# High-Level Requirements:

1. S3 Buckets Configuration

Ensure that all data stored in S3 buckets is encrypted with AES-256 encryption.
Restrict access to the S3 buckets to specific IP address ranges.
Turn on versioning for all S3 buckets to keep a history of data changes.
Set up logging for all AWS API calls using CloudTrail.
Make sure IAM roles are used instead of hard-coding AWS access keys.

2. IAM Configuration

Implement least-privilege IAM role permissions, so each role has only the permissions it absolutely needs to function.
Set up CloudWatch alarms to keep an eye on any IAM permission changes.
Create an SNS topic to notify the security team whenever there’s a change to an IAM role.

3. Region

All resources should be deployed in the us-west-2 AWS region.

# Constraints and Best Practices:

All S3 bucket data must be encrypted with AES-256.
Only specific IP address ranges should be allowed to access the S3 buckets.
Always use IAM roles instead of hard-coded AWS access keys.
Follow the least-privilege principle for IAM permissions.
Ensure all API calls are logged with CloudTrail.
Enable versioning on all S3 buckets.
Keep the deployment region set to us-west-2.
Set up CloudWatch alarms to monitor IAM role changes.
Avoid using external modules, everything must be defined directly in the Terraform HCL script.

# The Expected Output :

Generate a single-file Terraform configuration in the `tap_stack.tf` that includes:

All variable declarations, including aws_region for provider.tf.
The Locals, resources, and outputs.
All resources should be built directly—no external modules.
It must adhere to best practices: least-privilege IAM, encryption, secure security groups, and consistent tagging.
Provide useful outputs for CI/CD and testing (but no secrets).

# Please ensure that the generated Terraform configuration follows these security guidelines:

Least-privilege IAM roles and policies.
Encryption for sensitive data.
Logging and alerting for key changes in the system.
