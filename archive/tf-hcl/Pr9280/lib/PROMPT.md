# Cloud Environment Setup with Terraform HCL

I need to create a complete cloud infrastructure setup using Terraform HCL for a production environment. The infrastructure should be deployed in the us-west-2 region and demonstrate a secure multi-tier architecture where services connect and interact.

## Architecture Overview

Create a VPC with CIDR block 10.0.0.0/16 that hosts a multi-tier application:

- EC2 instances in private subnets that connect to an RDS PostgreSQL database through VPC security groups
- The EC2 instances retrieve database credentials from AWS Secrets Manager before connecting to RDS
- RDS database is deployed across multiple availability zones in private subnets, accessible only from the EC2 security group
- NAT Gateway provides outbound internet access for EC2 instances in private subnets to reach AWS services
- Systems Manager enables secure remote management of EC2 instances without requiring SSH
- VPC Flow Logs stream network traffic to CloudWatch for security monitoring

## Core Infrastructure Requirements

### VPC and Networking
- Create a VPC with CIDR block 10.0.0.0/16
- Set up public and private subnets across multiple availability zones for high availability
- Configure Internet Gateway for public subnet connectivity
- Implement NAT Gateway in public subnet to allow private subnet resources to access internet
- Use VPC Block Public Access feature for enhanced security
- Enable VPC Flow Logs that send network traffic data to CloudWatch Logs for monitoring

### Compute Resources
- Deploy EC2 instances with minimum t3.medium instance type in private subnets
- Configure security groups that allow SSH access on port 22 only from specific IP ranges and database access on port 5432 to RDS
- Attach IAM role to EC2 instances that grants permissions to read from Secrets Manager and use Systems Manager
- Include Systems Manager Session Manager access for secure remote management without exposing SSH ports

### Database
- Set up RDS PostgreSQL database version 12 or higher in private subnets
- Configure RDS security group to accept connections only from EC2 security group on port 5432
- Deploy database with multi-AZ deployment for high availability
- Configure 7-day backup retention policy
- Enable encryption at rest for all database storage
- Create database subnet group spanning multiple availability zones
- Store database master password in AWS Secrets Manager and grant EC2 IAM role read access

### Security and Compliance
- Implement encryption at rest for all storage components
- Configure security groups following principle of least privilege with explicit source/destination rules
- Use AWS Secrets Manager to store RDS credentials and allow EC2 instances to retrieve them via IAM role
- Enable VPC Flow Logs for network monitoring with CloudWatch Logs as destination

### Resource Tagging
All resources must be tagged with:
- Environment=Production
- Owner=DevOpsTeam

## Technical Specifications
- Use Terraform version 1.0 or higher
- Target AWS region: us-west-2
- Follow AWS best practices for security and cost optimization
- Ensure resources can be deployed and destroyed cleanly

Please provide the complete Terraform HCL infrastructure code. Structure the code with appropriate resource organization and include all necessary variables, outputs, and provider configurations. Each file should be in a separate code block with the filename clearly indicated.
