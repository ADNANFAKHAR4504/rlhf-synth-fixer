You are an expert AWS infrastructure architect and Terraform developer specializing in secure, production-ready cloud environments. Create a comprehensive Terraform configuration that establishes a secure AWS infrastructure with proper resource connectivity and security isolation.

## Project Requirements

**Project Details:**

- Project Name: "IaC - AWS Nova Model Breaking"
- Author: ngwakoleslieelijah
- Created: 2025-08-14 21:08:49 UTC
- Infrastructure as Code Tool: Terraform (HCL)
- Target Region: us-east-1 (strictly enforced)

## Core Infrastructure Components & Connectivity

Design and implement the following interconnected infrastructure:

### 1. Network Foundation

- **VPC**: Deploy a secure VPC (10.0.0.0/16) in us-east-1 with DNS resolution enabled
- **Subnets**: Create public (10.0.1.0/24, 10.0.2.0/24) and private subnets (10.0.10.0/24, 10.0.20.0/24) across multiple AZs
- **NAT Gateway**: Enable outbound internet access for private resources
- **Route Tables**: Configure appropriate routing for public/private subnet isolation

### 2. Security Layer Architecture

- **EC2 Security Group**: Allow HTTPS (443) and HTTP (80) from internet, SSH (22) ONLY from VPC CIDR (10.0.0.0/16) - NEVER from 0.0.0.0/0
- **RDS Security Group**: Allow MySQL/PostgreSQL (3306/5432) ONLY from EC2 security group - create security group reference dependency
- **VPC Endpoint Security Group**: Allow HTTPS (443) from VPC CIDR for S3 VPC endpoint access
- **ALB Security Group**: Allow HTTP/HTTPS from internet, outbound to EC2 security group only

### 3. Compute & Application Tier

- **EC2 Instances**: Deploy in private subnets with EC2 security group attached
- **Application Load Balancer**: Deploy in public subnets with ALB security group
- **Auto Scaling Group**: Connect EC2 instances to ALB target groups
- **IAM Instance Profile**: Attach role with least-privilege S3 access via VPC endpoint

### 4. Database Layer

- **RDS Instance**: Deploy MySQL/PostgreSQL in private subnets using RDS security group
- **DB Subnet Group**: Span private subnets across multiple AZs
- **Encryption**: Enable encryption at rest using customer-managed KMS keys
- **Security**: Connect RDS to EC2 security group via security group rules (no direct CIDR access)

### 5. Storage & Data Management

- **S3 Data Bucket**: Enable server-side encryption (KMS), versioning, block all public access
- **S3 Logs Bucket**: Same security posture for application/access logs
- **VPC S3 Endpoint**: Route S3 traffic through private network, not internet
- **Bucket Policies**: Restrict access to VPC endpoint only (deny direct internet access)

### 6. Identity & Access Management

- **IAM Users**: Require MFA for console access, enforce MFA policy attachment
- **IAM Roles**: Create application roles with least-privilege policies for S3/RDS access
- **CloudTrail**: Log all IAM actions and API calls for security auditing
- **IAM Policies**: Use condition keys to enforce MFA and resource-specific access

### 7. Network Security & Monitoring

- **VPC Flow Logs**: Enable comprehensive network traffic logging
- **CloudWatch**: Monitor security group changes and unauthorized access attempts
- **AWS Config**: Ensure continuous compliance with security group rules

## Critical Security Requirements

1. **SSH Restriction**: Absolutely NO security group should allow SSH (port 22) from 0.0.0.0/0 - use VPC CIDR or specific IP ranges only
2. **Resource Connectivity**: EC2 → RDS via security group references (not CIDR blocks)
3. **S3 Isolation**: All S3 access must flow through VPC endpoints, never public internet
4. **Encryption Everywhere**: S3 (KMS), RDS (at-rest), EBS volumes (at-rest)
5. **MFA Enforcement**: IAM users must have MFA enabled and policies must check MFA presence
6. **Least Privilege**: IAM policies should grant minimum required permissions with resource-specific ARNs

## Terraform Structure Requirements

Organize the code using these modules:

- `modules/networking/` - VPC, subnets, routing, NAT gateway
- `modules/security/` - Security groups with proper ingress/egress rules
- `modules/compute/` - EC2, ALB, Auto Scaling with connectivity to other tiers
- `modules/database/` - RDS with encryption and security group connectivity
- `modules/storage/` - S3 buckets, VPC endpoints, bucket policies
- `modules/iam/` - Users, roles, policies with MFA requirements
- `modules/monitoring/` - CloudTrail, CloudWatch, VPC Flow Logs

## Deliverables

Provide complete Terraform configuration including:

1. **Root Configuration**: main.tf, variables.tf, outputs.tf, terraform.tfvars
2. **Module Structure**: All 7 modules with proper input/output connections
3. **Security Validation**: Ensure no security group allows SSH from 0.0.0.0/0
4. **Resource Dependencies**: Proper depends_on and resource references for connectivity
5. **Compliance Checks**: Configuration that passes AWS Config security rules
6. **Documentation**: README.md with deployment instructions and architecture diagram

## Success Criteria

The infrastructure must:

- Deploy successfully in us-east-1 without security violations
- Pass AWS Config compliance checks for security groups and S3 configuration
- Demonstrate proper resource connectivity (EC2 ↔ RDS, EC2 ↔ S3 via VPC endpoint)
- Enforce MFA for all IAM user operations
- Maintain complete audit trail via CloudTrail
- Block all unauthorized network access paths

Focus on creating secure, interconnected resources that follow AWS Well-Architected Framework security pillar principles while maintaining operational efficiency through proper Terraform module design.
