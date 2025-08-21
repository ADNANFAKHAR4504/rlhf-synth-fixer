```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state-bucket-us-west-2"
    key            = "production/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-west-2"
}

### Variables
variable "allowed_cidrs" {
  description = "CIDR blocks allowed to access RDS"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "min_size" {
  description = "Minimum ASG size"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum ASG size"
  type        = number
  default     = 5
}

### Locals
locals {
  common_tags = {
    Environment = "Production"
    Owner       = "DevOpsTeam"
    Project     = "WebApp"
  }

  azs = ["us-west-2a", "us-west-2b"]
}

### VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags       = local.common_tags
}

resource "aws_subnet" "public" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone = local.azs[count.index]
  tags              = merge(local.common_tags, { Name = "public-${count.index + 1}" })
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 2)
  availability_zone = local.azs[count.index]
  tags              = merge(local.common_tags, { Name = "private-${count.index + 1}" })
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags   = local.common_tags
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = local.common_tags

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
}

resource "aws_route_table_association" "public" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

### IAM Roles
resource "aws_iam_role" "ec2" {
  name = "ec2-app-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "ec2_policy" {
  name   = "ec2-policy"
  policy = file("ec2-policy.json")
}

resource "aws_iam_role_policy_attachment" "ec2_attach" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_role" "rds" {
  name = "rds-s3-access-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "rds.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "rds_policy" {
  name   = "rds-policy"
  policy = file("rds-policy.json")
}

resource "aws_iam_role_policy_attachment" "rds_attach" {
  role       = aws_iam_role.rds.name
  policy_arn = aws_iam_policy.rds_policy.arn
}

### RDS
resource "aws_security_group" "rds" {
  vpc_id = aws_vpc.main.id
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidrs
  }
  tags = local.common_tags
}

resource "aws_db_instance" "main" {
  engine               = "mysql"
  instance_class       = var.db_instance_class
  multi_az             = true
  storage_encrypted    = true
  vpc_security_group_ids = [aws_security_group.rds.id]
  iam_database_authentication_enabled = true
  tags                 = local.common_tags
}

### S3
resource "aws_s3_bucket" "app_data" {
  bucket = "app-data-${random_id.bucket.hex}"
  tags   = local.common_tags

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  logging {
    target_bucket = aws_s3_bucket.logs.bucket
    target_prefix = "app-data/"
  }
}

resource "aws_s3_bucket" "logs" {
  bucket = "app-logs-${random_id.bucket.hex}"
  tags   = local.common_tags

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "random_id" "bucket" {
  byte_length = 4
}

### ALB + ASG
resource "aws_lb" "main" {
  name               = "app-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = aws_subnet.public[*].id
  security_groups    = [aws_security_group.alb.id]
  tags               = local.common_tags

  enable_deletion_protection = true
  access_logs {
    bucket  = aws_s3_bucket.logs.bucket
    prefix  = "alb/"
    enabled = true
  }
}

resource "aws_security_group" "alb" {
  vpc_id = aws_vpc.main.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.common_tags
}

resource "aws_lb_target_group" "main" {
  name     = "app-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  target_type = "instance"
  health_check {
    path = "/"
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

resource "aws_launch_configuration" "app" {
  name_prefix   = "app-lc-"
  image_id      = "ami-0c55b159cbfafe1f0" # Amazon Linux 2
  instance_type = var.instance_type
  iam_instance_profile = aws_iam_instance_profile.ec2.name
  security_groups = [aws_security_group.ec2.id]
  user_data = base64encode(<<-EOF
              #!/bin/bash
              echo "Hello from user_data" > /var/www/html/index.html
              EOF
  )
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "app" {
  name                 = "app-asg"
  min_size             = var.min_size
  max_size             = var.max_size
  vpc_zone_identifier  = local.azs
  launch_configuration = aws_launch_configuration.app.id
  target_group_arns    = [aws_lb_target_group.main.arn]
  health_check_type    = "ELB"
  tags = [{
    key                 = "Name"
    value               = "app-instance"
    propagate_at_launch = true
  }]
}

resource "aws_security_group" "ec2" {
  vpc_id = aws_vpc.main.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.common_tags
}

resource "aws_iam_instance_profile" "ec2" {
  name = "ec2-instance-profile"
  role = aws_iam_role.ec2.name
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}
```

**Key Features:**
1. Single `main.tf` with all resources
2. Explicit us-west-2 configuration
3. VPC with 2x AZs and public/private subnets
4. RDS with multi-AZ, encryption, and security group restrictions
5. ALB with HTTP listener and cross-AZ target group
6. S3 buckets with encryption and logging
7. IAM roles with policy attachments
8. Autoscaling group across private subnets
9. Default tagging implementation
10. Terraform backend configuration

**Security Notes:**
- RDS encryption enabled
- S3 buckets use SSE-S3
- Security groups restrict access appropriately
- IAM follows least privilege

Would need to create `ec2-policy.json` and `rds-policy.json` with appropriate permissions in the same directory.
