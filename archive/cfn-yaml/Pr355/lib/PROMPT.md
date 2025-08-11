Prompt: Design a Secure and Scalable CloudFormation Template in YAML

Your objective is to create an AWS CloudFormation template using YAML that provisions a secure, well-architected, and production-ready cloud infrastructure. The deployment must follow AWS security best practices, emphasize resource isolation, and ensure operational efficiency.

Requirements
Region & Scope

All resources must be deployed in the us-east-1 region.

Security & Compliance

Implement IAM roles and policies with the least privilege principle.

Ensure data at rest encryption across all supported services using AWS KMS.

Restrict Security Group rules to only the required ports and protocols.

Attach an IAM instance profile to all EC2 instances.

Networking

Create a VPC with:

Public and private subnets

Route tables, NAT Gateways, and Internet Gateway for resource segregation and secure outbound access

Storage & Logging

Enable versioning and access logging on all S3 buckets.

Enable CloudTrail for logging API activity, particularly for Lambda and RDS.

Compute & Availability

Deploy RDS instances in a multi-AZ configuration for high availability and failover.

Assign static IPs to Lambda functions using AWS Global Accelerator for consistent outbound IP address management.

Content Delivery & Security

Use AWS Certificate Manager (ACM) to issue and manage SSL/TLS certificates for CloudFront distributions.

Resource Management

Tag all AWS resources with appropriate cost allocation and ownership metadata (e.g., Project, Environment, Owner, etc.).