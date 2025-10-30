Generate production-ready AWS CDKTF code in TypeScript for a fast-growing e-commerce startup, implementing the following:

Requirements:
Deploy a Node.js web application to AWS in us-west-2 using CDKTF and TypeScript.
Multi-AZ architecture with high availability and security best practices.
Infrastructure:
VPC spanning 2 Availability Zones.
Public subnets for ALB and NAT Gateway.
Private subnets for EC2 application servers and RDS PostgreSQL database.
NAT Gateway for outbound internet access from private subnets.
Application Load Balancer (ALB) in public subnets with SSL termination using AWS Certificate Manager.
EC2 instances running in private subnets, deployed across at least 2 AZs.
RDS PostgreSQL database in private subnets, with automated backups (7-day retention), credentials in AWS Secrets Manager.
Security groups using least privilege principle.
Environment variables for database connections and third-party API integrations.
All resources must have consistent tagging with 'Environment' and 'Project'.
Clean, modular, parameterized TypeScript code, following AWS best practices for security, HA, and maintainability.

