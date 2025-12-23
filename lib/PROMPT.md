# Task: Cloud Environment Setup

## Background
A startup is launching a new API service and needs to set up their initial AWS cloud environment. They require a secure, well-architected foundation that includes networking, compute, and data storage components with proper isolation and monitoring.

## Environment
AWS cloud environment in us-east-1 region featuring VPC with public and private subnets across two availability zones. Infrastructure includes EC2 instances in private subnets, RDS PostgreSQL database in Multi-AZ configuration, Application Load Balancer in public subnets, and CloudWatch Logs for monitoring. Network architecture uses NAT Gateways for outbound internet access from private subnets.

**CRITICAL PLATFORM OVERRIDE**: The CSV mandates using **CloudFormation with YAML**. The original task description mentions Pulumi/Python, but you MUST ignore that and implement using CloudFormation YAML templates per the CSV specification.

## Requirements

**Infrastructure-as-Code Platform**: CloudFormation using YAML format

Create a CloudFormation template to deploy a production-ready AWS environment for hosting a web application. The configuration must:

1. Create a VPC with CIDR block 10.0.0.0/16 and DNS hostnames enabled
2. Set up 4 subnets: 2 public and 2 private, distributed across availability zones us-east-1a and us-east-1b
   - Public subnets: 10.0.1.0/24 in us-east-1a and 10.0.2.0/24 in us-east-1b
   - Private subnets: 10.0.10.0/24 in us-east-1a and 10.0.11.0/24 in us-east-1b
3. Configure an Internet Gateway and attach it to the VPC
4. Create NAT Gateways in each public subnet for private subnet internet access
5. Set up route tables with appropriate routes for public and private subnets
   - Public route table: 0.0.0.0/0 routes to Internet Gateway
   - Private route tables: 0.0.0.0/0 routes to NAT Gateway, one per AZ
6. Deploy an RDS PostgreSQL instance version 15 in private subnets with automated backups
   - Instance class: db.t3.micro
   - Multi-AZ deployment
   - Backup retention: 7 days
7. Create an EC2 Auto Scaling Group with minimum 2 and maximum 4 instances in private subnets
   - AMI: Amazon Linux 2023
   - Instance type: t3.micro or parameterized
   - Launch Template with user data for application setup
8. Configure an Application Load Balancer in public subnets targeting the Auto Scaling Group
   - Listener: HTTPS on port 443 or HTTP on port 80
   - Target group with health checks
9. Set up security groups with least-privilege access:
   - ALB Security Group: Allow HTTPS port 443 from 0.0.0.0/0
   - EC2 Security Group: Allow HTTP port 80 from ALB Security Group only
   - RDS Security Group: Allow PostgreSQL port 5432 from EC2 Security Group only
10. Enable VPC Flow Logs sending data to a new CloudWatch Logs group
11. Output the ALB DNS name, RDS endpoint, and VPC ID

## Constraints

1. Use CloudFormation template format, not Pulumi Python SDK
2. Deploy all resources in the us-east-1 region
3. VPC CIDR block must be 10.0.0.0/16
4. Create exactly 2 public and 2 private subnets across different AZs
5. RDS instance must use db.t3.micro instance class
6. All EC2 instances must use Amazon Linux 2023 AMI
7. Enable VPC Flow Logs to CloudWatch Logs
8. Tag all resources with Environment=production and ManagedBy=cloudformation

## Expected Deliverables

1. **CloudFormation Template** in template.yaml:
   - Complete YAML template implementing all requirements
   - Proper resource dependencies using DependsOn where needed
   - Parameters for configurable values like instance types and CIDR blocks
   - Outputs for key resource identifiers

2. **Resource Organization**:
   - VPC and networking resources: VPC, subnets, IGW, NAT Gateways, route tables
   - Security groups with proper ingress and egress rules
   - EC2 Auto Scaling Group with Launch Template
   - Application Load Balancer with target groups and listeners
   - RDS PostgreSQL instance with DB subnet group
   - CloudWatch Logs log group for VPC Flow Logs
   - IAM roles and instance profiles for EC2 instances

3. **Tagging Strategy**:
   - All resources tagged with Environment=production
   - All resources tagged with ManagedBy=cloudformation
   - Consistent naming conventions using stack name

## Technical Specifications

- **Region**: us-east-1
- **Availability Zones**: us-east-1a and us-east-1b
- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 10.0.1.0/24 and 10.0.2.0/24
- **Private Subnets**: 10.0.10.0/24 and 10.0.11.0/24
- **RDS**: PostgreSQL 15 with db.t3.micro and Multi-AZ
- **EC2**: Amazon Linux 2023 with t3.micro and Auto Scaling from min 2 to max 4
- **ALB**: Application Load Balancer in public subnets
- **Security**:
  - Internet to ALB: HTTPS on port 443
  - ALB to EC2: HTTP on port 80
  - EC2 to RDS: PostgreSQL on port 5432

## CloudFormation Best Practices

1. Use intrinsic functions like Ref, GetAtt, Sub, and Join appropriately
2. Define parameters for environment-specific values
3. Use mappings for AMI IDs if needed
4. Ensure proper resource ordering with DependsOn
5. Export stack outputs for cross-stack references
6. Include comprehensive descriptions for all resources
7. Use descriptive logical IDs for resources
8. Follow AWS CloudFormation naming conventions

## Expected Output

A fully functional CloudFormation template that when deployed creates:
- A secure multi-AZ VPC with proper network segmentation
- Load-balanced auto-scaling compute tier
- Managed PostgreSQL database with backups
- Comprehensive monitoring via VPC Flow Logs
- All outputs necessary for connecting applications including ALB URL, RDS endpoint, and VPC ID
