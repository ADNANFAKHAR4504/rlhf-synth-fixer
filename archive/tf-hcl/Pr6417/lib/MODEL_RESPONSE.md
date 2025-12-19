# Infrastructure Refactoring and Optimization - Terraform Implementation

This implementation provides a comprehensive refactoring of existing AWS infrastructure using Terraform with HCL, incorporating modern best practices for variable management, resource lifecycle, tagging, and state management.

## File: lib/variables.tf

```hcl
variable "environmentSuffix" {
  description = "Environment suffix for resource naming to support multiple PR environments"
  type        = string
  validation {
    condition     = length(var.environmentSuffix) > 0 && length(var.environmentSuffix) <= 20
    error_message = "environmentSuffix must be between 1 and 20 characters"
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "ap-southeast-1"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "aws_region must be a valid AWS region format"
  }
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.micro"
  validation {
    condition     = can(regex("^[a-z][0-9][a-z]?\\.(nano|micro|small|medium|large|xlarge|[0-9]+xlarge)$", var.instance_type))
    error_message = "instance_type must be a valid EC2 instance type"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid CIDR block"
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = map(string)
  default = {
    "subnet-1" = "10.0.1.0/24"
    "subnet-2" = "10.0.2.0/24"
  }
  validation {
    condition     = alltrue([for cidr in values(var.public_subnet_cidrs) : can(cidrhost(cidr, 0))])
    error_message = "All public_subnet_cidrs must be valid CIDR blocks"
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = map(string)
  default = {
    "subnet-1" = "10.0.10.0/24"
    "subnet-2" = "10.0.11.0/24"
  }
  validation {
    condition     = alltrue([for cidr in values(var.private_subnet_cidrs) : can(cidrhost(cidr, 0))])
    error_message = "All private_subnet_cidrs must be valid CIDR blocks"
  }
}

variable "availability_zones" {
  description = "Availability zones for subnet placement"
  type        = map(string)
  default = {
    "subnet-1" = "ap-southeast-1a"
    "subnet-2" = "ap-southeast-1b"
  }
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
  validation {
    condition     = can(regex("^db\\.[a-z][0-9][a-z]?\\.(micro|small|medium|large|xlarge|[0-9]+xlarge)$", var.db_instance_class))
    error_message = "db_instance_class must be a valid RDS instance class"
  }
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
  validation {
    condition     = var.db_allocated_storage >= 20 && var.db_allocated_storage <= 65536
    error_message = "db_allocated_storage must be between 20 and 65536 GB"
  }
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0.35"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "infrastructure-refactor"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "engineering"
}

variable "ec2_instances" {
  description = "Map of EC2 instances to create"
  type = map(object({
    instance_type = string
    subnet_key    = string
  }))
  default = {
    "web-1" = {
      instance_type = "t3.micro"
      subnet_key    = "subnet-1"
    }
    "web-2" = {
      instance_type = "t3.micro"
      subnet_key    = "subnet-2"
    }
  }
}

variable "enable_monitoring" {
  description = "Enable detailed monitoring for EC2 instances"
  type        = bool
  default     = true
}

variable "secrets_manager_secret_name" {
  description = "Name of the AWS Secrets Manager secret for database credentials"
  type        = string
  default     = "rds-db-credentials"
}
```

## File: lib/locals.tf

```hcl
locals {
  common_tags = {
    Environment = var.environmentSuffix
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CostCenter  = var.cost_center
    Region      = var.aws_region
  }

  resource_prefix = "${var.project_name}-${var.environmentSuffix}"

  db_port = 3306
}
```

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
```

## File: lib/backend.tf

```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "infrastructure/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
    kms_key_id     = "alias/terraform-state"
  }
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = "terraform-state-bucket-${var.environmentSuffix}"

  tags = merge(local.common_tags, {
    Name        = "terraform-state-${var.environmentSuffix}"
    Description = "S3 bucket for Terraform state storage"
  })
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.terraform_state.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "terraform_lock" {
  name         = "terraform-state-lock-${var.environmentSuffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(local.common_tags, {
    Name        = "terraform-lock-${var.environmentSuffix}"
    Description = "DynamoDB table for Terraform state locking"
  })
}

resource "aws_kms_key" "terraform_state" {
  description             = "KMS key for Terraform state encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "terraform-state-key-${var.environmentSuffix}"
  })
}

resource "aws_kms_alias" "terraform_state" {
  name          = "alias/terraform-state-${var.environmentSuffix}"
  target_key_id = aws_kms_key.terraform_state.key_id
}
```

## File: lib/data.tf

```hcl
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

data "aws_secretsmanager_secret" "db_credentials" {
  name = var.secrets_manager_secret_name
}

data "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = data.aws_secretsmanager_secret.db_credentials.id
}

data "aws_availability_zones" "available" {
  state = "available"
}
```

## File: lib/vpc.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "vpc-${var.environmentSuffix}"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "igw-${var.environmentSuffix}"
  })
}

resource "aws_subnet" "public" {
  for_each = var.public_subnet_cidrs

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value
  availability_zone       = var.availability_zones[each.key]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "public-${each.key}-${var.environmentSuffix}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  for_each = var.private_subnet_cidrs

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = var.availability_zones[each.key]

  tags = merge(local.common_tags, {
    Name = "private-${each.key}-${var.environmentSuffix}"
    Type = "private"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "public-rt-${var.environmentSuffix}"
  })
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "private-rt-${var.environmentSuffix}"
  })
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}
```

## File: lib/security_groups.tf

```hcl
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environmentSuffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "alb-sg-${var.environmentSuffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "web" {
  name_prefix = "web-sg-${var.environmentSuffix}-"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "web-sg-${var.environmentSuffix}"
  })
}

resource "aws_security_group" "rds" {
  name_prefix = "rds-sg-${var.environmentSuffix}-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL from web servers"
    from_port       = local.db_port
    to_port         = local.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "rds-sg-${var.environmentSuffix}"
  })
}
```

## File: lib/iam.tf

```hcl
resource "aws_iam_role" "ec2" {
  name_prefix = "ec2-role-${var.environmentSuffix}-"

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

  tags = merge(local.common_tags, {
    Name = "ec2-role-${var.environmentSuffix}"
  })
}

resource "aws_iam_role_policy" "ec2_secrets" {
  name_prefix = "ec2-secrets-policy-"
  role        = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = data.aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "ec2-profile-${var.environmentSuffix}-"
  role        = aws_iam_role.ec2.name

  tags = merge(local.common_tags, {
    Name = "ec2-profile-${var.environmentSuffix}"
  })
}
```

## File: lib/alb.tf

```hcl
resource "aws_lb" "main" {
  name_prefix        = "alb-"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [for subnet in aws_subnet.public : subnet.id]

  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  tags = merge(local.common_tags, {
    Name = "alb-${var.environmentSuffix}"
  })
}

resource "aws_lb_target_group" "main" {
  name_prefix = "tg-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, {
    Name = "tg-${var.environmentSuffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

resource "aws_lb_target_group_attachment" "instances" {
  for_each = module.ec2_instances

  target_group_arn = aws_lb_target_group.main.arn
  target_id        = each.value.instance_id
  port             = 80
}
```

## File: lib/rds.tf

```hcl
resource "aws_db_subnet_group" "main" {
  name_prefix = "db-subnet-group-${var.environmentSuffix}-"
  subnet_ids  = [for subnet in aws_subnet.private : subnet.id]

  tags = merge(local.common_tags, {
    Name = "db-subnet-group-${var.environmentSuffix}"
  })
}

resource "aws_db_instance" "main" {
  identifier_prefix = "rds-${var.environmentSuffix}-"

  engine               = "mysql"
  engine_version       = var.db_engine_version
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true
  kms_key_id          = aws_kms_key.rds.arn

  db_name  = "appdb"
  username = jsondecode(data.aws_secretsmanager_secret_version.db_credentials.secret_string)["username"]
  password = jsondecode(data.aws_secretsmanager_secret_version.db_credentials.secret_string)["password"]

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  skip_final_snapshot       = true
  final_snapshot_identifier = "rds-${var.environmentSuffix}-final-snapshot"

  deletion_protection = false

  multi_az = false

  tags = merge(local.common_tags, {
    Name = "rds-${var.environmentSuffix}"
  })

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "rds-key-${var.environmentSuffix}"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environmentSuffix}"
  target_key_id = aws_kms_key.rds.key_id
}
```

## File: lib/main.tf

```hcl
module "ec2_instances" {
  source = "./modules/ec2"

  for_each = var.ec2_instances

  instance_name       = each.key
  instance_type       = each.value.instance_type
  ami_id             = data.aws_ami.amazon_linux_2023.id
  subnet_id          = aws_subnet.public[each.value.subnet_key].id
  security_group_ids = [aws_security_group.web.id]
  iam_instance_profile = aws_iam_instance_profile.ec2.name
  environment_suffix = var.environmentSuffix
  enable_monitoring  = var.enable_monitoring

  common_tags = local.common_tags
}
```

## File: lib/modules/ec2/variables.tf

```hcl
variable "instance_name" {
  description = "Name identifier for the EC2 instance"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "ami_id" {
  description = "AMI ID to use for the instance"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID where the instance will be launched"
  type        = string
}

variable "security_group_ids" {
  description = "List of security group IDs to attach to the instance"
  type        = list(string)
}

variable "iam_instance_profile" {
  description = "IAM instance profile name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "enable_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = true
}

variable "common_tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "user_data" {
  description = "User data script for instance initialization"
  type        = string
  default     = ""
}

variable "root_volume_size" {
  description = "Size of the root volume in GB"
  type        = number
  default     = 20
}

variable "root_volume_type" {
  description = "Type of the root volume"
  type        = string
  default     = "gp3"
}
```

## File: lib/modules/ec2/main.tf

```hcl
resource "aws_instance" "this" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = var.security_group_ids
  iam_instance_profile   = var.iam_instance_profile

  monitoring = var.enable_monitoring

  user_data = var.user_data != "" ? var.user_data : <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              EOF

  root_block_device {
    volume_type           = var.root_volume_type
    volume_size           = var.root_volume_size
    delete_on_termination = true
    encrypted             = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  tags = merge(var.common_tags, {
    Name = "${var.instance_name}-${var.environment_suffix}"
  })

  lifecycle {
    ignore_changes = [ami]
  }
}
```

## File: lib/modules/ec2/outputs.tf

```hcl
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.this.id
}

output "instance_arn" {
  description = "ARN of the EC2 instance"
  value       = aws_instance.this.arn
}

output "private_ip" {
  description = "Private IP address of the instance"
  value       = aws_instance.this.private_ip
}

output "public_ip" {
  description = "Public IP address of the instance"
  value       = aws_instance.this.public_ip
}

output "availability_zone" {
  description = "Availability zone of the instance"
  value       = aws_instance.this.availability_zone
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = { for k, v in aws_subnet.public : k => v.id }
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = { for k, v in aws_subnet.private : k => v.id }
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "rds_endpoint" {
  description = "Connection endpoint for RDS instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_address" {
  description = "Address of the RDS instance"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "rds_port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}

output "ec2_instance_ids" {
  description = "IDs of EC2 instances"
  value       = { for k, v in module.ec2_instances : k => v.instance_id }
}

output "ec2_private_ips" {
  description = "Private IP addresses of EC2 instances"
  value       = { for k, v in module.ec2_instances : k => v.private_ip }
}

output "ec2_public_ips" {
  description = "Public IP addresses of EC2 instances"
  value       = { for k, v in module.ec2_instances : k => v.public_ip }
}

output "s3_state_bucket" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "dynamodb_lock_table" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_lock.name
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environmentSuffix
}
```

## File: lib/terraform.tfvars.example

```hcl
environmentSuffix = "dev"
aws_region        = "ap-southeast-1"
instance_type     = "t3.micro"
vpc_cidr          = "10.0.0.0/16"

public_subnet_cidrs = {
  "subnet-1" = "10.0.1.0/24"
  "subnet-2" = "10.0.2.0/24"
}

private_subnet_cidrs = {
  "subnet-1" = "10.0.10.0/24"
  "subnet-2" = "10.0.11.0/24"
}

availability_zones = {
  "subnet-1" = "ap-southeast-1a"
  "subnet-2" = "ap-southeast-1b"
}

db_instance_class     = "db.t3.micro"
db_allocated_storage  = 20
db_engine_version     = "8.0.35"

project_name = "infrastructure-refactor"
cost_center  = "engineering"

ec2_instances = {
  "web-1" = {
    instance_type = "t3.micro"
    subnet_key    = "subnet-1"
  }
  "web-2" = {
    instance_type = "t3.micro"
    subnet_key    = "subnet-2"
  }
}

enable_monitoring             = true
secrets_manager_secret_name   = "rds-db-credentials"
```

## File: lib/README.md

```markdown
# Infrastructure Refactoring and Optimization

This Terraform configuration provides a comprehensive refactoring of AWS infrastructure with modern best practices for variable management, resource lifecycle, tagging, and state management.

## Architecture Overview

This infrastructure includes:
- VPC with public and private subnets across multiple availability zones
- Application Load Balancer for traffic distribution
- EC2 instances managed through a reusable module
- RDS MySQL database with encryption and lifecycle protection
- S3 backend with DynamoDB state locking
- Comprehensive IAM roles with least privilege access
- Security groups with proper ingress/egress rules

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS Secrets Manager secret containing database credentials with keys: username and password

## Key Features

### 1. Variable Extraction
All hardcoded values are extracted into validated variables:
- Instance types, regions, CIDR blocks
- Validation rules for all inputs
- Clear descriptions for each variable

### 2. For_each Resource Management
All resources use for_each instead of count:
- Prevents resource recreation on list reordering
- Enables map-based resource management
- Safer infrastructure updates

### 3. Comprehensive Tagging
Consistent tags applied via locals.common_tags:
- Environment
- Project
- ManagedBy
- CostCenter
- Region

### 4. Lifecycle Management
- RDS instances: prevent_destroy = true
- ALB target groups: create_before_destroy = true
- EC2 instances: ignore_changes = [ami]

### 5. Dynamic AMI Lookup
Uses data.aws_ami to fetch latest Amazon Linux 2023 AMI automatically.

### 6. Reusable EC2 Module
Located in modules/ec2/ with:
- Flexible instance configuration
- Security group management
- IAM instance profile support
- Detailed monitoring options
- Encrypted root volumes
- IMDSv2 enforcement

### 7. Secure State Management
- S3 backend with encryption at rest using KMS
- DynamoDB table for state locking
- Versioning enabled on state bucket
- Public access blocked

### 8. Comprehensive Outputs
All critical resource IDs, endpoints, and ARNs exported for other teams.

## Deployment Instructions

### Initial Setup

1. Create the required AWS Secrets Manager secret:
```bash
aws secretsmanager create-secret \
  --name rds-db-credentials \
  --secret-string '{"username":"admin","password":"YourSecurePassword123!"}' \
  --region ap-southeast-1
```

2. Copy the example tfvars file:
```bash
cp terraform.tfvars.example terraform.tfvars
```

3. Edit terraform.tfvars with your environment-specific values:
```bash
vim terraform.tfvars
```

4. Initialize Terraform (first run will create local state):
```bash
terraform init
```

### Backend Migration

After initial deployment, migrate to remote backend:

1. Deploy the S3 bucket and DynamoDB table first:
```bash
terraform apply -target=aws_s3_bucket.terraform_state \
  -target=aws_s3_bucket_versioning.terraform_state \
  -target=aws_s3_bucket_server_side_encryption_configuration.terraform_state \
  -target=aws_s3_bucket_public_access_block.terraform_state \
  -target=aws_dynamodb_table.terraform_lock \
  -target=aws_kms_key.terraform_state \
  -target=aws_kms_alias.terraform_state
```

2. Update backend.tf with the actual bucket name from outputs.

3. Re-initialize to migrate state:
```bash
terraform init -migrate-state
```

### Full Deployment

```bash
terraform plan
terraform apply
```

## Resource Naming Convention

All resources follow the pattern: resource-type-environment-suffix

Example: web-1-dev, alb-prod, rds-staging

## Security Features

- All data encrypted at rest using KMS
- IMDSv2 required for EC2 instances
- Security groups with minimal required access
- IAM roles follow least privilege principle
- Secrets stored in AWS Secrets Manager
- Public access blocked on state bucket

## Testing

### Validate Configuration
```bash
terraform validate
```

### Plan Changes
```bash
terraform plan
```

### Test Outputs
```bash
terraform output
```

### Integration Tests
Integration tests should load outputs from cfn-outputs/flat-outputs.json for validation.

## Maintenance

### Update AMI
AMI updates are automatic using data source. To force update:
```bash
terraform apply -replace="module.ec2_instances[\"web-1\"].aws_instance.this"
```

### Modify Infrastructure
1. Update variables in terraform.tfvars
2. Run terraform plan to review changes
3. Run terraform apply to execute

### Add New EC2 Instance
Add to ec2_instances map in terraform.tfvars:
```hcl
ec2_instances = {
  "web-1" = { instance_type = "t3.micro", subnet_key = "subnet-1" }
  "web-2" = { instance_type = "t3.micro", subnet_key = "subnet-2" }
  "web-3" = { instance_type = "t3.small", subnet_key = "subnet-1" }
}
```

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

Note: RDS instance has prevent_destroy lifecycle rule. To destroy:
1. Comment out the lifecycle block in rds.tf
2. Run terraform apply
3. Run terraform destroy

## Outputs Reference

| Output | Description | Sensitive |
|--------|-------------|-----------|
| vpc_id | VPC identifier | No |
| alb_dns_name | Load balancer DNS name | No |
| rds_endpoint | Database connection endpoint | Yes |
| ec2_instance_ids | Map of instance identifiers | No |
| s3_state_bucket | State storage bucket name | No |

## Troubleshooting

### State Lock Issues
```bash
terraform force-unlock <LOCK_ID>
```

### Backend Issues
```bash
terraform init -reconfigure
```

### AMI Not Found
Verify the region and AMI filters in data.tf.

## Support

For issues or questions, refer to the Terraform documentation or contact the infrastructure team.
```

## Implementation Summary

This comprehensive Terraform implementation includes:

1. Complete variable extraction with validation for all configuration values
2. For_each resource management for EC2 instances, subnets, and target group attachments
3. Comprehensive tagging strategy applied automatically via default tags and locals
4. Lifecycle management for RDS (prevent_destroy) and ALB target groups (create_before_destroy)
5. Dynamic AMI lookup using data source with filters for Amazon Linux 2023
6. Reusable EC2 module with full configuration support
7. Secure S3 backend with KMS encryption and DynamoDB locking
8. Extensive outputs for all critical resources and endpoints
9. Security best practices including encryption, IMDSv2, least privilege IAM
10. Full documentation with deployment instructions and troubleshooting

All resources use the environmentSuffix variable for naming, and integration tests can load outputs from the standard location.
