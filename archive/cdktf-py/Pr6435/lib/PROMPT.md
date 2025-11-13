# Task: Web Application Deployment

## Platform and Language
**CRITICAL**: This task MUST use **CDKTF with Python** (Cloud Development Kit for Terraform with Python bindings).

## Overview
Create a production-ready payment processing web application infrastructure for a fintech startup with strict PCI DSS compliance requirements. The application consists of a React frontend and Node.js API backend that processes credit card transactions.

## Requirements

Create a CDKTF for Terraform configuration to deploy a production-ready payment processing web application with the following components:

### 1. Network Infrastructure
- Set up a VPC with 3 availability zones, each with public and private subnets
- Enable VPC Flow Logs publishing to CloudWatch Logs
- Configure NAT Gateways for outbound internet access from private subnets

### 2. Frontend Infrastructure
- Deploy CloudFront distribution pointing to S3 bucket for React frontend assets
- Configure S3 bucket with appropriate access policies

### 3. Load Balancing & Compute
- Configure Application Load Balancer in public subnets with HTTPS listener using ACM certificate
- Create Auto Scaling Group in private subnets with launch template for Node.js API servers
- Implement AWS WAF with managed rule groups attached to ALB

### 4. Database
- Provision RDS PostgreSQL instance with Multi-AZ deployment and encrypted storage
- Store database connection string in Systems Manager Parameter Store as SecureString

### 5. Security
- Configure security groups allowing only HTTPS traffic to ALB and database access from API servers
- Implement least privilege access controls between tiers
- Enable encryption at rest for all data storage services

### 6. Monitoring & Alarms
- Set up CloudWatch alarms for ALB 5XX error rate above 5%
- Set up CloudWatch alarms for ASG CPU utilization above 80%
- Configure appropriate CloudWatch Logs retention

### 7. Resource Organization
- Apply consistent tagging strategy across all resources
- Organize code into complete Terraform modules by component (networking, compute, database, monitoring)
- Create variables.tf defining configurable parameters
- Create outputs.tf exposing critical resource IDs
- Include terraform.tfvars.example showing sample values

## Technical Context
- Production deployment in us-east-1 region (unless AWS_REGION file specifies otherwise)
- Infrastructure includes CloudFront for static content delivery
- ALB for load balancing EC2 instances running Node.js API
- RDS PostgreSQL Multi-AZ database
- S3 for frontend assets
- VPC spans 3 availability zones with public subnets for ALB and private subnets for compute and database tiers
- Requires Terraform 1.5+ with AWS provider 5.x configured
- Security groups enforce least privilege access between tiers

## Compliance Requirements
- PCI DSS compliance for payment processing
- Data encryption at rest and in transit
- Secure credential management
- Network isolation between application tiers
- Audit logging and monitoring

## Expected Deliverables
1. Complete CDKTF Python code organized by component
2. Modular structure with separate constructs for:
   - Networking (VPC, subnets, routing, NAT)
   - Compute (ALB, ASG, EC2 launch templates)
   - Database (RDS PostgreSQL)
   - Monitoring (CloudWatch alarms, logs)
   - Security (WAF, Security Groups)
3. Configuration files with appropriate variable definitions
4. Sample configuration values
5. Output definitions for critical resource identifiers

## Important Notes
- All resource names MUST include environmentSuffix parameter to prevent naming conflicts
- Use cost-effective configurations where possible while maintaining production readiness
- Ensure all resources are properly tagged for resource management
- Follow AWS Well-Architected Framework best practices
- Implement proper error handling and retry logic
