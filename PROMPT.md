# Cloud Environment Setup

## Background
A fintech startup needs to establish their first AWS cloud environment for their payment processing application. They require a secure network foundation with proper isolation between web servers, application servers, and database layers. The setup must follow AWS best practices for security and network segmentation.

## Problem Statement
Create a Pulumi TypeScript program to deploy a production-ready AWS environment for a three-tier web application. The configuration must: 1. Create a VPC with CIDR block 10.0.0.0/16 in ap-southeast-1 region. 2. Deploy public subnets in two availability zones for web servers (10.0.1.0/24 and 10.0.2.0/24). 3. Deploy private subnets in two availability zones for application servers (10.0.10.0/24 and 10.0.11.0/24). 4. Deploy isolated database subnets in two availability zones (10.0.20.0/24 and 10.0.21.0/24). 5. Configure an Internet Gateway and attach it to the VPC for public subnet connectivity. 6. Set up NAT Gateways in each public subnet for private subnet outbound traffic. 7. Create route tables with appropriate routes for public, private, and database subnets. 8. Deploy security groups for web tier (allow HTTPS from 0.0.0.0/0), app tier (allow traffic from web tier only), and database tier (allow PostgreSQL from app tier only). 9. Launch one t3.micro EC2 instance in each public subnet with Amazon Linux 2 AMI. 10. Create an RDS subnet group using the database subnets. 11. Deploy an S3 bucket with versioning enabled for application assets. Expected output: A fully functional VPC with proper network segmentation, EC2 instances accessible via public IPs, and infrastructure ready for RDS deployment. All resources should be tagged with Environment=Production and Project=PaymentApp.

## Environment
AWS

## Constraints
- Use Pulumi's AWS Classic provider version 6.x or higher
- All resource names must follow the pattern: {resource-type}-{tier}-{az} (e.g., subnet-public-1a)
- Enable VPC flow logs and store them in CloudWatch Logs
- Security groups must use explicit ingress rules with descriptions
- NAT Gateways must use Elastic IPs for static addressing
- EC2 instances must use IMDSv2 (Instance Metadata Service Version 2) only
- All subnets must have 'Name' tags indicating their purpose and AZ
- Use Pulumi stack outputs to export VPC ID, subnet IDs, and security group IDs

## Subject Labels
aws, infrastructure, networking, vpc, security
