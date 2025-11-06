# Blue-Green Deployment Architecture - Terraform Implementation

This implementation provides a complete blue-green deployment architecture for containerized web applications using AWS services.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to prevent conflicts"
  type        = string
}

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "ID of the existing VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for EC2 and RDS"
  type        = list(string)
}

variable "db_subnet_ids" {
  description = "List of subnet IDs for RDS Aurora cluster"
  type        = list(string)
}

variable "ami_id" {
  description = "AMI ID for EC2 instances (Amazon Linux 2 with Docker)"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for blue/green environments"
  type        = string
  default     = "t3.medium"
}

variable "min_instances" {
  description = "Minimum number of instances in Auto Scaling Groups"
  type        = number
  default     = 2
}

variable "max_instances" {
  description = "Maximum number of instances in Auto Scaling Groups"
  type        = number
  default     = 6
}

variable "desired_instances" {
  description = "Desired number of instances in Auto Scaling Groups"
  type        = number
  default     = 2
}

variable "db_master_username" {
  description = "Master username for RDS Aurora cluster"
  type        = string
  default     = "admin"
}

variable "db_master_password" {
  description = "Master password for RDS Aurora cluster"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for DNS records"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "blue_traffic_weight" {
  description = "Traffic weight for blue environment (0-100)"
  type        = number
  default     = 100
}

variable "green_traffic_weight" {
  description = "Traffic weight for green environment (0-100)"
  type        = number
  default     = 0
}

variable "app_version_blue" {
  description = "Application version for blue environment"
  type        = string
  default     = "1.0.0"
}

variable "app_version_green" {
  description = "Application version for green environment"
  type        = string
  default     = "1.0.0"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/main.tf

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
  region = var.region

  default_tags {
    tags = merge(
      var.common_tags,
      {
        ManagedBy         = "Terraform"
        EnvironmentSuffix = var.environment_suffix
        Project           = "BlueGreenDeployment"
      }
    )
  }
}
```

## File: lib/data.tf

```hcl
data "aws_vpc" "main" {
  id = var.vpc_id
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [var.vpc_id]
  }

  filter {
    name   = "subnet-id"
    values = var.public_subnet_ids
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [var.vpc_id]
  }

  filter {
    name   = "subnet-id"
    values = var.private_subnet_ids
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_route53_zone" "main" {
  zone_id = var.hosted_zone_id
}
```

## File: lib/iam.tf

```hcl
# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2_instance_role" {
  name = "ec2-instance-role-${var.environment_suffix}"

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
    Name = "ec2-instance-role-${var.environment_suffix}"
  }
}

# IAM Policy for S3 Artifact Access
resource "aws_iam_policy" "s3_artifact_access" {
  name        = "s3-artifact-access-${var.environment_suffix}"
  description = "Allow EC2 instances to access S3 artifacts"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      }
    ]
  })
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_policy" "cloudwatch_logs" {
  name        = "cloudwatch-logs-${var.environment_suffix}"
  description = "Allow EC2 instances to write to CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.region}:*:log-group:/aws/ec2/*"
      }
    ]
  })
}

# Attach Policies to Role
resource "aws_iam_role_policy_attachment" "s3_artifact_access" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = aws_iam_policy.s3_artifact_access.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs.arn
}

# CloudWatch Agent Policy (AWS Managed)
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# SSM Policy for Instance Management (AWS Managed)
resource "aws_iam_role_policy_attachment" "ssm_managed_instance" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-instance-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2_instance_role.name

  tags = {
    Name = "ec2-instance-profile-${var.environment_suffix}"
  }
}
```

## File: lib/security_groups.tf

```hcl
# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
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
    Name = "alb-sg-${var.environment_suffix}"
  }
}

# Security Group for EC2 Instances (Blue/Green)
resource "aws_security_group" "ec2" {
  name        = "ec2-sg-${var.environment_suffix}"
  description = "Security group for EC2 instances in blue/green environments"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Application port from ALB"
    from_port       = 8080
    to_port         = 8080
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
    Name = "ec2-sg-${var.environment_suffix}"
  }
}

# Security Group for RDS Proxy
resource "aws_security_group" "rds_proxy" {
  name        = "rds-proxy-sg-${var.environment_suffix}"
  description = "Security group for RDS Proxy"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MySQL from EC2"
    from_port       = 3306
    to_port         = 3306
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
    Name = "rds-proxy-sg-${var.environment_suffix}"
  }
}

# Security Group for RDS Aurora
resource "aws_security_group" "rds" {
  name        = "rds-sg-${var.environment_suffix}"
  description = "Security group for RDS Aurora cluster"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MySQL from RDS Proxy"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.rds_proxy.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "rds-sg-${var.environment_suffix}"
  }
}
```

## File: lib/s3.tf

```hcl
# S3 Bucket for Application Artifacts
resource "aws_s3_bucket" "artifacts" {
  bucket = "app-artifacts-${var.environment_suffix}"

  tags = {
    Name        = "app-artifacts-${var.environment_suffix}"
    Purpose     = "Application Artifacts and Deployment History"
    Environment = "Shared"
  }
}

# Enable Versioning
resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block Public Access
resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle Policy for Old Versions
resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
```

## File: lib/rds.tf

```hcl
# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "rds-subnet-group-${var.environment_suffix}"
  subnet_ids = var.db_subnet_ids

  tags = {
    Name = "rds-subnet-group-${var.environment_suffix}"
  }
}

# RDS Aurora Cluster Parameter Group
resource "aws_rds_cluster_parameter_group" "main" {
  name        = "aurora-mysql-cluster-pg-${var.environment_suffix}"
  family      = "aurora-mysql8.0"
  description = "Aurora MySQL cluster parameter group"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  tags = {
    Name = "aurora-mysql-cluster-pg-${var.environment_suffix}"
  }
}

# RDS Aurora Instance Parameter Group
resource "aws_db_parameter_group" "main" {
  name        = "aurora-mysql-instance-pg-${var.environment_suffix}"
  family      = "aurora-mysql8.0"
  description = "Aurora MySQL instance parameter group"

  parameter {
    name  = "max_connections"
    value = "1000"
  }

  tags = {
    Name = "aurora-mysql-instance-pg-${var.environment_suffix}"
  }
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier              = "aurora-cluster-${var.environment_suffix}"
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.04.0"
  database_name                   = var.db_name
  master_username                 = var.db_master_username
  master_password                 = var.db_master_password
  db_subnet_group_name            = aws_db_subnet_group.main.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]

  enabled_cloudwatch_logs_exports = ["audit", "error", "slowquery"]
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"

  skip_final_snapshot       = true
  final_snapshot_identifier = "aurora-cluster-${var.environment_suffix}-final"

  storage_encrypted = true

  tags = {
    Name        = "aurora-cluster-${var.environment_suffix}"
    Environment = "Shared"
  }
}

# RDS Aurora Cluster Instances (Writer)
resource "aws_rds_cluster_instance" "writer" {
  identifier              = "aurora-writer-${var.environment_suffix}"
  cluster_identifier      = aws_rds_cluster.main.id
  instance_class          = "db.r6g.large"
  engine                  = aws_rds_cluster.main.engine
  engine_version          = aws_rds_cluster.main.engine_version
  db_parameter_group_name = aws_db_parameter_group.main.name

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "aurora-writer-${var.environment_suffix}"
    Environment = "Shared"
    Role        = "Writer"
  }
}

# RDS Aurora Cluster Instances (Reader)
resource "aws_rds_cluster_instance" "reader" {
  count = 2

  identifier              = "aurora-reader-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier      = aws_rds_cluster.main.id
  instance_class          = "db.r6g.large"
  engine                  = aws_rds_cluster.main.engine
  engine_version          = aws_rds_cluster.main.engine_version
  db_parameter_group_name = aws_db_parameter_group.main.name

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "aurora-reader-${count.index + 1}-${var.environment_suffix}"
    Environment = "Shared"
    Role        = "Reader"
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "rds-monitoring-role-${var.environment_suffix}"

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
    Name = "rds-monitoring-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# RDS Proxy IAM Role
resource "aws_iam_role" "rds_proxy" {
  name = "rds-proxy-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "rds-proxy-role-${var.environment_suffix}"
  }
}

# Secrets Manager Secret for RDS Credentials
resource "aws_secretsmanager_secret" "rds_credentials" {
  name                    = "rds-credentials-${var.environment_suffix}"
  description             = "RDS Aurora cluster credentials for RDS Proxy"
  recovery_window_in_days = 0

  tags = {
    Name = "rds-credentials-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = var.db_master_password
  })
}

# IAM Policy for RDS Proxy to access Secrets Manager
resource "aws_iam_policy" "rds_proxy_secrets" {
  name        = "rds-proxy-secrets-${var.environment_suffix}"
  description = "Allow RDS Proxy to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.rds_credentials.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_proxy_secrets" {
  role       = aws_iam_role.rds_proxy.name
  policy_arn = aws_iam_policy.rds_proxy_secrets.arn
}

# RDS Proxy
resource "aws_db_proxy" "main" {
  name                   = "rds-proxy-${var.environment_suffix}"
  debug_logging          = false
  engine_family          = "MYSQL"
  auth {
    auth_scheme = "SECRETS"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.rds_credentials.arn
  }
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = var.db_subnet_ids
  vpc_security_group_ids = [aws_security_group.rds_proxy.id]

  require_tls = true

  tags = {
    Name        = "rds-proxy-${var.environment_suffix}"
    Environment = "Shared"
  }
}

# RDS Proxy Target Group
resource "aws_db_proxy_default_target_group" "main" {
  db_proxy_name = aws_db_proxy.main.name

  connection_pool_config {
    connection_borrow_timeout    = 120
    max_connections_percent      = 100
    max_idle_connections_percent = 50
  }
}

# RDS Proxy Target
resource "aws_db_proxy_target" "main" {
  db_proxy_name         = aws_db_proxy.main.name
  target_arn            = aws_rds_cluster.main.arn
  db_cluster_identifier = aws_rds_cluster.main.cluster_identifier
}
```

## File: lib/alb.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name        = "alb-${var.environment_suffix}"
    Environment = "Shared"
  }
}

# Target Group - Blue Environment
resource "aws_lb_target_group" "blue" {
  name     = "tg-blue-${var.environment_suffix}"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name            = "tg-blue-${var.environment_suffix}"
    Environment     = "Blue"
    DeploymentType  = "BlueGreen"
    Version         = var.app_version_blue
  }
}

# Target Group - Green Environment
resource "aws_lb_target_group" "green" {
  name     = "tg-green-${var.environment_suffix}"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name            = "tg-green-${var.environment_suffix}"
    Environment     = "Green"
    DeploymentType  = "BlueGreen"
    Version         = var.app_version_green
  }
}

# ALB Listener - HTTP (Port 80)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "forward"

    forward {
      target_group {
        arn    = aws_lb_target_group.blue.arn
        weight = var.blue_traffic_weight
      }

      target_group {
        arn    = aws_lb_target_group.green.arn
        weight = var.green_traffic_weight
      }

      stickiness {
        enabled  = true
        duration = 3600
      }
    }
  }

  tags = {
    Name = "alb-listener-http-${var.environment_suffix}"
  }
}
```

## File: lib/launch_templates.tf

```hcl
# User Data Script for EC2 Instances
locals {
  user_data_blue = base64encode(templatefile("${path.module}/user_data.sh", {
    environment        = "blue"
    environment_suffix = var.environment_suffix
    s3_bucket          = aws_s3_bucket.artifacts.bucket
    app_version        = var.app_version_blue
    db_proxy_endpoint  = aws_db_proxy.main.endpoint
    db_name            = var.db_name
    region             = var.region
  }))

  user_data_green = base64encode(templatefile("${path.module}/user_data.sh", {
    environment        = "green"
    environment_suffix = var.environment_suffix
    s3_bucket          = aws_s3_bucket.artifacts.bucket
    app_version        = var.app_version_green
    db_proxy_endpoint  = aws_db_proxy.main.endpoint
    db_name            = var.db_name
    region             = var.region
  }))
}

# Launch Template - Blue Environment
resource "aws_launch_template" "blue" {
  name_prefix   = "lt-blue-${var.environment_suffix}-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = local.user_data_blue

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name            = "ec2-blue-${var.environment_suffix}"
      Environment     = "Blue"
      DeploymentType  = "BlueGreen"
      Version         = var.app_version_blue
    }
  }

  tag_specifications {
    resource_type = "volume"

    tags = {
      Name            = "volume-blue-${var.environment_suffix}"
      Environment     = "Blue"
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name            = "lt-blue-${var.environment_suffix}"
    Environment     = "Blue"
    DeploymentType  = "BlueGreen"
    Version         = var.app_version_blue
  }
}

# Launch Template - Green Environment
resource "aws_launch_template" "green" {
  name_prefix   = "lt-green-${var.environment_suffix}-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = local.user_data_green

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name            = "ec2-green-${var.environment_suffix}"
      Environment     = "Green"
      DeploymentType  = "BlueGreen"
      Version         = var.app_version_green
    }
  }

  tag_specifications {
    resource_type = "volume"

    tags = {
      Name            = "volume-green-${var.environment_suffix}"
      Environment     = "Green"
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name            = "lt-green-${var.environment_suffix}"
    Environment     = "Green"
    DeploymentType  = "BlueGreen"
    Version         = var.app_version_green
  }
}
```

## File: lib/asg.tf

```hcl
# Auto Scaling Group - Blue Environment
resource "aws_autoscaling_group" "blue" {
  name                = "asg-blue-${var.environment_suffix}"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.blue.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_instances
  max_size         = var.max_instances
  desired_capacity = var.desired_instances

  launch_template {
    id      = aws_launch_template.blue.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMinSize",
    "GroupMaxSize",
    "GroupTotalInstances"
  ]

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "asg-blue-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "Blue"
    propagate_at_launch = true
  }

  tag {
    key                 = "DeploymentType"
    value               = "BlueGreen"
    propagate_at_launch = true
  }

  tag {
    key                 = "Version"
    value               = var.app_version_blue
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }
}

# Auto Scaling Group - Green Environment
resource "aws_autoscaling_group" "green" {
  name                = "asg-green-${var.environment_suffix}"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.green.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_instances
  max_size         = var.max_instances
  desired_capacity = var.desired_instances

  launch_template {
    id      = aws_launch_template.green.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMinSize",
    "GroupMaxSize",
    "GroupTotalInstances"
  ]

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "asg-green-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "Green"
    propagate_at_launch = true
  }

  tag {
    key                 = "DeploymentType"
    value               = "BlueGreen"
    propagate_at_launch = true
  }

  tag {
    key                 = "Version"
    value               = var.app_version_green
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }
}

# Auto Scaling Policy - Blue Environment (Target Tracking - CPU)
resource "aws_autoscaling_policy" "blue_cpu" {
  name                   = "asg-policy-blue-cpu-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.blue.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Auto Scaling Policy - Green Environment (Target Tracking - CPU)
resource "aws_autoscaling_policy" "green_cpu" {
  name                   = "asg-policy-green-cpu-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.green.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Auto Scaling Policy - Blue Environment (Target Tracking - ALB Request Count)
resource "aws_autoscaling_policy" "blue_request_count" {
  name                   = "asg-policy-blue-requests-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.blue.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.blue.arn_suffix}"
    }
    target_value = 1000.0
  }
}

# Auto Scaling Policy - Green Environment (Target Tracking - ALB Request Count)
resource "aws_autoscaling_policy" "green_request_count" {
  name                   = "asg-policy-green-requests-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.green.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.green.arn_suffix}"
    }
    target_value = 1000.0
  }
}
```

## File: lib/route53.tf

```hcl
# Route 53 Weighted Routing - Blue Environment
resource "aws_route53_record" "blue" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "blue-${var.environment_suffix}"
  weight         = var.blue_traffic_weight

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Route 53 Weighted Routing - Green Environment
resource "aws_route53_record" "green" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "green-${var.environment_suffix}"
  weight         = var.green_traffic_weight

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
```

## File: lib/cloudwatch.tf

```hcl
# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  name = "cloudwatch-alarms-${var.environment_suffix}"

  tags = {
    Name = "cloudwatch-alarms-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - Blue Target Group Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "blue_unhealthy_hosts" {
  alarm_name          = "blue-unhealthy-hosts-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when blue environment has unhealthy hosts"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.blue.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name        = "blue-unhealthy-hosts-${var.environment_suffix}"
    Environment = "Blue"
  }
}

# CloudWatch Alarm - Green Target Group Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "green_unhealthy_hosts" {
  alarm_name          = "green-unhealthy-hosts-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when green environment has unhealthy hosts"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.green.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name        = "green-unhealthy-hosts-${var.environment_suffix}"
    Environment = "Green"
  }
}

# CloudWatch Alarm - Blue ASG CPU Utilization
resource "aws_cloudwatch_metric_alarm" "blue_cpu_high" {
  alarm_name          = "blue-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when blue environment CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.blue.name
  }

  tags = {
    Name        = "blue-cpu-high-${var.environment_suffix}"
    Environment = "Blue"
  }
}

# CloudWatch Alarm - Green ASG CPU Utilization
resource "aws_cloudwatch_metric_alarm" "green_cpu_high" {
  alarm_name          = "green-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when green environment CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.green.name
  }

  tags = {
    Name        = "green-cpu-high-${var.environment_suffix}"
    Environment = "Green"
  }
}

# CloudWatch Alarm - Blue Target Group Request Count
resource "aws_cloudwatch_metric_alarm" "blue_request_count_high" {
  alarm_name          = "blue-request-count-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RequestCountPerTarget"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10000"
  alarm_description   = "Alert when blue environment request count is high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.blue.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name        = "blue-request-count-high-${var.environment_suffix}"
    Environment = "Blue"
  }
}

# CloudWatch Alarm - Green Target Group Request Count
resource "aws_cloudwatch_metric_alarm" "green_request_count_high" {
  alarm_name          = "green-request-count-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RequestCountPerTarget"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10000"
  alarm_description   = "Alert when green environment request count is high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.green.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name        = "green-request-count-high-${var.environment_suffix}"
    Environment = "Green"
  }
}

# CloudWatch Alarm - ALB 5XX Errors
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "alb-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert when ALB has high 5XX error rate"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "alb-5xx-errors-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "rds-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when RDS CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = {
    Name = "rds-cpu-high-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - RDS Database Connections
resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "rds-connections-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "800"
  alarm_description   = "Alert when RDS connections exceed 800"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = {
    Name = "rds-connections-high-${var.environment_suffix}"
  }
}
```

## File: lib/user_data.sh

```bash
#!/bin/bash
set -e

# Update system
yum update -y

# Install Docker
amazon-linux-extras install docker -y
systemctl start docker
systemctl enable docker

# Install CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Set environment variables
export ENVIRONMENT="${environment}"
export ENVIRONMENT_SUFFIX="${environment_suffix}"
export S3_BUCKET="${s3_bucket}"
export APP_VERSION="${app_version}"
export DB_PROXY_ENDPOINT="${db_proxy_endpoint}"
export DB_NAME="${db_name}"
export AWS_REGION="${region}"

# Create application directory
mkdir -p /opt/app

# Download application artifact from S3
aws s3 cp s3://$${S3_BUCKET}/app-$${APP_VERSION}.tar.gz /opt/app/app.tar.gz
cd /opt/app
tar -xzf app.tar.gz

# Configure environment file for application
cat > /opt/app/.env <<EOF
ENVIRONMENT=$${ENVIRONMENT}
APP_VERSION=$${APP_VERSION}
DB_HOST=$${DB_PROXY_ENDPOINT}
DB_NAME=$${DB_NAME}
DB_PORT=3306
AWS_REGION=$${AWS_REGION}
EOF

# Pull Docker image or build from Dockerfile
if [ -f /opt/app/Dockerfile ]; then
  docker build -t myapp:$${APP_VERSION} /opt/app/
else
  # Assume pre-built image in ECR or Docker Hub
  docker pull myapp:$${APP_VERSION} || true
fi

# Run Docker container
docker run -d \
  --name myapp \
  --restart always \
  -p 8080:8080 \
  --env-file /opt/app/.env \
  myapp:$${APP_VERSION}

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/$${ENVIRONMENT}",
            "log_stream_name": "{instance_id}/messages"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "CustomApp/$${ENVIRONMENT}",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MemoryUtilization",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DiskUtilization",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "/"
        ]
      }
    }
  }
}
EOF

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Health check endpoint
mkdir -p /var/www/html
cat > /var/www/html/health.html <<EOF
<!DOCTYPE html>
<html>
<head><title>Health Check</title></head>
<body>
<h1>OK - $${ENVIRONMENT} - $${APP_VERSION}</h1>
</body>
</html>
EOF

# Simple HTTP server for health checks on port 8080
yum install -y python3
cd /var/www/html
nohup python3 -m http.server 8080 &

echo "User data execution completed successfully for $${ENVIRONMENT} environment"
```

## File: lib/outputs.tf

```hcl
# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

# Target Group Outputs
output "blue_target_group_arn" {
  description = "ARN of the blue target group"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "ARN of the green target group"
  value       = aws_lb_target_group.green.arn
}

# Auto Scaling Group Outputs
output "blue_asg_name" {
  description = "Name of the blue Auto Scaling Group"
  value       = aws_autoscaling_group.blue.name
}

output "green_asg_name" {
  description = "Name of the green Auto Scaling Group"
  value       = aws_autoscaling_group.green.name
}

# RDS Outputs
output "rds_cluster_endpoint" {
  description = "Writer endpoint of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_proxy_endpoint" {
  description = "Endpoint of the RDS Proxy"
  value       = aws_db_proxy.main.endpoint
}

output "rds_cluster_identifier" {
  description = "Identifier of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.cluster_identifier
}

# S3 Outputs
output "artifacts_bucket_name" {
  description = "Name of the S3 bucket for artifacts"
  value       = aws_s3_bucket.artifacts.bucket
}

output "artifacts_bucket_arn" {
  description = "ARN of the S3 bucket for artifacts"
  value       = aws_s3_bucket.artifacts.arn
}

# Route 53 Outputs
output "application_domain" {
  description = "Domain name for the application"
  value       = var.domain_name
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "rds_proxy_security_group_id" {
  description = "ID of the RDS Proxy security group"
  value       = aws_security_group.rds_proxy.id
}

# IAM Outputs
output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_instance_role_arn" {
  description = "ARN of the EC2 instance role"
  value       = aws_iam_role.ec2_instance_role.arn
}

# CloudWatch Outputs
output "sns_topic_arn" {
  description = "ARN of the SNS topic for CloudWatch alarms"
  value       = aws_sns_topic.alarms.arn
}

# Deployment Information
output "blue_traffic_weight" {
  description = "Current traffic weight for blue environment"
  value       = var.blue_traffic_weight
}

output "green_traffic_weight" {
  description = "Current traffic weight for green environment"
  value       = var.green_traffic_weight
}

output "blue_app_version" {
  description = "Current application version in blue environment"
  value       = var.app_version_blue
}

output "green_app_version" {
  description = "Current application version in green environment"
  value       = var.app_version_green
}
```

## File: lib/terraform.tfvars.example

```hcl
# Environment Configuration
environment_suffix = "prod-123"
region             = "us-east-1"

# Network Configuration
vpc_id             = "vpc-xxxxxxxxx"
public_subnet_ids  = ["subnet-xxxxxxxxx", "subnet-yyyyyyyyy", "subnet-zzzzzzzzz"]
private_subnet_ids = ["subnet-aaaaaaaaa", "subnet-bbbbbbbbb", "subnet-ccccccccc"]
db_subnet_ids      = ["subnet-ddddddddd", "subnet-eeeeeeeee", "subnet-fffffffff"]

# EC2 Configuration
ami_id            = "ami-xxxxxxxxx"  # Amazon Linux 2 with Docker
instance_type     = "t3.medium"
min_instances     = 2
max_instances     = 6
desired_instances = 2

# Database Configuration
db_master_username = "admin"
db_master_password = "ChangeMeToSecurePassword123!"  # Use AWS Secrets Manager in production
db_name            = "appdb"

# Route 53 Configuration
hosted_zone_id = "Z1234567890ABC"
domain_name    = "app.example.com"

# Traffic Distribution (adjust for blue-green deployment)
blue_traffic_weight  = 100
green_traffic_weight = 0

# Application Versions
app_version_blue  = "1.0.0"
app_version_green = "1.0.0"

# Common Tags
common_tags = {
  Project     = "E-Commerce Platform"
  Team        = "Platform Engineering"
  CostCenter  = "Engineering"
  Terraform   = "true"
}
```

## File: lib/README.md

```markdown
# Blue-Green Deployment Architecture

This Terraform configuration implements a production-ready blue-green deployment architecture for containerized web applications on AWS.

## Architecture Overview

The solution provides zero-downtime deployments using:

- Application Load Balancer (ALB) with blue/green target groups for traffic switching
- Auto Scaling Groups maintaining separate blue and green environments
- RDS Aurora MySQL with Multi-AZ configuration and RDS Proxy for connection pooling
- Route 53 weighted routing for gradual traffic shifts
- CloudWatch monitoring and alarms for both environments
- S3 versioned artifact storage
- Security Groups enforcing least-privilege network access
- IAM Roles with minimal permissions for EC2 instances

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Existing VPC with public and private subnets across 3 AZs
- Route 53 hosted zone
- Docker-enabled AMI (Amazon Linux 2 recommended)

## File Structure

```
lib/
├── main.tf                   # Provider and Terraform configuration
├── variables.tf              # Variable definitions
├── data.tf                   # Data sources for existing resources
├── iam.tf                    # IAM roles, policies, and instance profiles
├── security_groups.tf        # Security groups for ALB, EC2, RDS
├── s3.tf                     # S3 bucket for artifacts
├── rds.tf                    # RDS Aurora cluster, instances, and proxy
├── alb.tf                    # Application Load Balancer and target groups
├── launch_templates.tf       # Launch templates for blue/green ASGs
├── asg.tf                    # Auto Scaling Groups and policies
├── route53.tf                # Route 53 weighted routing records
├── cloudwatch.tf             # CloudWatch alarms and SNS topics
├── user_data.sh              # EC2 user data script
├── outputs.tf                # Output values
├── terraform.tfvars.example  # Example variable values
└── README.md                 # This file
```

## Deployment Instructions

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Configure Variables

Copy the example tfvars file and customize it:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit terraform.tfvars with your AWS resource IDs:

- VPC ID and subnet IDs
- AMI ID (ensure it has Docker installed)
- Route 53 hosted zone ID
- Database credentials (use Secrets Manager in production)
- Domain name
- Environment suffix (for resource naming)

### 3. Review Planned Changes

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

This will create:
- Application Load Balancer
- Two target groups (blue and green)
- Two Auto Scaling Groups with launch templates
- RDS Aurora MySQL cluster with 1 writer and 2 readers
- RDS Proxy for connection management
- S3 bucket with versioning
- Security groups
- IAM roles and policies
- CloudWatch alarms
- Route 53 records

### 5. Upload Application Artifacts

Upload your application artifact to S3:

```bash
aws s3 cp app-1.0.0.tar.gz s3://app-artifacts-{environment_suffix}/
```

### 6. Verify Deployment

Check the outputs:

```bash
terraform output
```

Access your application using the ALB DNS name or configured domain.

## Blue-Green Deployment Process

### Initial State
- Blue environment: 100% traffic (production)
- Green environment: 0% traffic (idle)

### Deploying New Version

1. Update Green Environment:
   ```bash
   terraform apply -var="app_version_green=2.0.0"
   ```
   This updates the green launch template with the new version.

2. Refresh Green Instances:
   Trigger an instance refresh for the green ASG to deploy new version.

3. Test Green Environment:
   Use direct target group testing or Route 53 weighted routing with minimal traffic.

4. Shift Traffic to Green:
   ```bash
   terraform apply \
     -var="blue_traffic_weight=0" \
     -var="green_traffic_weight=100"
   ```

5. Monitor:
   Watch CloudWatch alarms for any issues:
   - Unhealthy host counts
   - CPU utilization
   - Request count
   - Error rates

6. Rollback if Needed:
   If issues occur, instantly shift traffic back to blue:
   ```bash
   terraform apply \
     -var="blue_traffic_weight=100" \
     -var="green_traffic_weight=0"
   ```

7. Update Blue for Next Deployment:
   Once green is stable, update blue environment:
   ```bash
   terraform apply -var="app_version_blue=2.0.0"
   ```

### Gradual Traffic Shift

For safer deployments, gradually shift traffic:

```bash
# 10% to green
terraform apply -var="blue_traffic_weight=90" -var="green_traffic_weight=10"

# Monitor for 15 minutes

# 50% to green
terraform apply -var="blue_traffic_weight=50" -var="green_traffic_weight=50"

# Monitor for 15 minutes

# 100% to green
terraform apply -var="blue_traffic_weight=0" -var="green_traffic_weight=100"
```

## Resource Naming

All resources use the environment_suffix variable for unique naming:

- alb-{environment_suffix}
- asg-blue-{environment_suffix}
- asg-green-{environment_suffix}
- aurora-cluster-{environment_suffix}
- rds-proxy-{environment_suffix}
- app-artifacts-{environment_suffix}

This prevents conflicts when deploying multiple environments.

## Security Considerations

1. Network Isolation:
   - ALB in public subnets
   - EC2 instances in private subnets
   - RDS in private subnets
   - Security groups restrict traffic flow

2. IAM Least Privilege:
   - EC2 instances have minimal S3 and CloudWatch permissions
   - RDS Proxy uses Secrets Manager for credentials

3. Encryption:
   - EBS volumes encrypted
   - S3 bucket encrypted with AES256
   - RDS storage encrypted
   - RDS Proxy requires TLS

4. Secrets Management:
   - Database credentials stored in Secrets Manager
   - Never commit credentials to version control
   - Use AWS Secrets Manager or Parameter Store in production

## Monitoring

CloudWatch alarms monitor:

- Blue Environment:
  - Unhealthy host count
  - CPU utilization
  - Request count

- Green Environment:
  - Unhealthy host count
  - CPU utilization
  - Request count

- Load Balancer:
  - 5XX error rate

- Database:
  - CPU utilization
  - Connection count

All alarms send notifications to the SNS topic.

## Cost Optimization

- Uses target tracking scaling policies for efficient capacity
- Aurora cluster can be stopped when not in use (dev/test)
- Consider Savings Plans or Reserved Instances for production
- Use gp3 EBS volumes for better price/performance
- Enable S3 lifecycle policies for old artifacts

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Warning: This will delete all resources including the RDS cluster and S3 bucket contents.

## Troubleshooting

### Health Check Failures
- Verify security group rules allow ALB to EC2 traffic on port 8080
- Check EC2 user data logs: /var/log/cloud-init-output.log
- Ensure application responds on /health endpoint

### Connection Issues
- Verify RDS Proxy endpoint is accessible from EC2 instances
- Check security group rules for RDS Proxy to RDS traffic
- Verify database credentials in Secrets Manager

### Auto Scaling Issues
- Check CloudWatch metrics for ASG health
- Verify launch template user data script
- Review ASG activity history in AWS Console

## Additional Notes

- The user data script installs Docker, CloudWatch Agent, and AWS CLI
- Application artifacts must be uploaded to S3 before deployment
- Health check endpoint must return HTTP 200 on /health
- RDS Proxy prevents connection exhaustion during traffic spikes
- Instance refresh allows rolling updates with minimal disruption

## Architecture Summary

This implementation provides:

1. Blue-Green Deployment: Two identical environments (blue/green) allowing instant traffic switching
2. Zero Downtime: ALB listener rules and Route 53 weighted routing enable seamless cutover
3. Database Layer: Aurora MySQL with RDS Proxy prevents connection exhaustion during deployments
4. Auto Scaling: Both environments scale independently based on CPU and request count
5. Monitoring: Comprehensive CloudWatch alarms for health, performance, and errors
6. Security: Layered security groups restrict traffic flow, encrypted storage, IAM least privilege
7. Artifact Management: S3 versioning tracks deployment history
8. Gradual Rollout: Route 53 weights allow percentage-based traffic shifts
9. Quick Rollback: Instant traffic reversion to previous environment if issues occur
10. Resource Naming: All resources include environmentSuffix for uniqueness

The solution is production-ready, scalable, and follows AWS best practices for blue-green deployments.
```
