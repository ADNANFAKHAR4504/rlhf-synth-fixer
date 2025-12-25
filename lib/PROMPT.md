# Cloud Environment Setup with Terraform HCL

I need to create a complete cloud infrastructure setup using Terraform HCL for a production environment. The infrastructure should be deployed in the us-west-2 region and include the following requirements:

## Core Infrastructure Requirements

### VPC and Networking
- Create a VPC with CIDR block 10.0.0.0/16
- Set up public and private subnets across multiple availability zones for high availability
- Configure Internet Gateway for public subnet connectivity
- Implement NAT Gateway for private subnet outbound internet access
- Use VPC Block Public Access feature for enhanced security

### Compute Resources
- Deploy EC2 instances with minimum t3.medium instance type
- Place instances in private subnets for security
- Configure proper security groups with restricted SSH access (port 22) only from specific IP ranges
- Include systems manager access for secure remote management

### Database
- Set up RDS PostgreSQL database version 12 or higher
- Deploy database in private subnets with multi-AZ deployment for high availability
- Configure 7-day backup retention policy
- Enable encryption at rest for all database storage
- Create database subnet group spanning multiple availability zones

### Security and Compliance
- Implement encryption at rest for all storage components
- Configure security groups following principle of least privilege
- Use AWS Secrets Manager for database credential management
- Enable VPC Flow Logs for network monitoring

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
