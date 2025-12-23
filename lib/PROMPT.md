Build a highly available VPC environment using AWS CDK with TypeScript. This is for deploying mission-critical multi-tiered applications with enterprise security standards.

What we need:

A VPC spanning three Availability Zones in us-west-2 using CIDR block 10.0.0.0/16. Set up public and private subnets in each AZ for a two-tier architecture. Use a single NAT Gateway in the first AZ to keep costs down while still giving private subnets internet access.

For compute, deploy an EC2 Auto Scaling Group running nginx behind an Application Load Balancer. The ALB should have health checks configured. Use launch templates with nginx user data scripts and standard EBS storage.

Security requirements: implement Security Groups following least privilege, add NACLs for subnet-level filtering, configure IAM roles with minimal permissions for CloudWatch and SSM. Set up VPC Flow Logs to CloudWatch and S3 for network monitoring. Enable CloudTrail for audit logging.

Add VPC endpoints for S3 and DynamoDB to reduce egress costs. Include CloudWatch-based auto-scaling policies for the web tier.

Use the tf- prefix for all resource names and keep the code DRY by using loops to create resources across the three AZs.

Outputs needed: ALB DNS name, VPC ID, subnet IDs, Auto Scaling Group ARN, Launch Template version, CloudWatch Log Group names, and web-app security group ID.
