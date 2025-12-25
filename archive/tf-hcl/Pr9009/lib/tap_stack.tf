########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "bucket_region" {
  description = "Region for the S3 bucket"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (staging/production)"
  type        = string
  default     = "staging"
}

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "devs3-bucket"
}

variable "bucket_tags" {
  description = "Tags to apply to the S3 bucket"
  type        = map(string)
  default = {
    Project     = "ExampleProject"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

variable "localstack_mode" {
  description = "Enable LocalStack compatibility mode - disables unsupported services like ELBv2, RDS, ASG"
  type        = bool
  default     = false
}

locals {
  common_tags = {
    Environment = var.environment
    Project     = "TapStack"
    Owner       = "terraform"
  }
  primary_region     = var.aws_region
  secondary_region   = var.bucket_region
  environment_suffix = var.environment != "staging" ? "-${var.environment}" : ""
}

########################
# KMS Keys
########################
resource "aws_kms_key" "main" {
  description             = "KMS key for TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}"
  deletion_window_in_days = 7
  tags                    = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/tapstack${local.environment_suffix}-${var.environment}-${local.primary_region}"
  target_key_id = aws_kms_key.main.key_id
}

########################
# VPC and Networking
########################
data "aws_vpc" "primary" {
  default = true
}

data "aws_vpc" "secondary" {
  provider = aws.secondary
  default  = true
}

data "aws_subnets" "primary" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.primary.id]
  }
}

data "aws_subnets" "secondary" {
  provider = aws.secondary
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.secondary.id]
  }
}

# VPC Peering
resource "aws_vpc_peering_connection" "main" {
  vpc_id      = data.aws_vpc.primary.id
  peer_vpc_id = data.aws_vpc.secondary.id
  peer_region = local.secondary_region
  auto_accept = false
  tags = merge(local.common_tags, {
    Name = "TapStack${local.environment_suffix}-${var.environment}-peering"
  })
}

resource "aws_vpc_peering_connection_accepter" "main" {
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.main.id
  auto_accept               = true
  tags = merge(local.common_tags, {
    Name = "TapStack${local.environment_suffix}-${var.environment}-peering-accepter"
  })
}

########################
# Security Groups
########################
resource "aws_security_group" "alb" {
  name_prefix = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}-alb-"
  vpc_id      = data.aws_vpc.primary.id
  tags        = local.common_tags

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
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }
}

resource "aws_security_group" "alb_secondary" {
  provider    = aws.secondary
  name_prefix = "TapStack${local.environment_suffix}-${var.environment}-${local.secondary_region}-alb-"
  vpc_id      = data.aws_vpc.secondary.id
  tags        = local.common_tags

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
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }
}

resource "aws_security_group" "app" {
  name_prefix = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}-app-"
  vpc_id      = data.aws_vpc.primary.id
  tags        = local.common_tags

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app_secondary" {
  provider    = aws.secondary
  name_prefix = "TapStack${local.environment_suffix}-${var.environment}-${local.secondary_region}-app-"
  vpc_id      = data.aws_vpc.secondary.id
  tags        = local.common_tags

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_secondary.id]
  }

  egress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

########################
# S3 Bucket for Logging
########################
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "logs" {
  bucket = "tapstack${local.environment_suffix}-${var.environment}-${local.primary_region}-logs-${random_id.bucket_suffix.hex}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

########################
# IAM Roles
########################
resource "aws_iam_role" "ec2_role" {
  name = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}-ec2-role"
  tags = local.common_tags

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
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_s3_bucket.logs.arn}/*",
          "arn:aws:logs:*:*:*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

########################
# Launch Templates
########################
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_launch_template" "app" {
  name_prefix   = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.environment == "production" ? "t3.medium" : "t3.micro"

  vpc_security_group_ids = [aws_security_group.app.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>TapStack${local.environment_suffix} ${var.environment} - ${local.primary_region}</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}"
    })
  }
}

resource "aws_launch_template" "app_secondary" {
  provider      = aws.secondary
  name_prefix   = "TapStack${local.environment_suffix}-${var.environment}-${local.secondary_region}-"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.environment == "production" ? "t3.medium" : "t3.micro"

  vpc_security_group_ids = [aws_security_group.app_secondary.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>TapStack${local.environment_suffix} ${var.environment} - ${local.secondary_region}</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "TapStack${local.environment_suffix}-${var.environment}-${local.secondary_region}"
    })
  }
}

########################
# Application Load Balancers (disabled in LocalStack mode)
########################
resource "aws_lb" "main" {
  count              = var.localstack_mode ? 0 : 1
  name               = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.primary.ids

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = local.common_tags
}

resource "aws_lb" "secondary" {
  count              = var.localstack_mode ? 0 : 1
  provider           = aws.secondary
  name               = "TapStack${local.environment_suffix}-${var.environment}-${local.secondary_region}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_secondary.id]
  subnets            = data.aws_subnets.secondary.ids

  enable_deletion_protection = false

  tags = local.common_tags
}

resource "aws_lb_target_group" "main" {
  count    = var.localstack_mode ? 0 : 1
  name     = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.primary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = local.common_tags
}

resource "aws_lb_target_group" "secondary" {
  count    = var.localstack_mode ? 0 : 1
  provider = aws.secondary
  name     = "TapStack${local.environment_suffix}-${var.environment}-${local.secondary_region}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.secondary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "main" {
  count             = var.localstack_mode ? 0 : 1
  load_balancer_arn = aws_lb.main[0].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main[0].arn
  }
}

resource "aws_lb_listener" "secondary" {
  count             = var.localstack_mode ? 0 : 1
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary[0].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary[0].arn
  }
}

########################
# Auto Scaling Groups (disabled in LocalStack mode)
########################
resource "aws_autoscaling_group" "main" {
  count               = var.localstack_mode ? 0 : 1
  name                = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}"
  vpc_zone_identifier = data.aws_subnets.primary.ids
  target_group_arns   = [aws_lb_target_group.main[0].arn]
  health_check_type   = "ELB"

  min_size         = 1
  max_size         = var.environment == "production" ? 6 : 3
  desired_capacity = var.environment == "production" ? 2 : 1

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

resource "aws_autoscaling_group" "secondary" {
  count               = var.localstack_mode ? 0 : 1
  provider            = aws.secondary
  name                = "TapStack${local.environment_suffix}-${var.environment}-${local.secondary_region}"
  vpc_zone_identifier = data.aws_subnets.secondary.ids
  target_group_arns   = [aws_lb_target_group.secondary[0].arn]
  health_check_type   = "ELB"

  min_size         = 1
  max_size         = var.environment == "production" ? 6 : 3
  desired_capacity = var.environment == "production" ? 2 : 1

  launch_template {
    id      = aws_launch_template.app_secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "TapStack${local.environment_suffix}-${var.environment}-${local.secondary_region}"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

########################
# RDS Database (disabled in LocalStack mode)
########################
resource "random_password" "db_password" {
  count   = var.localstack_mode ? 0 : 1
  length  = 16
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  count                   = var.localstack_mode ? 0 : 1
  name                    = "tapstack${local.environment_suffix}-${var.environment}-${local.primary_region}-db-password"
  description             = "Database password for TapStack"
  recovery_window_in_days = 7
  tags                    = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  count         = var.localstack_mode ? 0 : 1
  secret_id     = aws_secretsmanager_secret.db_password[0].id
  secret_string = random_password.db_password[0].result
}

resource "aws_db_subnet_group" "main" {
  count      = var.localstack_mode ? 0 : 1
  name       = "tapstack${local.environment_suffix}-${var.environment}-${local.primary_region}"
  subnet_ids = data.aws_subnets.primary.ids
  tags       = local.common_tags
}

resource "aws_security_group" "rds" {
  count       = var.localstack_mode ? 0 : 1
  name_prefix = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}-rds-"
  vpc_id      = data.aws_vpc.primary.id
  tags        = local.common_tags

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  count          = var.localstack_mode ? 0 : 1
  identifier     = "tapstack${local.environment_suffix}-${var.environment}-${local.primary_region}"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.environment == "production" ? "db.t3.small" : "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = "tapstack"
  username = "admin"
  password = random_password.db_password[0].result

  vpc_security_group_ids = [aws_security_group.rds[0].id]
  db_subnet_group_name   = aws_db_subnet_group.main[0].name

  multi_az                = var.environment == "production"
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = local.common_tags
}

# Cross-region RDS replica disabled for LocalStack compatibility
# LocalStack Community edition has limited support for cross-region RDS replication
# which causes timeouts (19+ minutes). Keeping primary RDS only for LocalStack testing.
# Uncomment for AWS deployment:
# resource "aws_db_instance" "replica" {
#   provider           = aws.secondary
#   identifier         = "tapstack${local.environment_suffix}-${var.environment}-${local.secondary_region}-replica"
#   replicate_source_db = aws_db_instance.main.identifier
#
#   instance_class = var.environment == "production" ? "db.t3.small" : "db.t3.micro"
#
#   storage_encrypted = true
#   skip_final_snapshot = true
#   deletion_protection = false
#
#   tags = local.common_tags
# }

########################
# DynamoDB Tables
########################
resource "aws_dynamodb_table" "main" {
  name         = "TapStack${local.environment_suffix}-${var.environment}-${local.primary_region}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "secondary" {
  provider     = aws.secondary
  name         = "TapStack${local.environment_suffix}-${var.environment}-${local.secondary_region}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}

########################
# S3 Bucket Policy for ALB Logs
########################
data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/alb-logs/*"
      }
    ]
  })
}

########################
# Outputs
########################
output "vpc_id" {
  description = "VPC ID of the primary region"
  value       = data.aws_vpc.primary.id
}

output "primary_alb_dns" {
  description = "DNS name of the primary ALB"
  value       = try(aws_lb.main[0].dns_name, "")
}

output "secondary_alb_dns" {
  description = "DNS name of the secondary ALB"
  value       = try(aws_lb.secondary[0].dns_name, "")
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = try(aws_db_instance.main[0].endpoint, "")
  sensitive   = true
}

output "rds_replica_endpoint" {
  description = "RDS replica endpoint"
  value       = ""
  sensitive   = true
}

output "dynamodb_table_primary" {
  description = "Primary DynamoDB table name"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_table_secondary" {
  description = "Secondary DynamoDB table name"
  value       = aws_dynamodb_table.secondary.name
}

output "s3_logs_bucket" {
  description = "S3 logs bucket name"
  value       = aws_s3_bucket.logs.bucket
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.key_id
}
