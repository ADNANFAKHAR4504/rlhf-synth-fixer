You are a Lead DevOps Engineer tasked with creating a secure AWS infrastructure using Terraform. Your goal is to consolidate all resource definitions into a single file for simplicity, supported by a separate provider configuration file.

Task:

Create the HCL code for the following two files: provider.tf and tap_stack.tf. All resources must be deployed in the us-east-1 region.

File 1: provider.tf
This file should contain the required provider configuration.

Provider: Define the aws provider.

Region: Explicitly set the region to us-east-1.

File 2: tap_stack.tf
This file must contain all the variable, resource, and output definitions for the entire stack.

Variables
Define variables for environment_tag and owner_tag to be applied to all resources.

Networking Resources
VPC: An aws_vpc.

Private Subnets: At least two aws_subnet resources configured as private subnets in different Availability Zones.

S3 Endpoint: An aws_vpc_endpoint of type Gateway for S3 to allow private access from within the VPC.

Security & Auditing Resources
KMS Key: An aws_kms_key to be used for encrypting sensitive outputs.

CloudTrail: An aws_cloudtrail resource to capture all API calls. It should log to a new, dedicated, and private aws_s3_bucket.

Secure Data S3 Bucket:

A primary aws_s3_bucket for sensitive data.

An aws_s3_bucket_policy that enforces two rules:

Deny access if the request does not originate from the S3 VPC Endpoint.

Deny access if the request is not using HTTPS (check if aws:SecureTransport is false).

MFA Enforcement for IAM Users:

An aws_iam_group.

An aws_iam_group_policy that denies all actions for users in the group unless they have authenticated with MFA (using the aws:MultiFactorAuthPresent condition).

Compute Resources
EC2 Instance: An aws_instance that is launched into one of the private subnets. It should not have a public IP address.

IAM Role: An aws_iam_role and aws_iam_instance_profile for the EC2 instance.

Managed Policy: The IAM role must use an AWS Managed Policy, such as AmazonSSMManagedInstanceCore, to demonstrate the principle of least privilege.

Outputs
An output for the name of the secure data S3 bucket.

This output must be marked as sensitive = true to ensure it is encrypted in the Terraform state file.