# Production-Grade Multi-Tier AWS Infrastructure

## Overview

Design and implement a production-grade AWS CloudFormation template that deploys a highly available, secure, and scalable multi-tier infrastructure. The solution should be:

- Cross-account executable
- Fully parameterized (no hardcoding)
- Completely automated (no manual steps)

## Architecture Requirements

### VPC & Networking

- **VPC Configuration**
  - New VPC with configurable CIDR (default: `10.0.0.0/16`)
  - Two public and two private subnets across different AZs
  - All subnet CIDRs should be parameterized
  - Internet Gateway for public access
  - NAT Gateways in public subnets with Elastic IPs

### Load Balancing (NLB)

- **Network Load Balancer Setup**
  - Deploy in front of EC2 instances in public subnets
  - Configure for HTTP/HTTPS traffic distribution
  - Automatic Elastic IP management
  - Auto Scaling Group integration for target registration

### Compute Layer (EC2 + Auto Scaling)

- **Instance Configuration**
  - Amazon Linux 2 AMI (via SSM Parameter Store)
  - Programmatically created EC2 Key Pair
  - Auto Scaling Group across multiple AZs
  - Security Group rules:
    - Inbound HTTP (80) and HTTPS (443) via NLB only

### Database Layer (RDS)

- **RDS Configuration**
  - MySQL/PostgreSQL with Multi-AZ enabled
  - Deployed in private subnets
  - No public access
  - Security Group: EC2 access only

### Storage Layer (S3)

- **S3 Bucket Setup**
  - Server-side encryption (SSE-S3 or SSE-KMS)
  - Private access bucket policies

### Monitoring & Logging

- **Observability Configuration**
  - VPC Flow Logs to S3 or CloudWatch Logs
  - Comprehensive resource tagging:
    - Project
    - Environment
    - Owner
    - Other relevant tags

## Cross-Account Requirements

### Resource References

- Avoid hardcoding:
  - AWS Account IDs
  - ARNs
  - Region names

### Dynamic Resolution

Use:
- Parameters
- Pseudo parameters (`AWS::AccountId`, `AWS::Region`, `AWS::Partition`)
- Dynamic references (SSM, Secrets Manager)

## Output Expectations

### Deliverables

1. Complete CloudFormation YAML template
2. Direct deployment capability via:
   - AWS Console
   - AWS CLI

### Required Resources

The template should create:
- VPC infrastructure (VPC, Subnets, IGW, NAT, NLB)
- Compute resources (EC2 ASG with Launch Template)
- Database (Multi-AZ RDS)
- Storage (SSE-enabled S3)
- Logging (VPC Flow Logs)

### Parameters

Clear definition of:
- CIDR ranges
- Key pair names
- Instance types
- Database credentials
- Other configurable values

## Technical Constraints

1. **AMI Selection**
   ```
   /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
   ```

2. **Validation Requirements**
   - Must pass `cfn-lint`
   - Must pass `aws cloudformation validate-template`

## Final Deliverable

Provide a production-ready CloudFormation YAML template that:
- Implements all required components
- Uses dynamic parameter resolution
- Includes NLB traffic routing
- Applies comprehensive tagging
- Requires no manual intervention