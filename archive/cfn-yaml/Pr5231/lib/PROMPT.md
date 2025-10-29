# AWS CloudFormation Infrastructure Design Specification

## Overview

Design and implement a production-grade CloudFormation template (`web-application-infra.yaml`) that creates a secure, scalable, multi-AZ web application infrastructure on AWS. The solution must be fully automated and deployable across any AWS account or region without manual pre-configuration.

## Infrastructure Components

### 1. Network Architecture

#### VPC and Subnet Design
- Create a VPC spanning two Availability Zones for high availability
- Configure dual subnet tiers:
  - Public subnets (one per AZ)
  - Private subnets (one per AZ)

#### Network Components
- Internet Gateway for public internet access
- NAT Gateway with Elastic IP for private subnet outbound connectivity
- Separate route tables for public and private subnets with appropriate routing

### 2. Compute Infrastructure

#### SSH Access Management
- Automated key pair generation using `AWS::EC2::KeyPair`
- Dynamic naming convention: `<Environment>-KeyPair` (using `!Sub`)

#### Instance Configuration
- AMI Selection:
  - Dynamically fetch latest Amazon Linux 2 AMI via SSM Parameter Store
  - Path: `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`
  - Region-aware implementation using `!Ref` and `!Sub`

#### Launch Template Specifications
- Use dynamic AMI ID from SSM
- Integrate generated key pair
- Configure web server setup via UserData (Apache/Nginx)
- Attach least-privilege IAM role for EC2:
  - S3 access for logging
  - CloudWatch metrics permission

#### Auto Scaling Configuration
- Scale settings:
  - Minimum: 2 instances
  - Maximum: 5 instances
- Deploy across private subnets
- CPU-based scaling (60% threshold)

#### Load Balancer Setup
- Application Load Balancer (ALB):
  - Public subnet deployment
  - HTTP listener (port 80)
  - Route traffic to private EC2 instances

#### Security Group Configuration
- ALB Security Group:
  - Allow inbound HTTP (80) from internet
- EC2 Security Group:
  - Allow HTTP (80) from ALB security group only
  - Allow SSH (22) from parameterized admin CIDR

### 3. Database Infrastructure

#### RDS Configuration
- Database Engine Options:
  - MySQL or PostgreSQL
  - Deployment in private subnets
- High Availability Features:
  - Multi-AZ deployment
  - Encrypted storage at rest
- Security Configuration:
  - Restrict inbound access to EC2 security group
  - Custom DB subnet group for controlled placement
  - Parameterized credentials management

### 4. Monitoring and Logging

#### Centralized Logging
- S3 bucket configuration for:
  - ALB access logs storage
  - EC2 application logs
  - CloudTrail audit records

#### Monitoring Setup
- Enhanced CloudWatch monitoring:
  - EC2 instance metrics
  - ALB performance metrics
- CloudTrail Configuration:
  - Comprehensive management event logging
  - S3 bucket integration for log storage

### 5. Security and IAM Configuration

#### EC2 IAM Configuration
- Instance Profile Setup:
  - CloudWatch logs access
  - S3 log delivery permissions
  - System metrics collection rights
- Security Implementation:
  - Strict least-privilege access
  - Dynamic resource naming convention:
    ```
    <Environment>-<Service>-<ResourceType>
    ```
    (implemented via `!Sub`)

### 6. Template Parameters

#### Required Configuration Parameters
- Environment Settings:
  - Environment name (Dev/Staging/Prod)
  - VPC CIDR range
  - Subnet CIDR blocks
  - Admin SSH CIDR range
- Compute Settings:
  - EC2 instance type
  - ASG capacity parameters (min/max/desired)
- Database Configuration:
  - Engine selection
  - Database name
  - Username
  - Password

### 7. Template Outputs

#### Essential Resource Information
- Load Balancer:
  - ALB DNS name
- Network:
  - VPC identifier
- Access:
  - Key pair name
- Database:
  - RDS endpoint
- Storage:
  - Log bucket name
## Implementation Requirements

### Best Practices and Standards

#### Code Quality
- Avoid hardcoded values:
  - No static region names
  - No fixed ARNs
  - No account IDs
- Use dynamic references:
  - Implement `!Ref`, `!Sub`, `!GetAtt`, `!FindInMap`
  - Ensure cross-account compatibility
- Maintain code quality:
  - YAML format with proper indentation
  - Pass `aws cloudformation validate-template` check

#### Operational Excellence
- Ensure idempotent deployments
- Follow AWS Well-Architected Framework:
  - Security
  - Reliability
  - Performance efficiency
  - Cost optimization
  - Operational excellence

## Deliverables

### Template Specifications
A production-ready CloudFormation template (`web-application-infra.yaml`) that:

1. Is universally deployable:
   - Works across any AWS account
   - Functions in any region
   - Requires no manual modifications

2. Implements complete automation:
   - Self-service key pair creation
   - Dynamic AMI selection via SSM
   - Full stack deployment:
     - Networking (VPC, ALB, NAT)
     - Compute (ASG, EC2)
     - Database (RDS)
     - Security (IAM)
     - Monitoring (CloudWatch, CloudTrail)
     - Storage (S3 logging)

3. Maintains flexibility:
   - Parameter-driven configuration
   - Environment-specific customization
   - Zero hardcoded values