Build a secure, high-availability infrastructure for a web application using AWS CDK TypeScript to deploy across two AWS regions with the following requirements:

The solution should deploy resources across two AWS regions for high availability. Create a VPC in each region with a CIDR block of 10.0.0.0/16, containing two public subnets and two private subnets. Host Application Load Balancers (ALBs) in public subnets to distribute traffic and deploy EC2 instances in private subnets for the web application.

Ensure security groups restrict inbound traffic on EC2 instances to only HTTP/HTTPS from the ALB. Set up parameterized S3 buckets in each region for application logs with cross-region replication enabled. Use DynamoDB Global Tables for data consistency across regions and implement IAM roles with the principle of least privilege allowing EC2 instances access to S3 and DynamoDB.

Tag all resources with 'Environment: Production' and 'Project: WebApp'. The infrastructure must span two AWS regions for high availability with proper security configurations across multiple AWS services.

Design:
The solution should be implemented entirely within the existing Infrastructure class in lib/infrastructure.ts. All resources must use the environmentSuffix parameter for consistent naming and tagging. If the environmentSuffix does not contain "prod", every resource should be configured for destruction to ensure proper cleanup of non-production environments. Everything input parameter except for environmentSuffix should be optional. Do not create separate stacks or files outside the lib directory. The design should emphasize clean separation of components, reusable constructs, and compliance with the stated constraints. Follow AWS CDK best practices for TypeScript development and ensure the infrastructure is production-ready with proper error handling.
