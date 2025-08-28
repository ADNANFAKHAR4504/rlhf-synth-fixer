Hey there! I'm working on a project where I need to set up a production-ready web application infrastructure in AWS using Pulumi and Go. I'd really appreciate your help creating a comprehensive `tap_stack.go` file that handles everything securely.

Here's what I'm looking to build:

## The Big Picture
I need a solid, production-grade infrastructure setup in AWS us-east-1 that can handle a web application with proper security, monitoring, and high availability. Think enterprise-level stuff here.

## What I Need You to Build

### 1. Network Foundation
First, let's get the networking right:
- A VPC with CIDR `10.0.0.0/16` (dev environment)
- 3 public and 3 private subnets spread across us-east-1a, us-east-1b, and us-east-1c
- Internet Gateway for the public subnets
- NAT Gateways (one per AZ) so private instances can reach the internet when needed
- Proper route table associations
- No public IPs on private instances (security first!)
- VPC Endpoints for S3, Secrets Manager, CloudWatch Logs, SSM, and KMS to keep traffic internal

### 2. Application Infrastructure
For the web app itself:
- Application Load Balancer sitting in the public subnets
- ALB should redirect HTTP to HTTPS (with an ACM certificate)
- Health checks hitting `/healthz` endpoint
- Auto Scaling Group that:
  - Uses Amazon Linux 2023
  - Scales between 2-6 instances (start with 2)
  - Runs instances only in private subnets
  - Has proper IAM roles with least privilege access to Secrets Manager and CloudWatch

### 3. Security Hardening
This is crucial - I want this locked down:
- IAM roles and policies following least privilege principles
- Security Groups configured properly:
  - ALB: Only allow 80/443 from trusted sources (no wide-open 0.0.0.0/0 unless testing)
  - App instances: HTTP access only from ALB security group
  - Database: Port 5432 access only from app security group
- Restrict outbound traffic - apps should only talk to DB and VPC endpoints
- Enable IMDSv2 on all instances

### 4. Data Protection & Storage
For keeping data safe:
- S3 bucket for logs and artifacts:
  - KMS encryption
  - Block all public access
  - Bucket policy that denies non-TLS uploads
- RDS PostgreSQL in private subnets:
  - KMS encryption
  - Multi-AZ for high availability
- AWS Secrets Manager for database credentials with automatic rotation
- KMS keys:
  - One for data (S3, RDS, Secrets)
  - One for logs (CloudWatch, WAF)
  - Enable rotation and set up aliases

### 5. Monitoring & Observability
I want to know what's happening:
- CloudWatch metrics and logs for everything
- CloudWatch Alarms hooked up to SNS for alerting
- Lambda function that watches logs and sends critical alerts to SNS
- ALB access logs going to S3
- WAFv2 WebACL on the ALB with rate limiting and OWASP protections
- WAF logs flowing to Firehose and then to encrypted S3

### 6. Production Readiness
Make it bulletproof:
- Everything distributed across multiple AZs
- NAT Gateways and subnets properly spread out
- Deletion protection on ALB and RDS
- Consistent tagging (Name, Environment=Prod, Project=TapStack)
- Follow AWS Well-Architected Framework best practices

## What I Need From You
- A single `tap_stack.go` file written in Go using Pulumi AWS SDK v6
- Production-ready, secure, and well-tested
- Include TODO comments where I need to fill in client-specific stuff like domain names, ACM cert ARNs, or trusted CIDR ranges

This needs to be enterprise-grade stuff - think about what you'd deploy in a real production environment. I'm counting on you to make this solid!

Thanks in advance for your help with this. I know it's a lot, but I really need this to be comprehensive and secure.
