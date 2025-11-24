# Terraform Infrastructure Code

## Root Level Files

### terraform.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "payment-processing"
      ManagedBy   = "Terraform"
    }
  }
}
```

### main.tf

```hcl
module "payment_app" {
  source = "./modules/payment-app"

  environment             = var.environment
  pr_number               = var.pr_number != "" ? var.pr_number : var.environment
  aws_region              = var.aws_region
  vpc_cidr                = var.vpc_cidr
  db_instance_class       = var.db_instance_class
  ec2_instance_type       = var.ec2_instance_type
  backup_retention_period = var.backup_retention_period
  rds_cpu_threshold       = var.rds_cpu_threshold
  instance_count          = var.instance_count
  db_username             = var.db_username
  db_password             = var.db_password
  ssh_key_name            = var.ssh_key_name
  ami_id                  = var.ami_id
  certificate_arn         = var.certificate_arn
  alb_internal            = var.alb_internal
}
```

### variables.tf

```hcl
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "pr_number" {
  description = "PR number for resource naming"
  type        = string
  default     = "1234"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ca-central-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold for CloudWatch alarm"
  type        = number
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 2
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "ssh_key_name" {
  description = "Name of the SSH key pair for EC2 instances"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}

variable "certificate_arn" {
  description = "Optional ACM certificate ARN to use for HTTPS listener in the module. If empty, no HTTPS listener will be created."
  type        = string
  default     = ""
}

variable "alb_internal" {
  description = "If true, create the ALB as internal. Useful when the target VPC has no Internet Gateway."
  type        = bool
  default     = false
}
```

### outputs.tf

```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.payment_app.alb_dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.payment_app.alb_arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.payment_app.rds_endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.payment_app.rds_port
}

output "ec2_security_group_id" {
  description = "Security group ID for EC2 instances"
  value       = module.payment_app.ec2_security_group_id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS instance"
  value       = module.payment_app.rds_security_group_id
}

output "alb_security_group_id" {
  description = "Security group ID for ALB"
  value       = module.payment_app.alb_security_group_id
}

output "ec2_instance_ids" {
  description = "List of EC2 instance IDs"
  value       = module.payment_app.ec2_instance_ids
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.payment_app.target_group_arn
}

output "cloudwatch_alarm_arns" {
  description = "ARNs of CloudWatch alarms"
  value       = module.payment_app.cloudwatch_alarm_arns
}

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = module.payment_app.db_credentials_secret_arn
}

output "webacl_arn" {
  description = "ARN of the WAF WebACL"
  value       = module.payment_app.webacl_arn
}
```

## Module Files (modules/payment-app)

### main.tf

```hcl
# Main configuration file for the payment-app module

locals {
  # Point directly to the resources we created in networking.tf
  vpc_id             = aws_vpc.main.id
  public_subnet_ids  = aws_subnet.public[*].id
  private_subnet_ids = aws_subnet.private[*].id

  common_tags = {
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}
```

### variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "pr_number" {
  description = "PR number for resource naming"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "vpc_id" {
  description = "Optional existing VPC ID to use. If provided, the module will use this VPC instead of looking up by CIDR. Useful when the VPC was created/destroyed outside this module or to avoid accidental data-source mismatches."
  type        = string
  default     = ""
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "backup_retention_period" {
  description = "RDS backup retention period"
  type        = number
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold"
  type        = number
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password (leave empty to auto-generate a secure random password)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "ssh_key_name" {
  description = "SSH key name"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "Optional ACM Certificate ARN to use for HTTPS listener. If empty, HTTPS listener will not be created by this module."
  type        = string
  default     = ""
}

variable "alb_internal" {
  description = "If true, create the ALB as internal. Set to true when VPC has no Internet Gateway or you want internal-only ALB."
  type        = bool
  default     = false
}
```

### outputs.tf

```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "db_credentials_secret_name" {
  description = "Name of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_password.name
}

output "ec2_security_group_id" {
  description = "Security group ID for EC2 instances"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS instance"
  value       = aws_security_group.rds.id
}

output "alb_security_group_id" {
  description = "Security group ID for ALB"
  value       = aws_security_group.alb.id
}

output "ec2_instance_ids" {
  description = "List of EC2 instance IDs"
  value       = aws_instance.app[*].id
}

output "ec2_private_ips" {
  description = "Private IP addresses of EC2 instances"
  value       = aws_instance.app[*].private_ip
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "cloudwatch_alarm_arns" {
  description = "ARNs of CloudWatch alarms"
  value = {
    rds_cpu     = aws_cloudwatch_metric_alarm.rds_cpu.arn
    rds_storage = aws_cloudwatch_metric_alarm.rds_storage.arn
    alb_health  = aws_cloudwatch_metric_alarm.alb_healthy_hosts.arn
    ec2_cpu     = aws_cloudwatch_metric_alarm.ec2_cpu[*].arn
  }
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "dashboard_url" {
  description = "URL to CloudWatch Dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "webacl_arn" {
  description = "ARN of the WAF WebACL"
  value       = aws_wafv2_web_acl.main.arn
}
```

### networking.tf

```hcl
# 1. Create the VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "vpc-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# 2. Get Availability Zones
data "aws_availability_zones" "available" {
  state = "available"
}

# 3. Create Public Subnets
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "subnet-public-${var.pr_number}-${count.index + 1}"
    Type        = "public"
    Environment = var.environment
    Project     = "payment-processing"
  }
}

# 4. Create Private Subnets
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "subnet-private-${var.pr_number}-${count.index + 1}"
    Type        = "private"
    Environment = var.environment
    Project     = "payment-processing"
  }
}

# 5. Internet Gateway (for Public Subnets)
resource "aws_internet_gateway" "main" {
  vpc_id = local.vpc_id

  tags = {
    Name        = "igw-${var.pr_number}"
    Environment = var.environment
  }
}

# 6. NAT Gateway (Allows Private EC2s to download updates/packages)
resource "aws_eip" "nat" {
  domain = "vpc"
  tags = {
    Name = "eip-nat-${var.pr_number}"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = local.public_subnet_ids[0]

  tags = {
    Name        = "nat-gw-${var.pr_number}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# 7. Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "rt-public-${var.pr_number}"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "rt-private-${var.pr_number}"
  }
}

# 8. Route Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
```

### security_groups.tf

```hcl
# Security group for ALB
resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.pr_number}"
  description = "Security group for Application Load Balancer"
  vpc_id      = local.vpc_id

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from Internet (redirect to HTTPS)"
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

  tags = {
    Name        = "alb-sg-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Security group for EC2 instances
resource "aws_security_group" "ec2" {
  name        = "ec2-sg-${var.pr_number}"
  description = "Security group for EC2 instances"
  vpc_id      = local.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ec2-sg-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "rds-sg-${var.pr_number}"
  description = "Security group for RDS instance"
  vpc_id      = local.vpc_id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "rds-sg-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}
```

### alb.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.pr_number}"
  internal           = var.alb_internal
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = local.public_subnet_ids

  enable_deletion_protection       = var.environment == "prod" ? true : false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = {
    Name        = "alb-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }

  depends_on = [aws_s3_bucket_policy.alb_logs]
}

# S3 bucket for ALB logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "alb-logs-${var.pr_number}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "alb-logs-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Enable versioning for the S3 bucket
resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption for the S3 bucket
# FIX: Switched to AES256 (SSE-S3) to allow ALB Logging service to write without KMS permission errors
resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle policy to manage log retention and cost
resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    filter {
      prefix = "alb/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = var.environment == "prod" ? 365 : 180
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.alb_logs.arn
      },
      {
        Sid    = "ELBAccessLogsWrite"
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      },
      {
        Sid    = "ELBServiceWrite"
        Effect = "Allow"
        Principal = {
          Service = "elasticloadbalancing.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.alb_logs]
}

# Target group
resource "aws_lb_target_group" "main" {
  name     = "tg-${var.pr_number}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = local.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = var.environment == "prod" ? 300 : 30

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }

  tags = {
    Name        = "tg-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Target Group Attachment
resource "aws_lb_target_group_attachment" "main" {
  count = var.instance_count

  target_group_arn = aws_lb_target_group.main.arn
  target_id        = aws_instance.app[count.index].id
  port             = 80
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    # If certificate exists, redirect to HTTPS. Otherwise, forward to instances.
    type             = var.certificate_arn != "" ? "redirect" : "forward"
    target_group_arn = var.certificate_arn != "" ? null : aws_lb_target_group.main.arn

    dynamic "redirect" {
      for_each = var.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }
}

/*
  HTTPS listener is optional and depends on supplying an existing ACM
  certificate ARN. Creating ACM certificates and validating them via DNS
  requires Route53 or external manual steps which block automated apply in many
  development setups. To keep the module usable without external DNS, the HTTPS
  listener is created only when `certificate_arn` is provided.
*/

resource "aws_lb_listener" "https" {
  count             = var.certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}
```

### ec2.tf

```hcl
# IAM role for EC2 instances
resource "aws_iam_role" "ec2" {
  name = "ec2-role-${var.pr_number}"

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
    Name        = "ec2-role-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Attach CloudWatch agent policy
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Attach SSM policy for Session Manager
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM policy for KMS operations
resource "aws_iam_role_policy" "ec2_kms" {
  name = "ec2-kms-policy-${var.pr_number}"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# IAM policy for Secrets Manager access
resource "aws_iam_role_policy" "ec2_secrets" {
  name = "ec2-secrets-policy-${var.pr_number}"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.db_password.arn
      }
    ]
  })
}

# Instance profile
resource "aws_iam_instance_profile" "ec2" {
  name = "ec2-profile-${var.pr_number}"
  role = aws_iam_role.ec2.name

  tags = {
    Name        = "ec2-profile-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# EC2 instances
resource "aws_instance" "app" {
  count = var.instance_count

  ami           = var.ami_id != "" ? var.ami_id : data.aws_ami.default.id
  instance_type = var.ec2_instance_type

  subnet_id              = local.private_subnet_ids[count.index % length(local.private_subnet_ids)]
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name
  key_name               = var.ssh_key_name != "" ? var.ssh_key_name : aws_key_pair.generated[0].key_name

  monitoring = var.environment == "prod" ? true : false

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.environment == "prod" ? 50 : 20
    encrypted             = true
    kms_key_id            = aws_kms_key.main.arn
    delete_on_termination = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    db_endpoint = aws_db_instance.main.endpoint
    db_name     = aws_db_instance.main.db_name
    environment = var.environment
    secret_name = aws_secretsmanager_secret.db_password.name
    aws_region  = var.aws_region
  }))

  tags = {
    Name        = "ec2-${var.pr_number}-${count.index + 1}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

data "aws_ami" "default" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
```

### rds.tf

```hcl
# Generate a random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
  # Avoid characters that might cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store the password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "payment-app/${var.environment}/db-pass-${var.pr_number}"
  description             = "Auto-generated RDS password for payment-app-${var.pr_number}"
  recovery_window_in_days = var.environment == "prod" ? 30 : 7

  tags = {
    Name        = "payment-app-${var.pr_number}-db-pass"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password != "" ? var.db_password : random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })

  depends_on = [aws_db_instance.main]
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name = "db-subnet-group-${var.pr_number}"
  # Use local fallback list so module still plans if private tag filtering
  # returns empty (falls back to public subnets as a last resort)
  subnet_ids = local.private_subnet_ids

  tags = {
    Name        = "db-subnet-group-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier = "rds-${var.pr_number}"

  engine         = "postgres"
  engine_version = "15.14"
  instance_class = var.db_instance_class

  allocated_storage = var.environment == "prod" ? 100 : 20
  storage_type      = var.environment == "prod" ? "gp3" : "gp2"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  db_name  = "paymentdb"
  username = var.db_username
  password = var.db_password != "" ? var.db_password : random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment != "dev" ? "rds-${var.pr_number}-final" : null

  deletion_protection = var.environment == "prod" ? true : false

  multi_az                   = var.environment == "prod" ? true : false
  auto_minor_version_upgrade = var.environment != "prod"

  performance_insights_enabled          = var.environment == "prod" ? true : false
  performance_insights_kms_key_id       = var.environment == "prod" ? aws_kms_key.main.arn : null
  performance_insights_retention_period = var.environment == "prod" ? 7 : null
  monitoring_interval                   = var.environment == "prod" ? 60 : 0
  monitoring_role_arn                   = var.environment == "prod" ? aws_iam_role.rds_monitoring[0].arn : null

  enabled_cloudwatch_logs_exports = var.environment != "dev" ? ["postgresql"] : []

  tags = {
    Name        = "rds-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }

  lifecycle {
    ignore_changes = [
      db_subnet_group_name,
      final_snapshot_identifier
    ]
  }
}

# IAM role for RDS monitoring (only in prod)
resource "aws_iam_role" "rds_monitoring" {
  count = var.environment == "prod" ? 1 : 0

  name = "rds-monitoring-role-${var.pr_number}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "rds-monitoring-role-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.environment == "prod" ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```

### cloudwatch.tf

```hcl
# SNS Topic for alarms
resource "aws_sns_topic" "alarms" {
  name = "sns-alarms-${var.pr_number}"

  tags = {
    Name        = "sns-alarms-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# SNS Topic Subscription (email)
resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = "ops-${var.environment}@example.com"
}

# CloudWatch Alarm for RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "alarm-rds-cpu-${var.pr_number}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.rds_cpu_threshold
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "alarm-rds-cpu-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarm for RDS Storage Space
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "alarm-rds-storage-${var.pr_number}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2000000000 # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "alarm-rds-storage-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarm for ALB Target Health
resource "aws_cloudwatch_metric_alarm" "alb_healthy_hosts" {
  alarm_name          = "alarm-alb-health-${var.pr_number}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = var.instance_count * 0.5
  alarm_description   = "Alert when we have less than 50% healthy hosts"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.main.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name        = "alarm-alb-health-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarm for EC2 CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  count = var.instance_count

  alarm_name          = "alarm-ec2-cpu-${var.pr_number}-${count.index + 1}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = var.environment == "prod" ? 70 : 80
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    InstanceId = aws_instance.app[count.index].id
  }

  tags = {
    Name        = "alarm-ec2-cpu-${var.pr_number}-${count.index + 1}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "dashboard-${var.pr_number}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "RDS CPU" }],
            ["AWS/EC2", "CPUUtilization", { stat = "Average", label = "EC2 CPU" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "CPU Utilization"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
            [".", "RequestCount", { stat = "Sum" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Metrics"
        }
      }
    ]
  })
}
```

### waf.tf

```hcl
# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "waf-${var.pr_number}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Common Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Known Bad Inputs Rule Set
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "WebACL-${var.pr_number}"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "waf-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}


```

### kms.tf

```hcl
# KMS key for EBS and RDS encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for payment-app-${var.pr_number} EBS, RDS, and S3 encryption"
  deletion_window_in_days = var.environment == "prod" ? 30 : 7
  enable_key_rotation     = true

  tags = {
    Name        = "payment-app-${var.pr_number}-key"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# KMS key alias
resource "aws_kms_alias" "main" {
  name          = "alias/payment-app-${var.pr_number}"
  target_key_id = aws_kms_key.main.key_id
}

# KMS key policy
resource "aws_kms_key_policy" "main" {
  key_id = aws_kms_key.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow EC2 to use the key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "ec2.${var.aws_region}.amazonaws.com"
            ]
          }
        }
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow EC2 service to create grants"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      },
      {
        Sid    = "Allow S3 to use the key for encryption"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "s3.${var.aws_region}.amazonaws.com"
            ]
          }
        }
      }
      ,
      {
        Sid    = "Allow ELB to use the key for S3 access-logs"
        Effect = "Allow"
        Principal = {
          Service = "elasticloadbalancing.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "s3.${var.aws_region}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

```

### keys.tf

```hcl
# lib/modules/payment-app/keys.tf

# 1. Generate a secure private key
resource "tls_private_key" "generated" {
  count     = var.ssh_key_name == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

# 2. Upload the public key to AWS
resource "aws_key_pair" "generated" {
  count = var.ssh_key_name == "" ? 1 : 0

  key_name   = "payment-app-${var.pr_number}-key"
  public_key = tls_private_key.generated[0].public_key_openssh

  tags = {
    Name        = "payment-app-${var.pr_number}-key"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# 3. Store the private key securely in AWS Systems Manager Parameter Store
resource "aws_ssm_parameter" "private_key" {
  count = var.ssh_key_name == "" ? 1 : 0

  name        = "/payment-app/${var.environment}/ssh-keys/payment-app-${var.pr_number}-key"
  description = "Private SSH key for payment-app-${var.pr_number}-key"
  type        = "SecureString"
  value       = tls_private_key.generated[0].private_key_pem

  tags = {
    Name        = "payment-app-${var.pr_number}-key-private"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
```

### user_data.sh

```bash
#!/bin/bash
# User data script for EC2 instances
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting User Data Script..."

# 2. Update system
yum update -y

# 3. Install packages 
amazon-linux-extras enable postgresql14
amazon-linux-extras enable nginx1
yum clean metadata
yum install -y postgresql nginx amazon-cloudwatch-agent python3 python3-pip

# 4. Configure CloudWatch agent (Your config)
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "metrics": {
    "namespace": "${environment}-payment-app",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          "cpu_usage_iowait"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# 5. Install Python PostgreSQL adapter
pip3 install psycopg2-binary boto3 --quiet

# 6. Create Python HTTP server for E2E testing
mkdir -p /opt/payment-app
cat > /opt/payment-app/app.py << 'PYTHON_EOF'
#!/usr/bin/env python3
"""
Simple HTTP server for E2E testing
Handles health checks and database connectivity tests
"""
import json
import os
import sys
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Load configuration
DB_ENDPOINT = os.environ.get('DB_ENDPOINT', '')
DB_NAME = os.environ.get('DB_NAME', 'paymentdb')
DB_SECRET_NAME = os.environ.get('DB_SECRET_NAME', '')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

class PaymentAppHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/health':
            self.send_health_response()
        elif path == '/db-test':
            self.send_db_test_response()
        elif path == '/':
            self.send_root_response()
        else:
            self.send_error(404, "Not Found")
    
    def send_health_response(self):
        """Health check endpoint"""
        response = {
            "status": "healthy",
            "service": "payment-app"
        }
        self.send_json_response(200, response)
    
    def send_db_test_response(self):
        """Test database connectivity"""
        try:
            # Get DB credentials from Secrets Manager
            import boto3
            secrets_client = boto3.client('secretsmanager', region_name=AWS_REGION)
            
            secret_response = secrets_client.get_secret_value(SecretId=DB_SECRET_NAME)
            db_creds = json.loads(secret_response['SecretString'])
            
            db_host = DB_ENDPOINT.split(':')[0] if ':' in DB_ENDPOINT else DB_ENDPOINT
            db_port = DB_ENDPOINT.split(':')[1] if ':' in DB_ENDPOINT else '5432'
            db_user = db_creds.get('username') or db_creds.get('user') or 'dbadmin'
            db_password = db_creds.get('password')
            db_name = db_creds.get('dbname') or db_creds.get('database') or DB_NAME
            
            # Test connection using psql
            import psycopg2
            conn = psycopg2.connect(
                host=db_host,
                port=db_port,
                user=db_user,
                password=db_password,
                database=db_name,
                connect_timeout=5
            )
            
            cursor = conn.cursor()
            cursor.execute("SELECT 1 as test_result, current_timestamp as query_time;")
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            response = {
                "status": "success",
                "message": "Database connection successful",
                "test_result": result[0],
                "query_time": str(result[1]),
                "endpoint": DB_ENDPOINT
            }
            self.send_json_response(200, response)
            
        except Exception as e:
            response = {
                "status": "error",
                "message": f"Database connection failed: {str(e)}",
                "endpoint": DB_ENDPOINT
            }
            self.send_json_response(500, response)
    
    def send_root_response(self):
        """Root endpoint"""
        html = f"""<html>
<head><title>Payment App</title></head>
<body>
    <h1>Welcome to Payment App ({os.environ.get('ENVIRONMENT', 'dev')})</h1>
    <p>DB Endpoint: {DB_ENDPOINT}</p>
    <ul>
        <li><a href="/health">Health Check</a></li>
        <li><a href="/db-test">Database Test</a></li>
    </ul>
</body>
</html>"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_header('Content-Length', str(len(html)))
        self.end_headers()
        self.wfile.write(html.encode())
    
    def send_json_response(self, status_code, data):
        """Send JSON response"""
        json_data = json.dumps(data, indent=2)
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(json_data)))
        self.end_headers()
        self.wfile.write(json_data.encode())
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    server = HTTPServer(('0.0.0.0', port), PaymentAppHandler)
    print(f'Starting Payment App server on port {port}...')
    server.serve_forever()
PYTHON_EOF

chmod +x /opt/payment-app/app.py

# 7. Create systemd service for Python app
cat > /etc/systemd/system/payment-app.service << EOF
[Unit]
Description=Payment App Python Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/payment-app
Environment="DB_ENDPOINT=${db_endpoint}"
Environment="DB_NAME=${db_name}"
Environment="DB_SECRET_NAME=${secret_name}"
Environment="AWS_REGION=${aws_region}"
Environment="ENVIRONMENT=${environment}"
Environment="PORT=8080"
ExecStart=/usr/bin/python3 /opt/payment-app/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 8. Configure Nginx to proxy to Python server
cat > /etc/nginx/conf.d/payment-app.conf << EOF
server {
    listen 80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
EOF

# Remove default config to prevent conflicts
rm -f /etc/nginx/conf.d/default.conf

# 9. Start services
systemctl daemon-reload
systemctl enable payment-app
systemctl start payment-app
systemctl enable nginx
systemctl restart nginx

# 10. Store DB info (for reference)
mkdir -p /etc/payment-app
cat > /etc/payment-app/db.conf << EOF
DB_ENDPOINT=${db_endpoint}
DB_NAME=${db_name}
ENVIRONMENT=${environment}
DB_SECRET_NAME=${secret_name}
AWS_REGION=${aws_region}
EOF

# 11. Create helper script to retrieve DB credentials
cat > /usr/local/bin/get-db-credentials << 'EOF'
#!/bin/bash
# Helper script to retrieve database credentials from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id ${secret_name} \
  --region ${aws_region} \
  --query SecretString \
  --output text
EOF

chmod +x /usr/local/bin/get-db-credentials

# 12. Wait for services to be ready
sleep 5
systemctl status payment-app --no-pager || true
systemctl status nginx --no-pager || true

echo "User Data Script Completed Successfully"
```
