# Ideal Response: Production-Ready AWS Network Infrastructure with Terraform

## Executive Summary

This solution provides a complete, production-ready AWS network infrastructure implementation using Terraform. It addresses all requirements specified in PROMPT.md while following AWS Well-Architected Framework principles and Terraform best practices.

## Architecture Overview

The infrastructure deploys a secure, highly available network architecture in AWS us-west-1 region with the following components:

- **VPC**: 10.0.0.0/16 CIDR block with DNS support enabled
- **Public Subnets**: Two subnets (10.0.1.0/24, 10.0.2.0/24) across different availability zones
- **Internet Gateway**: Provides internet connectivity for public subnets
- **Route Tables**: Public route table with internet gateway route (0.0.0.0/0)
- **Security Group**: Allows HTTP (80) and SSH (22) inbound, all outbound traffic
- **IAM Role**: EC2 instance role with S3 ReadOnly and EC2 Full Access permissions
- **Instance Profile**: Enables EC2 instances to assume the IAM role

## Key Design Decisions

### 1. Multi-File Structure

The solution is organized into two files for better maintainability:

- **tap_stack.tf**: All infrastructure resources, variables, and outputs
- **provider.tf**: Terraform and provider configuration

This separation follows infrastructure-as-code best practices by isolating provider configuration from resource definitions.

### 2. High Availability

Resources are distributed across multiple availability zones in us-west-1:

- Public Subnet 1: us-west-1a
- Public Subnet 2: us-west-1b

### 3. Security Best Practices

- All resources include comprehensive tagging (Name, Environment, Project, ManagedBy)
- IAM roles use AWS managed policies with least privilege principle
- Security groups have descriptive rules with protocol specifications
- VPC has DNS hostnames and DNS support enabled for service discovery

### 4. Flexibility and Reusability

- Input variables for all CIDR blocks, instance types, project name, and environment
- Consistent naming convention using variable interpolation
- Comprehensive outputs for integration with other Terraform configurations

## Complete Infrastructure Code

### tap_stack.tf

```hcl
# tap_stack.tf - Production-ready AWS Network Infrastructure for us-west-1
# This configuration implements a secure, scalable VPC with public subnets,
# security groups, and IAM roles following AWS best practices

# Input Variables for flexible configuration
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_1_cidr" {
  description = "CIDR block for public subnet 1"
  type        = string
  default     = "10.0.1.0/24"
}

variable "public_subnet_2_cidr" {
  description = "CIDR block for public subnet 2"
  type        = string
  default     = "10.0.2.0/24"
}

variable "instance_type" {
  description = "EC2 instance type for future deployments"
  type        = string
  default     = "t3.micro"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "production-infrastructure"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

# Data source to fetch available AZs in us-west-1
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Configuration
# Security Best Practice: Using RFC 1918 private address space
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true # Enable DNS hostnames for easier resource identification
  enable_dns_support   = true # Enable DNS resolution within VPC

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Internet Gateway for public subnet internet connectivity
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Public Subnet 1 in first available AZ
# Security Best Practice: Distributing subnets across multiple AZs for high availability
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_1_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true # Auto-assign public IPs to instances launched in this subnet

  tags = {
    Name        = "${var.project_name}-public-subnet-1"
    Type        = "Public"
    Environment = var.environment
    Project     = var.project_name
    AZ          = data.aws_availability_zones.available.names[0]
    ManagedBy   = "Terraform"
  }
}

# Public Subnet 2 in second available AZ
resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_2_cidr
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true # Auto-assign public IPs to instances launched in this subnet

  tags = {
    Name        = "${var.project_name}-public-subnet-2"
    Type        = "Public"
    Environment = var.environment
    Project     = var.project_name
    AZ          = data.aws_availability_zones.available.names[1]
    ManagedBy   = "Terraform"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-public-rt"
    Type        = "Public"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Route for internet traffic through Internet Gateway
# Security Best Practice: Only allowing outbound internet access through controlled IGW
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id

  depends_on = [aws_internet_gateway.main]
}

# Associate Public Subnet 1 with Public Route Table
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

# Associate Public Subnet 2 with Public Route Table
resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Security Group for web and SSH access
# Security Best Practice: Implementing least privilege principle with specific port allowances
resource "aws_security_group" "main" {
  name        = "${var.project_name}-sg"
  description = "Security group for web and SSH access"
  vpc_id      = aws_vpc.main.id

  # Inbound rule for HTTP traffic
  # Security Note: Consider adding source IP restrictions for production environments
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound rule for SSH access
  # Security Best Practice: In production, restrict SSH to known IP ranges or use Systems Manager Session Manager
  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # WARNING: Consider restricting to specific IPs in production
  }

  # Allow all outbound traffic
  # Security Note: Consider restricting egress to specific destinations for enhanced security
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-security-group"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# IAM Role for EC2 instances with S3 ReadOnly and EC2 Full Control
# Security Best Practice: Using AWS managed policies for standard permissions
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

  # Trust relationship policy allowing EC2 service to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-ec2-iam-role"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "EC2 instance role with S3 read and EC2 management permissions"
    ManagedBy   = "Terraform"
  }
}

# Attach S3 ReadOnly policy to IAM role
# Security Best Practice: Using AWS managed policy for consistent, maintained permissions
resource "aws_iam_role_policy_attachment" "s3_readonly" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

# Attach EC2 Full Access policy to IAM role
# Security Note: Full EC2 access should be reviewed for production use cases
resource "aws_iam_role_policy_attachment" "ec2_full" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2FullAccess"
}

# Create instance profile for EC2 instances to use the IAM role
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name        = "${var.project_name}-ec2-instance-profile"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Outputs for reference and integration with other Terraform configurations
output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_1_id" {
  description = "ID of public subnet 1"
  value       = aws_subnet.public_1.id
}

output "public_subnet_2_id" {
  description = "ID of public subnet 2"
  value       = aws_subnet.public_2.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "security_group_id" {
  description = "ID of the main security group"
  value       = aws_security_group.main.id
}

output "iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "iam_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "availability_zones" {
  description = "Availability zones used for subnets"
  value = [
    data.aws_availability_zones.available.names[0],
    data.aws_availability_zones.available.names[1]
  ]
}
```

### provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

## How This Solution Addresses PROMPT.md Requirements

### VPC Implementation

- **Requirement**: CIDR block 10.0.0.0/16 with descriptive tags
- **Implementation**: `aws_vpc.main` resource with specified CIDR, includes Name, Environment, Project, and ManagedBy tags
- **Enhancement**: Added DNS hostname and DNS support for better resource discovery

### Public Subnets

- **Requirement**: Two subnets (10.0.1.0/24, 10.0.2.0/24) in different AZs, associated with route table
- **Implementation**: `aws_subnet.public_1` and `aws_subnet.public_2` using data source for dynamic AZ selection
- **Enhancement**: `map_public_ip_on_launch = true` for automatic public IP assignment

### Internet Gateway

- **Requirement**: IGW attached to VPC with tags
- **Implementation**: `aws_internet_gateway.main` attached to VPC via vpc_id reference
- **Enhancement**: Comprehensive tagging for resource tracking

### Route Table & Routes

- **Requirement**: Route table for public subnets with 0.0.0.0/0 route to IGW
- **Implementation**:
  - `aws_route_table.public` for public route table
  - `aws_route.public_internet` for internet access route
  - `aws_route_table_association.public_1` and `public_2` for subnet associations
- **Enhancement**: Explicit depends_on for proper resource ordering

### IAM Role

- **Requirement**: IAM role with S3 ReadOnly and EC2 Full Control using managed policies
- **Implementation**:
  - `aws_iam_role.ec2_role` with EC2 trust relationship
  - `aws_iam_role_policy_attachment.s3_readonly` (AmazonS3ReadOnlyAccess)
  - `aws_iam_role_policy_attachment.ec2_full` (AmazonEC2FullAccess)
  - `aws_iam_instance_profile.ec2_profile` for EC2 attachment
- **Enhancement**: Detailed tags including Purpose field

### Security Group

- **Requirement**: Allow HTTP (80) and SSH (22) inbound, all outbound
- **Implementation**: `aws_security_group.main` with:
  - Ingress rules for ports 80 and 22 from 0.0.0.0/0
  - Egress rule allowing all traffic
- **Enhancement**: Descriptive descriptions for each rule, security warnings in comments

### Terraform Variables

- **Requirement**: Variables for CIDR blocks and instance types
- **Implementation**: 7 input variables covering:
  - aws_region (us-west-1)
  - vpc_cidr (10.0.0.0/16)
  - public_subnet_1_cidr (10.0.1.0/24)
  - public_subnet_2_cidr (10.0.2.0/24)
  - instance_type (t3.micro)
  - project_name (production-infrastructure)
  - environment (production)
- **Enhancement**: Type constraints and descriptions for all variables

### Outputs

- **Requirement**: Output VPC ID, Subnet IDs, IGW ID, Route Table ID, Security Group ID
- **Implementation**: 9 outputs including:
  - vpc_id
  - public_subnet_1_id and public_subnet_2_id
  - internet_gateway_id
  - public_route_table_id
  - security_group_id
  - iam_role_arn
  - iam_instance_profile_name
  - availability_zones
- **Enhancement**: Descriptive output descriptions for documentation

### Constraints Compliance

- **Region**: All resources in us-west-1 via provider configuration
- **Best Practices**: Proper resource dependencies, id references, terraform blocks
- **Tagging**: Every resource includes Name, Environment, Project, ManagedBy tags
- **Least Privilege**: IAM role uses only AWS managed policies as required

## Deployment Instructions

1. **Initialize Terraform**:

   ```bash
   terraform init -backend-config="bucket=your-bucket" -backend-config="key=your-key" -backend-config="region=us-west-1"
   ```

2. **Review Plan**:

   ```bash
   terraform plan
   ```

3. **Apply Configuration**:

   ```bash
   terraform apply
   ```

4. **View Outputs**:

   ```bash
   terraform output
   ```

5. **Destroy Resources** (when needed):

   ```bash
   terraform destroy
   ```

## Security Considerations

1. **SSH Access**: The security group allows SSH from 0.0.0.0/0. In production, restrict this to known IP ranges or use AWS Systems Manager Session Manager.

2. **EC2 Full Access**: The IAM role has full EC2 permissions. Consider restricting to specific actions based on actual requirements.

3. **Outbound Traffic**: All outbound traffic is allowed. Consider implementing egress filtering for enhanced security.

4. **Public Subnets**: Subnets auto-assign public IPs. Ensure only resources requiring direct internet access are placed here.

## Extensibility

This infrastructure can be extended with:

- Private subnets with NAT Gateway for internal resources
- Application Load Balancer for distributing traffic
- Auto Scaling Groups for EC2 instances
- RDS databases in private subnets
- CloudWatch monitoring and alarms
- VPC Flow Logs for network traffic analysis
- AWS WAF for web application firewall protection

## Conclusion

This solution provides a production-ready, secure, and highly available AWS network infrastructure that fully addresses all requirements in PROMPT.md while following industry best practices and AWS Well-Architected Framework principles.
