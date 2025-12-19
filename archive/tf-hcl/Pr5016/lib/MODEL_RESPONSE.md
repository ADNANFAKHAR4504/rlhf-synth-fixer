# Terraform AWS Migration Solution - us-west-1 to us-west-2

This document provides a Terraform migration plan for moving an AWS application from us-west-1 to us-west-2 using `terraform import` to preserve resource identities and minimize downtime.

## Migration Approach

```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary provider for the new region (us-west-2)
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment   = var.environment
      Project       = var.project_name
      ManagedBy     = "terraform"
      MigratedFrom  = "us-west-1"
      MigrationDate = var.migration_date
    }
  }
}

# Alias provider for the old region (for reference/cleanup)
provider "aws" {
  alias  = "old_region"
  region = "us-west-1"
}

# Data sources for existing resources in new region
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "private"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count  = length(aws_subnet.private)
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-private-rt-${count.index + 1}"
  }
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-web-sg"
  }
}

resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-app-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app-sg"
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-db-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = {
    Name = "${var.project_name}-db-sg"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.enable_deletion_protection

  tags = {
    Name = "${var.project_name}-alb"
  }
}

resource "aws_lb_target_group" "app" {
  name     = "${var.project_name}-app-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name = "${var.project_name}-app-tg"
  }
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Launch Template and Auto Scaling Group
resource "aws_launch_template" "app" {
  name_prefix   = "${var.project_name}-app-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_pair_name

  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = base64encode(var.user_data_script)

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-app-instance"
    }
  }

  tags = {
    Name = "${var.project_name}-app-lt"
  }
}

resource "aws_autoscaling_group" "app" {
  name                = "${var.project_name}-app-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-app-asg"
    propagate_at_launch = false
  }
}

# RDS Subnet Group and Database
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-database"

  engine         = "mysql"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.db_backup_retention_period
  backup_window          = var.db_backup_window
  maintenance_window     = var.db_maintenance_window

  skip_final_snapshot = var.skip_final_snapshot
  deletion_protection = var.enable_deletion_protection

  tags = {
    Name = "${var.project_name}-database"
  }
}
```

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "myapp"
}

variable "migration_date" {
  description = "Date of migration for tagging"
  type        = string
  default     = "2024-01-15"
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

# EC2 Configuration
variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0c02fb55956c7d316" # Amazon Linux 2 in us-west-2
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "key_pair_name" {
  description = "EC2 Key Pair name"
  type        = string
  default     = "myapp-keypair"
}

variable "user_data_script" {
  description = "User data script for EC2 instances"
  type        = string
  default     = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y docker
    service docker start
    usermod -a -G docker ec2-user
    # Add your application startup commands here
  EOF
}

# Auto Scaling Configuration
variable "asg_min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
  default     = 6
}

variable "asg_desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
  default     = 2
}

# Database Configuration
variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0.35"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "RDS maximum allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "myappdb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_backup_retention_period" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Database backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Database maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# General Configuration
variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying RDS instance"
  type        = bool
  default     = false
}
```

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "PLACEHOLDER-terraform-state-bucket"
    key            = "myapp/us-west-2/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "PLACEHOLDER-terraform-locks"
    
    # Optional: Use assume role for cross-account access
    # role_arn = "arn:aws:iam::ACCOUNT-ID:role/TerraformRole"
  }
}

# Alternative backend configuration for remote state management
# terraform {
#   backend "remote" {
#     hostname     = "app.terraform.io"
#     organization = "PLACEHOLDER-ORG-NAME"
#
#     workspaces {
#       name = "myapp-us-west-2"
#     }
#   }
# }

# Local backend alternative (not recommended for production)
# terraform {
#   backend "local" {
#     path = "terraform.tfstate"
#   }
# }
```

```markdown
# state-migration.md

# Terraform State Migration Guide: us-west-1 to us-west-2

## Prerequisites

1. Ensure you have appropriate AWS credentials configured
2. Backup existing Terraform state files
3. Verify all resources exist in both regions
4. Have the old resource IDs documented (see id-mapping.csv)

## Step 1: Backup Current State

```bash
# Backup current state from us-west-1
terraform workspace select myapp-us-west-1
terraform state pull > backup-us-west-1-$(date +%Y%m%d-%H%M%S).json

# List all resources in current state
terraform state list > resources-us-west-1.txt
```

## Step 2: Create New Workspace for us-west-2

```bash
# Create new workspace for us-west-2
terraform workspace new myapp-us-west-2

# Or select if already exists
terraform workspace select myapp-us-west-2

# Initialize the new workspace
terraform init
```

## Step 3: Import Resources to New State

**Important**: Execute imports in dependency order (VPC -> Subnets -> Security Groups -> etc.)

### Network Resources

```bash
# Import VPC
terraform import aws_vpc.main vpc-0123456789abcdef0

# Import Internet Gateway
terraform import aws_internet_gateway.main igw-0123456789abcdef0

# Import Subnets
terraform import 'aws_subnet.public[0]' subnet-0123456789abcdef0
terraform import 'aws_subnet.public[1]' subnet-0123456789abcdef1
terraform import 'aws_subnet.private[0]' subnet-0123456789abcdef2
terraform import 'aws_subnet.private[1]' subnet-0123456789abcdef3

# Import Route Tables
terraform import aws_route_table.public rtb-0123456789abcdef0
terraform import 'aws_route_table.private[0]' rtb-0123456789abcdef1
terraform import 'aws_route_table.private[1]' rtb-0123456789abcdef2

# Import Route Table Associations
terraform import 'aws_route_table_association.public[0]' subnet-0123456789abcdef0/rtb-0123456789abcdef0
terraform import 'aws_route_table_association.public[1]' subnet-0123456789abcdef1/rtb-0123456789abcdef0
terraform import 'aws_route_table_association.private[0]' subnet-0123456789abcdef2/rtb-0123456789abcdef1
terraform import 'aws_route_table_association.private[1]' subnet-0123456789abcdef3/rtb-0123456789abcdef2
```

### Security Groups

```bash
# Import Security Groups
terraform import aws_security_group.web sg-0123456789abcdef0
terraform import aws_security_group.app sg-0123456789abcdef1
terraform import aws_security_group.database sg-0123456789abcdef2
```

### Load Balancer Resources

```bash
# Import ALB
terraform import aws_lb.main arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/myapp-alb/1234567890123456

# Import Target Group
terraform import aws_lb_target_group.app arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/myapp-app-tg/1234567890123456

# Import Listener
terraform import aws_lb_listener.app arn:aws:elasticloadbalancing:us-west-2:123456789012:listener/app/myapp-alb/1234567890123456/1234567890123456
```

### Auto Scaling Resources

```bash
# Import Launch Template
terraform import aws_launch_template.app lt-0123456789abcdef0

# Import Auto Scaling Group
terraform import aws_autoscaling_group.app myapp-app-asg
```

### Database Resources

```bash
# Import DB Subnet Group
terraform import aws_db_subnet_group.main myapp-db-subnet-group

# Import RDS Instance
terraform import aws_db_instance.main myapp-database
```

## Step 4: Verify State Consistency

```bash
# Plan should show no changes if import was successful
terraform plan

# If there are differences, review and adjust configuration
terraform show

# Verify all resources are in state
terraform state list
```

## Step 5: Test Configuration

```bash
# Validate configuration
terraform validate

# Run plan to ensure no unexpected changes
terraform plan -out=migration-plan

# Apply only if plan shows expected results
# terraform apply migration-plan
```

## Step 6: State Verification Commands

```bash
# Compare resource counts
echo "Old region resources:"
wc -l resources-us-west-1.txt

echo "New region resources:"
terraform state list | wc -l

# Verify specific resources
terraform state show aws_vpc.main
terraform state show aws_db_instance.main
terraform state show aws_lb.main

# Check for any drift
terraform plan -detailed-exitcode
```

## Rollback Procedure

If migration fails:

```bash
# Switch back to old workspace
terraform workspace select myapp-us-west-1

# Restore from backup if needed
terraform state push backup-us-west-1-TIMESTAMP.json

# Delete problematic new workspace
terraform workspace select default
terraform workspace delete myapp-us-west-2
```

## Post-Migration Cleanup

```bash
# After successful migration and testing
terraform workspace select myapp-us-west-1

# Document old resources for cleanup
terraform state list > old-resources-for-cleanup.txt

# Eventually destroy old resources (after DNS cutover)
# terraform destroy
```
```

```csv
# id-mapping.csv
resource,address,old_id,new_id,notes
VPC,aws_vpc.main,vpc-abc123def456,vpc-def456abc123,Main application VPC
Internet Gateway,aws_internet_gateway.main,igw-abc123def456,igw-def456abc123,Main internet gateway
Public Subnet 1,aws_subnet.public[0],subnet-abc123def456,subnet-def456abc123,Public subnet AZ-a
Public Subnet 2,aws_subnet.public[1],subnet-bcd234efa567,subnet-efa567bcd234,Public subnet AZ-b
Private Subnet 1,aws_subnet.private[0],subnet-cde345fgb678,subnet-fgb678cde345,Private subnet AZ-a
Private Subnet 2,aws_subnet.private[1],subnet-def456ghc789,subnet-ghc789def456,Private subnet AZ-b
Public Route Table,aws_route_table.public,rtb-abc123def456,rtb-def456abc123,Public route table
Private Route Table 1,aws_route_table.private[0],rtb-bcd234efa567,rtb-efa567bcd234,Private route table AZ-a
Private Route Table 2,aws_route_table.private[1],rtb-cde345fgb678,rtb-fgb678cde345,Private route table AZ-b
Web Security Group,aws_security_group.web,sg-abc123def456,sg-def456abc123,Web tier security group
App Security Group,aws_security_group.app,sg-bcd234efa567,sg-efa567bcd234,Application tier security group
DB Security Group,aws_security_group.database,sg-cde345fgb678,sg-fgb678cde345,Database tier security group
Application Load Balancer,aws_lb.main,arn:aws:elasticloadbalancing:us-west-1:123456789012:loadbalancer/app/myapp-alb/50dc6c495c0c9188,arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/myapp-alb/60ec7d596d1d9299,Main application load balancer
Target Group,aws_lb_target_group.app,arn:aws:elasticloadbalancing:us-west-1:123456789012:targetgroup/myapp-app-tg/73e2d6ba618ba529,arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/myapp-app-tg/84f3e7cb729cb63a,Application target group
ALB Listener,aws_lb_listener.app,arn:aws:elasticloadbalancing:us-west-1:123456789012:listener/app/myapp-alb/50dc6c495c0c9188/f2f7dc8efc522ab2,arn:aws:elasticloadbalancing:us-west-2:123456789012:listener/app/myapp-alb/60ec7d596d1d9299/g3g8ed9fgd633bc3,HTTP listener port 80
Launch Template,aws_launch_template.app,lt-abc123def456,lt-def456abc123,Application launch template
Auto Scaling Group,aws_autoscaling_group.app,myapp-app-asg,myapp-app-asg,Application auto scaling group
DB Subnet Group,aws_db_subnet_group.main,myapp-db-subnet-group,myapp-db-subnet-group,Database subnet group
RDS Instance,aws_db_instance.main,myapp-database,myapp-database,Main database instance
Route Table Association 1,aws_route_table_association.public[0],subnet-abc123def456/rtb-abc123def456,subnet-def456abc123/rtb-def456abc123,Public subnet 1 association
Route Table Association 2,aws_route_table_association.public[1],subnet-bcd234efa567/rtb-abc123def456,subnet-efa567bcd234/rtb-def456abc123,Public subnet 2 association
Route Table Association 3,aws_route_table_association.private[0],subnet-cde345fgb678/rtb-bcd234efa567,subnet-fgb678cde345/rtb-efa567bcd234,Private subnet 1 association
Route Table Association 4,aws_route_table_association.private[1],subnet-def456ghc789/rtb-cde345fgb678,subnet-ghc789def456/rtb-fgb678cde345,Private subnet 2 association
```

```markdown
# runbook.md

# AWS Region Migration Runbook: us-west-1 to us-west-2

## Overview

This runbook provides step-by-step instructions for migrating the application from us-west-1 to us-west-2 with minimal downtime.

## Pre-Migration Checklist

- [ ] All stakeholders notified of maintenance window
- [ ] Backup verification completed
- [ ] New region resources provisioned and tested
- [ ] Database replication/backup restored in new region
- [ ] Application configuration updated for new region
- [ ] DNS TTL reduced to 60 seconds (24-48 hours before migration)
- [ ] Monitoring and alerting configured for new region
- [ ] Rollback procedures tested

## Migration Timeline

**Total Estimated Downtime: 15-30 minutes**

### Phase 1: Pre-Cutover (No Downtime)
*Duration: 2-4 hours*

#### Step 1: Final Data Sync
```bash
# Stop application writes (enable maintenance mode)
# Perform final database backup/sync
aws rds create-db-snapshot \
  --db-instance-identifier myapp-database \
  --db-snapshot-identifier myapp-final-snapshot-$(date +%Y%m%d-%H%M%S) \
  --region us-west-1

# Wait for snapshot completion
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier myapp-final-snapshot-TIMESTAMP \
  --region us-west-1

# Restore snapshot in new region
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier myapp-database \
  --db-snapshot-identifier myapp-final-snapshot-TIMESTAMP \
  --region us-west-2
```

#### Step 2: Application Deployment
```bash
# Deploy application to new region
terraform workspace select myapp-us-west-2
terraform apply

# Verify application health
curl -f https://internal-alb-us-west-2.example.com/health
```

#### Step 3: Pre-Cutover Testing
```bash
# Test application functionality
./scripts/smoke-test.sh us-west-2

# Verify database connectivity
./scripts/db-connectivity-test.sh us-west-2

# Load test (optional)
./scripts/load-test.sh us-west-2
```

### Phase 2: DNS Cutover (Downtime Begins)
*Duration: 5-10 minutes*

#### Step 4: Update DNS Records
```bash
# Get new ALB DNS name
NEW_ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names myapp-alb \
  --region us-west-2 \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "New ALB DNS: $NEW_ALB_DNS"

# Update Route 53 records
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{"Value": "'$NEW_ALB_DNS'"}]
      }
    }]
  }'
```

#### Step 5: Verify DNS Propagation
```bash
# Monitor DNS propagation
while true; do
  RESOLVED=$(dig +short api.example.com)
  echo "$(date): DNS resolves to: $RESOLVED"
  if [[ "$RESOLVED" == *"us-west-2"* ]]; then
    echo "DNS cutover successful!"
    break
  fi
  sleep 10
done
```

### Phase 3: Post-Cutover Verification (Downtime Ends)
*Duration: 10-15 minutes*

#### Step 6: Application Health Checks
```bash
# Verify application is responding
curl -f https://api.example.com/health

# Check application logs
aws logs tail /aws/ec2/myapp --region us-west-2 --follow

# Verify database connectivity
./scripts/db-connectivity-test.sh production
```

#### Step 7: Traffic Monitoring
```bash
# Monitor ALB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=app/myapp-alb/1234567890123456 \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-west-2

# Check error rates
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_ELB_5XX_Count \
  --dimensions Name=LoadBalancer,Value=app/myapp-alb/1234567890123456 \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-west-2
```

## Post-Migration Tasks

### Immediate (Within 1 hour)
- [ ] Verify all application functionality
- [ ] Confirm monitoring and alerting are working
- [ ] Update documentation with new resource IDs
- [ ] Notify stakeholders of successful migration
- [ ] Monitor application performance for anomalies

### Within 24 hours
- [ ] Increase DNS TTL back to normal values (300-3600 seconds)
- [ ] Update any hardcoded references to old region
- [ ] Verify backup procedures are working in new region
- [ ] Update disaster recovery procedures

### Within 1 week