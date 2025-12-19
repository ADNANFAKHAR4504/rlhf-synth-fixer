This document provides a CloudFormation YAML template to deploy a secure and scalable AWS production infrastructure in us-east-1.
The template enforces AWS security best practices, ensures scalability via Auto Scaling, and maintains robust logging and monitoring.
All security resources are tagged with Environment:Prod.

Key Features Implemented

Custom VPC with 2 public and 2 private subnets across different AZs.

Security Groups allowing only HTTP/HTTPS on public subnets and restricted SSH from a specific IP range.

IAM Roles for EC2 instances, following least privilege.

EC2 Auto Scaling Group (min 2, max 6) with detailed monitoring.

Centralized S3 bucket for logs with versioning and a 30-day lifecycle policy.

RDS instance with AWS KMS encryption enabled.

MFA enforcement for IAM users.

Consistent tagging for compliance and visibility.