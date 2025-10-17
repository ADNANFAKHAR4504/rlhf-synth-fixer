# Multi-Region AWS Infrastructure Setup

## What We're Building

We're setting up a robust multi-region AWS infrastructure to support our customers in North America and Europe. The goal is to use a single Terraform file (`tap_stack.tf`) to provision everything we need in both `us-east-2` and `eu-west-2`.

The CI system takes care of provider setup, so you don't need to add provider or backend blocks. Just use the aliased providers: `aws.use2` for us-east-2 and `aws.euw2` for eu-west-2.

## Regional Setup

We're targeting two regions with separate VPCs:
- **us-east-2** and **eu-west-2**
- Each VPC gets its own CIDR block (`10.10.0.0/16` for US, `10.20.0.0/16` for EU)
- Each VPC should have public and private subnets, ideally spread across two AZs for better availability
- Public subnets use an Internet Gateway, private subnets use a NAT Gateway for outbound internet access

## What Needs to Be Built

Here's the checklist for the infrastructure:

**Network Foundation**
- Two VPCs (one per region) with non-overlapping IP ranges
- Public and private subnets in each VPC, across multiple AZs

**Database Layer**
- RDS instance with PostgreSQL (or another SQL engine)
- Encrypted at rest using KMS (customer-managed key)
- Only in private subnets, no public access

**Security Setup**
- Security group allowing HTTPS (port 443) from the internet
- No SSH from the world (use SSM Session Manager for admin access)
- IAM role for app servers with EC2 read-only permissions

**File Processing**
- S3 bucket for uploads (private, versioned, KMS encrypted)
- Lambda function triggered by uploads
- Least-privilege permissions between S3 and Lambda

**Load Balancing and DNS**
- Application Load Balancer for EC2 instances
- HTTP listener

**Monitoring and Logging**
- CloudWatch alarms for EC2 CPU usage over 70%
- SNS topic for alarm notifications
- Centralized EC2 logs in CloudWatch Logs

**Security Standards**
- Everything tagged with `project = "cloud-setup"`
- KMS keys in each region
- All storage encrypted at rest

## Implementation Guidelines

**File Structure**
Put everything in a single `tap_stack.tf` file. No modules, no extra Terraform files. The CI system handles providers, so just use `provider = aws.use2` or `provider = aws.euw2` on resources.

**Variables to Include**
Set up variables for things that might change:
- Environment info: `env` (default: dev), `owner`, `cost_center`
- Network ranges: `use2_cidr`, `euw2_cidr`, subnet CIDR maps
- Instance settings: `web_instance_type` (use SSM Session Manager instead of key pairs)
- RDS config: engine version, instance class, storage size
- S3 bucket details for Lambda trigger

**Security Defaults**
- Force IMDSv2 on EC2 instances
- RDS is private, security groups only allow app tier access
- S3 buckets block public access and enforce secure transport
- Least-privilege IAM policies

**Naming Convention**
Keep it consistent: `cloud-setup-${var.env}-use2-vpc`, `cloud-setup-${var.env}-euw2-vpc`, etc.
Subnet names should show region, AZ, and type like `public-a` or `private-b`.

**Outputs Needed**
The validation system expects these outputs:
- VPC and subnet IDs for both regions
- KMS key ARNs
- S3 bucket name and Lambda function details
- ALB ARN and DNS name
- RDS endpoint and port
- IAM role name/ARN
- SNS topic ARN
- CloudWatch log group names

## What Success Looks Like

The validation system will check that everything works:

**Core Infrastructure**
- Both regions have properly configured VPCs and subnets
- RDS is encrypted with KMS and only accessible from private subnets
- IAM role gives app servers the right EC2 read-only permissions

**Application Stack**
- S3 and Lambda integration works for file uploads
- Load balancer has HTTP listener and can reach EC2 targets

**Monitoring Setup**
- CloudWatch alarms trigger on high CPU usage
- SNS notifications work for alerts
- Logs from EC2 flow to CloudWatch Logs

**Compliance**
- Everything tagged with the project identifier
- No provider or backend blocks in the file
- All required outputs present for integration testing

Just make sure every resource and data source uses the right provider alias, and the CI system will take care of the rest.
