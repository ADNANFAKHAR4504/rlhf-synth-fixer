You are an expert AWS infrastructure engineer specializing in security-focused Infrastructure as Code using Terraform HCL. Your task is to create a complete, production-ready, multi-region AWS infrastructure that implements comprehensive security best practices.

## Context & Requirements

**Project Details:**

- Problem ID: security_configuration_as_code_Terraform_HCL_h7js29a0kdr1
- Author: ngwakoleslieelijah
- Date: 2025-08-15 16:12:08 UTC
- Tool: Terraform (HCL)
- Target: Multi-region AWS deployment (us-east-1, eu-west-1)
- Environment: Production (vpc-123abc456def) and Staging (vpc-789ghi012jkl)

## Infrastructure Components Required

Create a secure, interconnected infrastructure including:

1. **VPC & Networking**: Multi-AZ subnets (public/private), NAT gateways, route tables
2. **EC2 Instances**: Application servers with encrypted EBS volumes
3. **RDS Database**: Multi-AZ MySQL/PostgreSQL with encryption at rest
4. **S3 Buckets**: Data storage with encryption and access controls
5. **Lambda Functions**: Serverless components restricted to VPC
6. **IAM Roles & Policies**: Least-privilege access controls
7. **KMS Keys**: Encryption key management with rotation
8. **CloudWatch**: Monitoring, logging, and alerting
9. **Security Groups**: Network access controls with specific CIDR restrictions

## Critical Security Requirements (MUST IMPLEMENT)

### Network Security:

- All security groups MUST include descriptive names and descriptions for audit purposes
- EC2 ports MUST only be accessible from specific CIDR blocks (never 0.0.0.0/0 except for ALB HTTP/HTTPS)
- Implement proper security group chaining (ALB -> EC2 -> RDS)
- Lambda functions MUST be restricted to VPC unless specifically justified

### Data Protection:

- RDS instances MUST have encryption at rest enabled with customer-managed KMS keys
- S3 buckets MUST NOT be publicly accessible (implement bucket policies and public access blocks)
- All EBS volumes MUST be encrypted
- KMS keys MUST have automatic rotation enabled

### Access Control:

- IAM roles MUST follow principle of least privilege with specific action permissions
- EC2 instances MUST disable password-based authentication (key-based only)
- ALL IAM users MUST have MFA enforcement policies
- User data scripts MUST be logged to CloudWatch for audit purposes

### Compliance & Monitoring:

- ALL resources MUST be tagged with 'environment' key ('prod' or 'staging')
- CloudWatch alarms MUST monitor EC2 CPU usage with high usage alerts
- Use ONLY trusted AMIs (Amazon Linux 2, Ubuntu LTS from official sources)
- Implement comprehensive CloudTrail logging

## Resource Connectivity Requirements

**Critical Connections to Implement:**

1. **ALB -> EC2**: Security group allowing HTTP/HTTPS from ALB to EC2 instances
2. **EC2 -> RDS**: Database security group allowing MySQL/PostgreSQL access only from EC2 security group
3. **EC2 -> S3**: IAM role allowing EC2 to access specific S3 buckets
4. **Lambda -> RDS**: VPC configuration allowing Lambda to connect to database
5. **CloudWatch -> SNS**: Alarm notifications for high CPU usage
6. **KMS -> All Services**: Encryption key access for RDS, EBS, S3, Lambda

## Expected Deliverables

Provide a complete Terraform configuration with:

1. **main.tf**: Main infrastructure resources with proper resource dependencies
2. **variables.tf**: All configurable parameters with descriptions and validation
3. **outputs.tf**: Essential outputs (VPC IDs, instance IDs, RDS endpoints, S3 bucket names)
4. **security.tf**: Dedicated security configurations (security groups, IAM policies)
5. **monitoring.tf**: CloudWatch alarms, dashboards, and SNS topics
6. **data.tf**: Data sources for AMIs, availability zones, caller identity

## Architecture Patterns to Follow

- Use consistent naming convention: `${var.project_name}-${var.environment}-${resource_type}`
- Implement proper resource tagging with local values
- Use data sources for dynamic values (AZs, AMIs, account info)
- Implement proper depends_on for resource ordering
- Use customer-managed KMS keys with appropriate key policies
- Create separate security groups for each tier (ALB, EC2, RDS, Lambda)

## Validation Requirements

The final configuration must:

- Pass `terraform validate` without errors
- Pass `terraform plan` successfully
- Include all 13 security constraints listed
- Be deployable in both us-east-1 and eu-west-1 regions
- Support both production and staging environments
- Include proper error handling and validation rules

## Code Quality Standards

- Include comprehensive comments explaining security decisions
- Use Terraform best practices (proper variable types, validation rules)
- Implement proper resource lifecycle management
- Include example terraform.tfvars file
- Ensure all sensitive values use appropriate sensitivity flags

Create infrastructure code that prioritizes security, follows AWS Well-Architected Framework principles, and implements defense-in-depth security patterns. Focus on creating a production-ready solution that would pass enterprise security audits.
