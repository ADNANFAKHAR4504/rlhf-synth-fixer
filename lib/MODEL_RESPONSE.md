I'll design a comprehensive multi-region, multi-environment AWS infrastructure stack that meets all your requirements. Let me break this down into the requested structure.

## provider.tf

```hcl
terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
  }

  backend "s3" {
    # These values will be provided via backend config file or -backend-config flags
    # bucket         = "terraform-state-${random_id.state_suffix.hex}"
    # key            = "terraform.tfstate"
    # region         = "us-east-1"
    # dynamodb_table = "terraform-locks"
    # encrypt        = true
    # kms_key_id     = "alias/terraform-state-key"
  }
}

# Primary provider for us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  default_tags {
    tags = var.common_tags
  }
}

# Secondary provider for eu-central-1
provider "aws" {
  alias  = "eu_central_1"
  region = "eu-central-1"
  
  default_tags {
    tags = var.common_tags
  }
}

# Default provider (us-east-1 for global resources)
provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = var.common_tags
  }
}
```

## tap_stack.tf

```hcl
# Variables
variable "environment" {
  description = "Environment name (dev, stage, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "stage", "prod"], var.environment)
    error_message = "Environment must be one of: dev, stage, prod."
  }
}

variable "regions" {
  description = "List of AWS regions to deploy to"
  type        = list(string)
  default     = ["us-east-1", "eu-central-1"]
}

variable "allowed_ingress_cidrs" {
  description = "List of CIDR blocks allowed for ingress"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Owner       = "platform-team"
    Purpose     = "multi-region-web-app"
    Environment = "dev"
    CostCenter  = "engineering"
    Project     = "tap-stack"
  }
}

variable "kms_key_alias" {
  description = "KMS key alias for encryption"
  type        = string
  default     = "tap-stack"
}

variable "active_color" {
  description = "Active deployment color for blue-green deployment"
  type        = string
  default     = "blue"
  validation {
    condition     = contains(["blue", "green"], var.active_color)
    error_message = "Active color must be either 'blue' or 'green'."
  }
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "tap-stack.example.com"
}

# Local values
locals {
  name_prefix = "${var.environment}-tap-stack"
  
  # AZ configuration per region
  az_config = {
    "us-east-1" = {
      azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
      cidr = "10.0.0.0/16"
    }
    "eu-central-1" = {
      azs = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
      cidr = "10.1.0.0/16"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

# Random suffix for unique resource naming
resource "random_id" "suffix" {
  byte_length = 4
}

#==============================================================================
# KMS Keys (per region)
#==============================================================================

module "kms_us_east_1" {
  source = "./modules/kms"
  
  providers = {
    aws = aws.us_east_1
  }
  
  environment = var.environment
  region      = "us-east-1"
  key_alias   = "${var.kms_key_alias}-us-east-1"
  tags        = var.common_tags
}

module "kms_eu_central_1" {
  source = "./modules/kms"
  
  providers = {
    aws = aws.eu_central_1
  }
  
  environment = var.environment
  region      = "eu-central-1"
  key_alias   = "${var.kms_key_alias}-eu-central-1"
  tags        = var.common_tags
}

#==============================================================================
# Networking (per region)
#==============================================================================

module "network_us_east_1" {
  source = "./modules/network"
  
  providers = {
    aws = aws.us_east_1
  }
  
  environment             = var.environment
  region                  = "us-east-1"
  vpc_cidr               = local.az_config["us-east-1"].cidr
  availability_zones     = local.az_config["us-east-1"].azs
  allowed_ingress_cidrs  = var.allowed_ingress_cidrs
  kms_key_id            = module.kms_us_east_1.key_id
  tags                  = var.common_tags
}

module "network_eu_central_1" {
  source = "./modules/network"
  
  providers = {
    aws = aws.eu_central_1
  }
  
  environment             = var.environment
  region                  = "eu-central-1"
  vpc_cidr               = local.az_config["eu-central-1"].cidr
  availability_zones     = local.az_config["eu-central-1"].azs
  allowed_ingress_cidrs  = var.allowed_ingress_cidrs
  kms_key_id            = module.kms_eu_central_1.key_id
  tags                  = var.common_tags
}

#==============================================================================
# VPC Peering between regions
#==============================================================================

module "vpc_peering" {
  source = "./modules/vpc-peering"
  
  providers = {
    aws.requester = aws.us_east_1
    aws.accepter  = aws.eu_central_1
  }
  
  environment           = var.environment
  requester_vpc_id     = module.network_us_east_1.vpc_id
  requester_region     = "us-east-1"
  accepter_vpc_id      = module.network_eu_central_1.vpc_id
  accepter_region      = "eu-central-1"
  requester_route_table_ids = module.network_us_east_1.private_route_table_ids
  accepter_route_table_ids  = module.network_eu_central_1.private_route_table_ids
  tags                 = var.common_tags
}

#==============================================================================
# Secrets Management
#==============================================================================

module "secrets_us_east_1" {
  source = "./modules/secrets"
  
  providers = {
    aws = aws.us_east_1
  }
  
  environment = var.environment
  region      = "us-east-1"
  kms_key_id  = module.kms_us_east_1.key_id
  tags        = var.common_tags
}

module "secrets_eu_central_1" {
  source = "./modules/secrets"
  
  providers = {
    aws = aws.eu_central_1
  }
  
  environment = var.environment
  region      = "eu-central-1"
  kms_key_id  = module.kms_eu_central_1.key_id
  tags        = var.common_tags
}

#==============================================================================
# Compute (per region)
#==============================================================================

module "compute_us_east_1" {
  source = "./modules/compute"
  
  providers = {
    aws = aws.us_east_1
  }
  
  environment           = var.environment
  region               = "us-east-1"
  vpc_id               = module.network_us_east_1.vpc_id
  private_subnet_ids   = module.network_us_east_1.private_subnet_ids
  public_subnet_ids    = module.network_us_east_1.public_subnet_ids
  security_group_id    = module.network_us_east_1.app_security_group_id
  alb_security_group_id = module.network_us_east_1.alb_security_group_id
  kms_key_id          = module.kms_us_east_1.key_id
  active_color        = var.active_color
  app_secrets_arn     = module.secrets_us_east_1.app_secrets_arn
  tags                = var.common_tags
}

module "compute_eu_central_1" {
  source = "./modules/compute"
  
  providers = {
    aws = aws.eu_central_1
  }
  
  environment           = var.environment
  region               = "eu-central-1"
  vpc_id               = module.network_eu_central_1.vpc_id
  private_subnet_ids   = module.network_eu_central_1.private_subnet_ids
  public_subnet_ids    = module.network_eu_central_1.public_subnet_ids
  security_group_id    = module.network_eu_central_1.app_security_group_id
  alb_security_group_id = module.network_eu_central_1.alb_security_group_id
  kms_key_id          = module.kms_eu_central_1.key_id
  active_color        = var.active_color
  app_secrets_arn     = module.secrets_eu_central_1.app_secrets_arn
  tags                = var.common_tags
}

#==============================================================================
# DNS (Route 53)
#==============================================================================

module "dns" {
  source = "./modules/dns"
  
  # Uses default provider (us-east-1) for global Route 53 resources
  
  environment    = var.environment
  domain_name    = var.domain_name
  active_color   = var.active_color
  
  # ALB endpoints from both regions
  us_east_1_alb_dns_name    = module.compute_us_east_1.alb_dns_name
  us_east_1_alb_zone_id     = module.compute_us_east_1.alb_zone_id
  eu_central_1_alb_dns_name = module.compute_eu_central_1.alb_dns_name
  eu_central_1_alb_zone_id  = module.compute_eu_central_1.alb_zone_id
  
  tags = var.common_tags
}

#==============================================================================
# CloudFront Distribution
#==============================================================================

module "cloudfront" {
  source = "./modules/cloudfront"
  
  # Uses default provider (us-east-1) for global CloudFront
  
  environment = var.environment
  domain_name = var.domain_name
  
  # Primary and secondary origins
  primary_origin_domain   = module.compute_us_east_1.alb_dns_name
  secondary_origin_domain = module.compute_eu_central_1.alb_dns_name
  
  # SSL certificate ARN (must be in us-east-1 for CloudFront)
  ssl_certificate_arn = module.dns.certificate_arn
  
  tags = var.common_tags
}

#==============================================================================
# Observability (CloudTrail, CloudWatch)
#==============================================================================

module "observability" {
  source = "./modules/observability"
  
  # Uses default provider (us-east-1) for global CloudTrail
  
  environment = var.environment
  kms_key_id  = module.kms_us_east_1.key_id
  
  # S3 bucket for CloudTrail logs
  cloudtrail_bucket_name = "${local.name_prefix}-cloudtrail-${random_id.suffix.hex}"
  
  tags = var.common_tags
}

#==============================================================================
# Outputs
#==============================================================================

output "vpc_ids" {
  description = "VPC IDs by region"
  value = {
    "us-east-1"    = module.network_us_east_1.vpc_id
    "eu-central-1" = module.network_eu_central_1.vpc_id
  }
}

output "alb_dns_names" {
  description = "ALB DNS names by region"
  value = {
    "us-east-1"    = module.compute_us_east_1.alb_dns_name
    "eu-central-1" = module.compute_eu_central_1.alb_dns_name
  }
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.domain_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.dns.zone_id
}

output "kms_key_ids" {
  description = "KMS key IDs by region"
  value = {
    "us-east-1"    = module.kms_us_east_1.key_id
    "eu-central-1" = module.kms_eu_central_1.key_id
  }
  sensitive = true
}
```

## Key Modules Structure

Due to length constraints, I'll provide the essential module structures. Here's the complete directory structure:

```
├── modules/
│   ├── kms/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── network/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── vpc-peering/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── secrets/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── compute/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── dns/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── cloudfront/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── observability/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── state-bootstrap/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── envs/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── stage/
│   │   └── ...
│   └── prod/
│       └── ...
```

## Sample Network Module (modules/network/main.tf)

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.environment}-vpc-${var.region}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.environment}-igw-${var.region}"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = min(length(var.availability_zones), 3)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.environment}-public-${var.region}-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = min(length(var.availability_zones), 3)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-private-${var.region}-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateways (one per AZ for HA)
resource "aws_eip" "nat" {
  count = min(length(var.availability_zones), 3)
  
  domain = "vpc"
  
  tags = merge(var.tags, {
    Name = "${var.environment}-nat-eip-${var.region}-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = min(length(var.availability_zones), 3)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.environment}-nat-${var.region}-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-public-rt-${var.region}"
  })
}

resource "aws_route_table" "private" {
  count = min(length(var.availability_zones), 3)
  
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-private-rt-${var.region}-${count.index + 1}"
  })
}

# Route Table Associations
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
resource "aws_security_group" "alb" {
  name_prefix = "${var.environment}-alb-${var.region}-"
  vpc_id      = aws_vpc.main.id

  # HTTPS inbound from allowed CIDRs only (CIS compliance)
  ingress {
    description = "HTTPS from allowed CIDRs"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }

  # HTTP inbound from allowed CIDRs only (for redirect to HTTPS)
  ingress {
    description = "HTTP from allowed CIDRs"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-alb-sg-${var.region}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "app" {
  name_prefix = "${var.environment}-app-${var.region}-"
  vpc_id      = aws_vpc.main.id

  # HTTP from ALB only
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # HTTPS from ALB only
  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-app-sg-${var.region}"
  })

  lifecycle {
    create_before_destroy = true
  }
}
```

# Sample Compute Modules with Blue-Green (modules/compute/main.tf)

```hcl
# Data sources
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "app_role" {
  name_prefix = "${var.environment}-app-role-${var.region}-"

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

  tags = var.tags
}

# IAM Policy for accessing Secrets Manager (least privilege)
resource "aws_iam_policy" "app_secrets_policy" {
  name_prefix = "${var.environment}-app-secrets-${var.region}-"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.app_secrets_arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = var.kms_key_id
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${var.region}.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "app_secrets" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.app_secrets_policy.arn
}

resource "aws_iam_instance_profile" "app_profile" {
  name_prefix = "${var.environment}-app-profile-${var.region}-"
  role        = aws_iam_role.app_role.name

  tags = var.tags
}

# Launch Template for Blue deployment
resource "aws_launch_template" "blue" {
  name_prefix   = "${var.environment}-blue-${var.region}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [var.security_group_id]

  iam_instance_profile {
    name = aws_iam_instance_profile.app_profile.name
  }

  # EBS encryption with KMS
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type = "gp3"
      volume_size = 20
      encrypted   = true
      kms_key_id  = var.kms_key_id
    }
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    secrets_arn = var.app_secrets_arn
    region      = var.region
    color       = "blue"
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.tags, {
      Name  = "${var.environment}-blue-instance-${var.region}"
      Color = "blue"
    })
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-blue-lt-${var.region}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Launch Template for Green deployment
resource "aws_launch_template" "green" {
  name_prefix   = "${var.environment}-green-${var.region}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [var.security_group_id]

  iam_instance_profile {
    name = aws_iam_instance_profile.app_profile.name
  }

  # EBS encryption with KMS
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type = "gp3"
      volume_size = 20
      encrypted   = true
      kms_key_id  = var.kms_key_id
    }
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    secrets_arn = var.app_secrets_arn
    region      = var.region
    color       = "green"
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.tags, {
      Name  = "${var.environment}-green-instance-${var.region}"
      Color = "green"
    })
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-green-lt-${var.region}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Groups
resource "aws_autoscaling_group" "blue" {
  name                = "${var.environment}-blue-asg-${var.region}"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.blue.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 6
  desired_capacity = var.active_color == "blue" ? 2 : 0

  launch_template {
    id      = aws_launch_template.blue.id
    version = "$Latest"
  }

  # Rolling update configuration
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup       = 300
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-blue-asg-${var.region}"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "green" {
  name                = "${var.environment}-green-asg-${var.region}"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.green.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 6
  desired_capacity = var.active_color == "green" ? 2 : 0

  launch_template {
    id      = aws_launch_template.green.id
    version = "$Latest"
  }

  # Rolling update configuration
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup       = 300
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-green-asg-${var.region}"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-alb-${var.region}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  # Access logs to S3 (encrypted)
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-alb-${var.region}"
  })
}

# Target Groups for Blue-Green
resource "aws_lb_target_group" "blue" {
  name     = "${var.environment}-blue-tg-${var.region}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(var.tags, {
    Name  = "${var.environment}-blue-tg-${var.region}"
    Color = "blue"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws