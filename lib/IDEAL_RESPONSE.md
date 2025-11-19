# Terraform Infrastructure Code

## variables.tf

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

## main.tf

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

## outputs.tf

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
```

## terraform.tf

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
    tags = {
      Environment = var.environment
      Project     = "payment-processing"
      ManagedBy   = "Terraform"
    }
  }
}
```

## dev.tfvars

```hcl
environment             = "dev"
pr_number               = "dev"
aws_region              = "ca-central-1"
vpc_cidr                = "10.0.0.0/16"
db_instance_class       = "db.t3.micro"
ec2_instance_type       = "t3.micro"
backup_retention_period = 0
rds_cpu_threshold       = 80
instance_count          = 2
db_username             = "dbadmin"
db_password             = "DevPassword123!" # Change this in production
ssh_key_name            = ""                # leave empty to skip key pair (CI/dev)
ami_id                  = ""                # leave empty to use module's AMI fallback (Amazon Linux 2)
alb_internal            = false
```

## staging.tfvars

```hcl
environment             = "staging"
pr_number               = "staging"
aws_region              = "ca-central-1"
vpc_cidr                = "10.1.0.0/16"
db_instance_class       = "db.t3.small"
ec2_instance_type       = "t3.small"
backup_retention_period = 7
rds_cpu_threshold       = 70
instance_count          = 2
db_username             = "dbadmin"
db_password             = "StagingPassword123!" # Change this in production
ssh_key_name            = ""
ami_id                  = ""
alb_internal            = false
```

## prod.tfvars

```hcl
environment             = "prod"
pr_number               = "prod"
aws_region              = "ca-central-1"
vpc_cidr                = "10.2.0.0/16"
db_instance_class       = "db.t3.medium"
ec2_instance_type       = "t3.small"
backup_retention_period = 30
rds_cpu_threshold       = 60
instance_count          = 3
db_username             = "dbadmin"
db_password             = "ProdPassword123!" # Use AWS Secrets Manager in production
ssh_key_name            = ""
ami_id                  = ""
alb_internal            = false
```

## modules/payment-app/variables.tf

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
  description = "Database password"
  type        = string
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

## modules/payment-app/main.tf

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

## modules/payment-app/networking.tf

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
  count = 2

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

## modules/payment-app/security_groups.tf

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

## modules/payment-app/ec2.tf

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
    delete_on_termination = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    db_endpoint = aws_db_instance.main.endpoint
    db_name     = aws_db_instance.main.db_name
    environment = var.environment
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

## modules/payment-app/rds.tf

```hcl
# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name = "db-subnet-group-${var.pr_number}"
  # Use local fallback list so module still plans if private tag filtering returns empty
  # (falls back to public subnets as a last resort)
  subnet_ids = local.private_subnet_ids

  tags = {
    Name        = "db-subnet-group-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
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

  db_name  = "paymentdb"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment != "dev" ? "rds-${var.pr_number}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  deletion_protection = var.environment == "prod" ? true : false

  multi_az                   = var.environment == "prod" ? true : false
  auto_minor_version_upgrade = var.environment != "prod"

  performance_insights_enabled = var.environment == "prod" ? true : false
  monitoring_interval          = var.environment == "prod" ? 60 : 0
  monitoring_role_arn          = var.environment == "prod" ? aws_iam_role.rds_monitoring[0].arn : null

  enabled_cloudwatch_logs_exports = var.environment != "dev" ? ["postgresql"] : []

  tags = {
    Name        = "rds-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
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

## modules/payment-app/alb.tf

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
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/alb/*"
      }
    ]
  })
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
  HTTPS listener is optional and depends on supplying an existing ACM certificate ARN.
  Creating ACM certificates and validating them via DNS requires Route53 or external manual steps
  which block automated apply in many development setups. To keep the module usable without
  external DNS, the HTTPS listener is created only when `certificate_arn` is provided.
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

## modules/payment-app/cloudwatch.tf

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

## modules/payment-app/keys.tf

```hcl
# lib/modules/payment-app/keys.tf

# 1. Generate a secure private key locally
resource "tls_private_key" "generated" {
  count     = var.ssh_key_name == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

# 2. Upload the public key to AWS
resource "aws_key_pair" "generated" {
  count = var.ssh_key_name == "" ? 1 : 0

  key_name   = "auto-key-${var.pr_number}"
  public_key = tls_private_key.generated[0].public_key_openssh

  tags = {
    Name        = "auto-key-${var.pr_number}"
    Environment = var.environment
  }
}

# 3. Save the private key to your project root folder
resource "local_file" "private_key" {
  count           = var.ssh_key_name == "" ? 1 : 0
  content         = tls_private_key.generated[0].private_key_pem
  filename        = "${path.root}/${var.pr_number}-key.pem"
  file_permission = "0600"
}
```

## modules/payment-app/outputs.tf

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
```
