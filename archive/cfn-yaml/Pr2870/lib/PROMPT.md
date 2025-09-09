You are tasked with designing a secure and scalable AWS production infrastructure using CloudFormation in YAML. The solution must strictly follow AWS security best practices and be aligned with production-grade standards.

Requirements:

Networking

Create a custom VPC (myapp-vpc) with 2 public subnets and 2 private subnets across different Availability Zones in us-east-1.

Attach an Internet Gateway to the VPC and configure route tables appropriately.

Security

Define Security Groups so that only ports 80 (HTTP) and 443 (HTTPS) are allowed for resources in public subnets.

Restrict SSH access to EC2 instances only from a given CIDR IP range.

Apply a tag Environment:Prod to all security-related resources.

IAM & Access Control

Create IAM roles for EC2 instances following the principle of least privilege.

Enforce Multi-Factor Authentication (MFA) for all IAM users accessing the setup.

Compute & Scaling

Deploy an Auto Scaling Group (ASG) managing EC2 instances with a minimum of 2 and maximum of 6 instances.

Enable detailed monitoring for all EC2 instances.

Storage & Logging

Create an S3 bucket (myapp-logs) to centrally store logs.

Enable versioning on the S3 bucket.

Apply a lifecycle policy to delete logs older than 30 days.

Database

Deploy an RDS instance with KMS encryption enabled for data at rest.

Deliverables:

A CloudFormation template in YAML format that implements the above requirements.

Ensure the template passes AWS CloudFormation validation and adheres to security and compliance best practices.

Output must be ready for deployment in the us-east-1 region with resource names following the convention: myapp-<resource-type>.