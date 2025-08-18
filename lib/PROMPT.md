Here's a prompt for setting up a secure AWS environment using CloudFormation, trying to sound like a person wrote it, with less formatting:

## Secure AWS Environment Setup

We need a CloudFormation template, in YAML, to set up a secure AWS environment in `us-west-2`. This setup has to meet some important security rules.

Here's what it needs to do:

- **IAM Users**: Set up **two-factor authentication (2FA)** for all IAM user accounts.
- **S3 Buckets**: Make sure all S3 buckets are private and encrypted using **SSE-S3**. No public S3 buckets should exist.
- **CloudTrail Logging**: Turn on **AWS CloudTrail** to log all API calls in our AWS account for auditing.
- **EC2 Region**: Only allow **EC2 instances to be provisioned in the `us-west-2` region**.

The goal is to design a secure AWS infrastructure using CloudFormation. This is about making sure security and compliance best practices are followed across our application environment. Everything should operate in the `us-west-2` region, with encryption policies for all storage, and clear network and compute boundaries.

We need a valid, well-structured CloudFormation YAML template. It should meet all these security configurations and pass CloudFormation's own validation checks.
