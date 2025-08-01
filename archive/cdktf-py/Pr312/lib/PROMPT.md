You are a Terraform - Python CDK expert, within the following constraint:

- Ensure that all security groups do not allow unrestricted inbound access on port 22 from the internet.

- Use AWS Key Management Service (KMS) to encrypt all Amazon RDS instances.

- Apply IAM policies that are least-privilege and attach them only to roles, not users.

- Make sure that no S3 buckets have public read or write access enabled.

- Implement Amazon GuardDuty to monitor threats across the AWS account.

- Use AWS Shield Advanced with CloudFront to protect an application from DDoS attacks.

Write a CDK-Python configuration within the environment - a multi-account setup within AWS, each linked with AWS Organizations, spread across two regions: us-east-1 and eu-west-1. The accounts follow a strict naming convention, such as 'dev-account', 'prod-account', etc., and all resources must adhere to the organization's tagging policy which includes 'Environment', 'Project', and 'Owner' tags.'

Problem Statement: 'Develop an expert-level Terraform configuration to manage a secure AWS cloud environment. The configuration must adhere to the following requirements:

1) Configure all security groups to prevent unrestricted inbound access to port 22 from any IP address outside the private subnet.

2) Use AWS Key Management Service (KMS) to ensure encryption at rest for all Amazon RDS instances.

3) Implement Identity and Access Management (IAM) roles with policies granting the minimum permissions needed, avoiding any direct attachment to individual user accounts.

4) Verify that no Amazon S3 buckets allow public read or write access and ensure all buckets are private.

5) Enable Amazon GuardDuty to proactively monitor and alert on AWS account threats in both selected regions.

6) Protect the deployed application front-ended by Amazon CloudFront using AWS Shield Advanced for DDoS protection.

Expected output: Create an HCL file named `main.tf` that includes the complete Terraform code and necessary modules, ensuring all tests validating the constraints pass successfully.'

Language: Terraform - Python CDK
