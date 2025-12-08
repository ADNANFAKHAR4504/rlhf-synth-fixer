Hey! We need to build a production-grade web application infrastructure for processing financial transactions using **CDKTF with Python**.

## Requirements

### Network Infrastructure
- VPC with 3 public and 3 private subnets across availability zones
- NAT gateways for private subnet internet access
- Internet gateway for public subnet connectivity

### Compute Layer
- Auto Scaling Group with Amazon Linux 2023 AMI (t3.large)
- IMDSv2 enforcement
- Auto Scaling policies based on CPU utilization (scale up at 70%, down at 30%)
- Scheduled scaling for business hours (8AM-6PM EST, minimum 3 instances)

### Load Balancing
- Application Load Balancer in public subnets
- Target group with /health endpoint health checks

### Database
- RDS Aurora MySQL 8.0 cluster with Multi-AZ deployment
- 2 Aurora instances for high availability
- Encryption at rest using KMS
- Automated backups with 7-day retention
- SSL/TLS encryption required for connections

### Content Delivery
- CloudFront distribution with ALB origin
- AWS WAF web ACL with rate limiting rules

### Storage
- S3 bucket for static assets (CloudFront access only)
- S3 bucket for application logs with 90-day retention lifecycle
- Server-side encryption for all S3 data

### Secrets Management
- Secrets Manager for database credentials
- Lambda function for automatic rotation every 30 days

### Monitoring
- CloudWatch log groups for application logs
- SNS topic for critical alerts

### Security
- IAM roles following least privilege principle
- KMS keys for encryption
- Security groups with minimal required access
- IMDSv2 required for all EC2 instances

### Resource Tagging
- All resources must include Environment, Application, and CostCenter tags
- Resource names must include environmentSuffix for uniqueness

## Deployment Requirements

- All resources must be destroyable (no Retain policies)
- Database deletion protection disabled for test environments
- S3 buckets allow force deletion
- Resource names include environmentSuffix parameter

## Code Organization

- `main.py` - Main stack definition
- `vpc.py` - VPC and networking
- `compute.py` - Auto Scaling Group
- `alb.py` - Application Load Balancer
- `database.py` - Aurora MySQL cluster
- `cdn.py` - CloudFront and WAF
- `storage.py` - S3 buckets
- `secrets.py` - Secrets Manager
- `monitoring.py` - CloudWatch and SNS
- `security.py` - IAM, KMS, Security Groups

## Deliverables

- Complete CDKTF Python implementation
- Unit tests for all components
- Integration tests for deployment validation
