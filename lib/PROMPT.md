# Healthcare Infrastructure Project Requirements

## Project Overview

Our healthcare startup is expanding rapidly and needs a robust infrastructure setup that can scale across multiple environments. We're facing challenges with maintaining consistency between our development, staging, and production systems while ensuring we meet healthcare regulatory requirements and minimize deployment risks.

The goal is straightforward: create identical infrastructure configurations across all environments, with only the necessary environment-specific parameters changing between them.

## Current Challenge

We need to build a web application infrastructure that works seamlessly across three environments (development, staging, and production) while meeting strict healthcare compliance standards. The infrastructure should be consistent, secure, and easy to manage.

## Technical Environment

We're working with AWS in the us-west-2 region and plan to use Terraform workspaces to manage our different environments. Here's what we're planning to deploy:

- **Network Layer**: VPC with both public and private subnets spread across 2 availability zones for high availability
- **Load Balancing**: Application Load Balancer in the public subnets to handle incoming traffic
- **Compute**: EC2 instances running in private subnets for security
- **Database**: RDS PostgreSQL database in private subnets with proper encryption
- **Security**: KMS keys for encryption, IAM roles for EC2 instances
- **Monitoring**: CloudWatch log groups for each environment

Each environment will use separate state files managed through Terraform workspaces, ensuring complete isolation between dev, staging, and prod.

## Key Requirements

### Infrastructure Design
- Set up a VPC with public and private subnets across two availability zones
- Deploy an Application Load Balancer in public subnets to distribute traffic
- Launch EC2 instances in private subnets for better security
- Create an RDS PostgreSQL database with proper backup strategies

### Security & Compliance
- All RDS instances must use encrypted storage with customer-managed KMS keys
- Security groups should only allow HTTP/HTTPS traffic from the ALB security group
- Implement proper network isolation between tiers

### Environment Management
- Use Terraform workspaces to manage multiple environments cleanly
- Configure non-overlapping VPC CIDR blocks:
  - Development: 10.1.0.0/16
  - Staging: 10.2.0.0/16
  - Production: 10.3.0.0/16

### Environment-Specific Configurations
- **Instance Types**: Scale appropriately per environment
  - Development: t3.micro (cost-effective for testing)
  - Staging: t3.small (moderate capacity for integration testing)
  - Production: t3.medium (adequate capacity for live traffic)

- **Database Backups**: Different retention periods based on environment needs
  - Development: 1 day (minimal retention for cost savings)
  - Staging: 3 days (enough for testing cycles)
  - Production: 7 days (comprehensive backup for business continuity)

- **Production Safeguards**: Enable deletion protection on production RDS instances to prevent accidental data loss

### Code Organization
- Use a locals block to define environment-specific configurations cleanly
- Tag all resources with Environment, Project, and Owner for proper resource management
- Create meaningful outputs that include environment context in the key names

## Expected Deliverables

We need a modular Terraform configuration that includes:

- **main.tf**: Core infrastructure definitions
- **variables.tf**: Input variable definitions
- **outputs.tf**: Output definitions with environment context
- **terraform.tfvars**: Environment-specific variable values

The configuration should be deployable to any environment simply by switching Terraform workspaces, automatically applying the correct environment-specific settings while maintaining consistency in the overall infrastructure design.

This setup will help us maintain compliance, reduce deployment risks, and ensure our infrastructure can scale with our growing healthcare business.