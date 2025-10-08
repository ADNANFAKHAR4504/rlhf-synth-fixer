# Multi-Tier AWS Web Application Infrastructure with Terraform

This solution provides a production-ready, highly available, and secure multi-tier AWS web application infrastructure deployed in the `us-west-2` region using Terraform HCL.

## Solution Overview

The infrastructure creates a complete AWS environment with the following components:

### 1. **Networking (VPC)**
- VPC with CIDR block `10.0.0.0/16`
- 2 public subnets (`10.0.1.0/24`, `10.0.2.0/24`) across 2 availability zones
- 2 private subnets (`10.0.10.0/24`, `10.0.11.0/24`) across 2 availability zones
- Internet Gateway for public subnet internet access
- 2 NAT Gateways (one per AZ) for private subnet outbound connectivity
- Route tables configured appropriately for public and private subnets

### 2. **S3 Storage**
- S3 bucket for storing logs with:
  - Server-side encryption using AWS KMS
  - Versioning enabled
  - Lifecycle policy to transition objects to GLACIER after 30 days
  - All public access blocked
  - `force_destroy = true` to allow cleanup during testing

### 3. **Database (RDS)**
- PostgreSQL 15 RDS instance with:
  - Multi-AZ deployment for high availability
  - KMS encryption for storage
  - Deployed in private subnets
  - Security group allowing access only from EC2 instances
  - Automated backups configured
  - Password stored in AWS Secrets Manager using `random_password`

### 4. **Compute (EC2 + Auto Scaling)**
- Launch Template with:
  - Latest Amazon Linux 2 AMI (dynamically fetched)
  - t3.micro instance type
  - EBS volumes encrypted with KMS
  - IAM instance profile attached (no hardcoded credentials)
  - User data script that:
    - Installs and configures CloudWatch agent
    - Installs and starts Apache httpd web server
    - Pushes custom CPU and memory metrics to CloudWatch
- Auto Scaling Group with:
  - Minimum 2 instances
  - Maximum 4 instances
  - Health checks via ELB
  - Deployed in private subnets

### 5. **Load Balancing (ALB)**
- Application Load Balancer with:
  - Deployed in public subnets
  - HTTP listener on port 80
  - Target group forwarding to EC2 instances
  - Health checks configured
  - Security group allowing HTTP/HTTPS from internet (0.0.0.0/0)

### 6. **Content Delivery (CloudFront)**
- CloudFront distribution with:
  - S3 logs bucket as origin
  - Origin Access Control (OAC) for secure S3 access
  - Default TTL of 86400 seconds (24 hours)
  - HTTPS redirect enabled
  - Access logging to S3 bucket

### 7. **Monitoring (CloudWatch)**
- CloudWatch alarms for:
  - CPU utilization > 75% for 5 minutes
  - Memory usage > 75% for 5 minutes
- SNS topic for alarm notifications
- Auto Scaling policies triggered by CPU alarms

### 8. **Security & Encryption**
- KMS key with automatic rotation enabled for:
  - S3 bucket encryption
  - RDS storage encryption
  - EBS volume encryption
- IAM roles and policies following least privilege:
  - EC2 instance role with CloudWatch, S3 read, and SSM permissions
  - No hardcoded credentials anywhere in the code
- Security groups with strict ingress/egress rules:
  - ALB: allows 80/443 from internet
  - EC2: allows 80 from ALB only
  - RDS: allows 5432 from EC2 only
- Secrets Manager for database password with immediate deletion (recovery_window = 0)

### 9. **Resource Identification**
- `random_id` resource for unique bucket and resource naming
- All resources tagged with `Environment = "Production"`

## Implementation

**File: `lib/tap_stack.tf`** - Complete infrastructure in a single file

The implementation includes all required Terraform resources following AWS best practices. Key highlights:

- **Provider Configuration**: AWS provider set to us-west-2 region
- **Data Sources**: Dynamic AMI lookup and availability zone discovery
- **Random Resources**: Unique naming for buckets and resources
- **Networking**: Full VPC setup with public/private subnets, IGW, NAT Gateways
- **Storage**: S3 with encryption, versioning, lifecycle policies
- **Database**: RDS PostgreSQL Multi-AZ with encryption
- **Compute**: Launch Template + Auto Scaling Group with CloudWatch agent
- **Load Balancing**: ALB with target groups and health checks
- **CDN**: CloudFront with OAC for S3 origin
- **Monitoring**: CloudWatch alarms and SNS notifications
- **Security**: KMS encryption, IAM roles, security groups, Secrets Manager

## Deployment Commands

```bash
# Initialize Terraform
terraform init -upgrade

# Format and validate
terraform fmt
terraform validate

# Plan deployment
terraform plan -out=tfplan

# Deploy infrastructure
terraform apply tfplan

# View outputs
terraform output

# Destroy when done (empty S3 bucket first if needed)
terraform destroy -auto-approve
```

## Testing

### Unit Tests (54 tests)
Validates Terraform configuration structure:
- Provider and region configuration
- Resource declarations
- Security settings
- Encryption configurations
- Tagging compliance

```bash
npm run test:unit
```

### Integration Tests
Validates deployed infrastructure:
- VPC and networking components
- S3 bucket configuration
- RDS database setup
- Security groups
- ALB and Auto Scaling
- CloudWatch alarms
- End-to-end connectivity

```bash
npm run test:integration
```

## Outputs

- `alb_dns_name`: Application Load Balancer DNS
- `cloudfront_domain_name`: CloudFront distribution domain
- `rds_endpoint`: Database connection endpoint (sensitive)
- `s3_bucket_name`: Logs bucket name
- `kms_key_arn`: KMS key ARN for encryption
- `vpc_id`: VPC identifier

## Key Features

- **High Availability**: Multi-AZ across 2 zones, redundant NAT Gateways
- **Security**: End-to-end encryption, least privilege IAM, private subnets
- **Monitoring**: Custom CloudWatch metrics, alarms, auto-scaling
- **Cost Optimization**: t3.micro instances, S3 lifecycle to GLACIER
- **Compliance**: All resources tagged, encryption enabled, audit logging

## Best Practices

- Single self-contained Terraform file as requested
- No hardcoded credentials - uses IAM roles and Secrets Manager
- Dynamic resource lookups (AMIs, AZs)
- Encryption at rest for all data stores
- Network segmentation (public/private subnets)
- Automated scaling based on metrics
- Proper tagging for resource management
- Force destroy enabled for testing/QA cleanup