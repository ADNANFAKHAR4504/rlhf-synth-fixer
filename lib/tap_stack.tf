########################
# S3 Bucket with AES-256 Encryption
########################

locals {
  # Use ENVIRONMENT_SUFFIX from pipeline as PR/env isolation
  env_suffix         = var.environment_suffix != "" ? var.environment_suffix : var.environment
  bucket_name_full   = "${var.bucket_name}-${local.env_suffix}"      # <--- uses unique suffix
  s3_name_tag        = "secure-s3-${local.env_suffix}"              # <--- uses suffix
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name        = "secure-vpc-${local.env_suffix}"                  # <--- uses suffix
    Environment = local.env_suffix
    ManagedBy   = "terraform"
    Project     = "secure-env"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name        = "secure-igw-${local.env_suffix}"
    Environment = local.env_suffix
  }
}

output "internet_gateway_id" {
  value = aws_internet_gateway.main.id
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name        = "secure-public-rt-${local.env_suffix}"
    Environment = local.env_suffix
  }
}

resource "aws_route" "igw_route" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_s3_bucket" "secure_prod" {
  bucket = local.bucket_name_full                                   # <--- uses suffix
  tags   = merge(var.bucket_tags, {
    Environment = local.env_suffix,
    Name        = local.s3_name_tag                                 # <--- uses suffix
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secure_prod_encryption" {
  bucket = aws_s3_bucket.secure_prod.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "secure_prod_pab" {
  bucket                  = aws_s3_bucket.secure_prod.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "secure_prod_versioning" {
  bucket = aws_s3_bucket.secure_prod.id
  versioning_configuration {
    status = "Enabled"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.secure_prod.bucket
}

output "bucket_id" {
  value = aws_s3_bucket.secure_prod.id
}

output "bucket_tags" {
  value = aws_s3_bucket.secure_prod.tags
}

output "bucket_region" {
  value = var.bucket_region
}

########################
# IAM Roles and Policies for EC2 and Pipeline
########################

resource "aws_iam_role" "ec2_role" {
  name = "secure-ec2-role-${local.env_suffix}"                      # <--- uses suffix
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  tags = merge(var.bucket_tags, { Environment = local.env_suffix })
}

resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name        = "secure-cloudwatch-logs-policy-${local.env_suffix}" # <--- uses suffix
  description = "Allow EC2 to write logs to CloudWatch"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
  tags = merge(var.bucket_tags, { Environment = local.env_suffix })
}

resource "aws_iam_policy" "s3_access_policy" {
  name        = "secure-s3-access-policy-${local.env_suffix}"       # <--- uses suffix
  description = "Allow EC2 to access S3 buckets"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::*"
        ]
      }
    ]
  })
  tags = merge(var.bucket_tags, { Environment = local.env_suffix })
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs_policy.arn
}

resource "aws_iam_role_policy_attachment" "s3_access_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}

resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "secure-ec2-profile-${local.env_suffix}"                  # <--- uses suffix
  role = aws_iam_role.ec2_role.name
  tags = merge(var.bucket_tags, { Environment = local.env_suffix })
}

output "ec2_role_name" {
  value = aws_iam_role.ec2_role.name
}

output "ec2_profile_name" {
  value = aws_iam_instance_profile.ec2_profile.name
}

output "cloudwatch_logs_policy_name" {
  value = aws_iam_policy.cloudwatch_logs_policy.name
}

output "s3_access_policy_name" {
  value = aws_iam_policy.s3_access_policy.name
}

########################
# Variables
########################

variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "bucket_region" {
  description = "Region for the S3 bucket (e.g., us-west-2)"
  type        = string
  default     = "us-west-2"
}

variable "bucket_name" {
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

variable "environment" {
  description = "Deployment environment (e.g., dev, prod)"
  type        = string
  default     = "prod"
}

variable "environment_suffix" {
  description = "Suffix for PR or ephemeral environment, set by pipeline"
  type        = string
  default     = ""
}

########################
# Network ACLs (NACLs) - Only allow TCP ports 443 and 22
########################

resource "aws_network_acl" "secure_prod" {
  vpc_id = aws_vpc.main.id
    ingress {
      protocol   = "tcp"
      rule_no    = 115
      action     = "allow"
      cidr_block = "0.0.0.0/0"
      from_port  = 443
      to_port    = 443
    }
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 22
    to_port    = 22
  }
  ingress {
    protocol   = "-1"
    rule_no    = 120
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }
  egress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 22
    to_port    = 22
  }
  egress {
    protocol   = "-1"
    rule_no    = 120
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  tags = merge(var.bucket_tags, { Environment = local.env_suffix })          # <--- uses suffix
}

output "network_acl_id" {
  value = aws_network_acl.secure_prod.id
}

########################
# RDS Password Storage in AWS Secrets Manager
########################

resource "random_password" "rds_password" {
  length  = 16
  special = true
}

resource "aws_secretsmanager_secret" "rds_password" {
  name        = "secure-rds-password-${local.env_suffix}-${random_string.suffix.result}" # <--- now always unique!
  description = "RDS instance password for secure production environment"
  tags        = merge(var.bucket_tags, { Environment = local.env_suffix })  # <--- uses suffix
}

resource "aws_secretsmanager_secret_version" "rds_password_version" {
  secret_id     = aws_secretsmanager_secret.rds_password.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.rds_password.result
    port     = 3306
  })
}

output "rds_secret_name" {
  value = aws_secretsmanager_secret.rds_password.name
}

########################
# CloudWatch Dashboard with EC2, RDS, and Auto Scaling Widgets
########################

resource "aws_cloudwatch_dashboard" "secure_prod" {
  dashboard_name = "secure-dashboard-${local.env_suffix}"                   # <--- uses suffix
  dashboard_body = jsonencode({
    widgets = [
      {
        type    = "metric"
        x       = 0
        y       = 0
        width   = 12
        height  = 6
        properties = {
          metrics = [
            [ "AWS/EC2", "CPUUtilization", "InstanceId", "i-xxxxxxxxxxxxxxxxx" ]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "EC2 CPU Utilization"
        }
      },
      {
        type    = "metric"
        x       = 12
        y       = 0
        width   = 12
        height  = 6
        properties = {
          metrics = [
            [ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "secure-prod-db" ]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS CPU Utilization"
        }
      },
      {
        type    = "metric"
        x       = 0
        y       = 6
        width   = 24
        height  = 6
        properties = {
          metrics = [
            [ "AWS/AutoScaling", "GroupInServiceInstances", "AutoScalingGroupName", "secure-prod-asg" ]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Auto Scaling Group In-Service Instances"
        }
      }
    ]
  })
}

output "cloudwatch_dashboard_name" {
  value = aws_cloudwatch_dashboard.secure_prod.dashboard_name
}

output "cloudwatch_dashboard_body" {
  value = aws_cloudwatch_dashboard.secure_prod.dashboard_body
}

########################
# VPC Output
########################

output "vpc_id" {
  value = aws_vpc.main.id
}

output "vpc_cidr_block" {
  value = aws_vpc.main.cidr_block
}

# -------------------------------------------------
# NEW RESOURCES ADDED FOR COMPLIANCE (2025-08-20)
# -------------------------------------------------

########################
# EC2 Launch Template for ASG
########################

resource "aws_launch_template" "secure_prod_lt" {
  name_prefix   = "secure-prod-lt-${local.env_suffix}-"
  image_id      = data.aws_ami.latest_amazon_linux.id
  instance_type = "t3.micro"
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  user_data = base64encode(file("user-data.sh"))
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "secure-ec2-${local.env_suffix}"
      Environment = local.env_suffix
      ManagedBy   = "terraform"
      Project     = "secure-env"
    }
  }
}

data "aws_ami" "latest_amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

output "ec2_launch_template_id" {
  value = aws_launch_template.secure_prod_lt.id
}

########################
# EC2 Auto Scaling Group
########################

resource "aws_autoscaling_group" "secure_prod_asg" {
  name                = "secure-prod-asg-${local.env_suffix}"
  min_size            = 3
  max_size            = 6
  desired_capacity    = 3
  vpc_zone_identifier = [aws_subnet.public1.id, aws_subnet.public2.id]
  launch_template {
    id      = aws_launch_template.secure_prod_lt.id
    version = "$Latest"
  }
  tag {
    key                 = "Name"
    value               = "secure-prod-asg-${local.env_suffix}"
    propagate_at_launch = true
  }
  tag {
    key                 = "Environment"
    value               = local.env_suffix
    propagate_at_launch = true
  }
}

resource "aws_subnet" "public1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-west-2a"
  map_public_ip_on_launch = true
  tags = {
    Name        = "secure-prod-public1-${local.env_suffix}"
    Environment = local.env_suffix
  }
}

resource "aws_subnet" "public2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-west-2b"
  map_public_ip_on_launch = true
  tags = {
    Name        = "secure-prod-public2-${local.env_suffix}"
    Environment = local.env_suffix
  }
}

output "autoscaling_group_name" {
  value = aws_autoscaling_group.secure_prod_asg.name
}

resource "aws_route_table_association" "public1" {
  subnet_id      = aws_subnet.public1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public2" {
  subnet_id      = aws_subnet.public2.id
  route_table_id = aws_route_table.public.id
}

output "public_route_table_id" {
  value = aws_route_table.public.id
}

########################
# Application Load Balancer (ALB)
########################

resource "aws_lb" "secure_prod_alb" {
  name               = "secure-prod-alb-${local.env_suffix}"
  internal           = false
  load_balancer_type = "application"
  subnets            = [aws_subnet.public1.id, aws_subnet.public2.id]
  security_groups    = [aws_security_group.alb_sg_http.id]
  tags = {
    Name        = "secure-prod-alb-${local.env_suffix}"
    Environment = local.env_suffix
  }
}

resource "aws_security_group" "alb_sg_http" {
  name        = "secure-prod-alb-sg-http-${local.env_suffix}"
  vpc_id      = aws_vpc.main.id
  description = "Allow 80 inbound for ALB"
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
  tags = {
    Name        = "secure-prod-alb-sg-http-${local.env_suffix}"
    Environment = local.env_suffix
  }
}

output "alb_dns_name" {
  value = aws_lb.secure_prod_alb.dns_name
}

resource "aws_lb_target_group" "secure_prod_tg" {
  name     = "secure-prod-tg-${local.env_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check {
    enabled             = true
    interval            = 30
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 2
    matcher             = "200-399"
  }
  tags = {
    Name        = "secure-prod-tg-${local.env_suffix}"
    Environment = local.env_suffix
  }
}

resource "aws_lb_listener" "secure_prod_listener" {
  load_balancer_arn = aws_lb.secure_prod_alb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secure_prod_tg.arn
  }
}

resource "aws_autoscaling_attachment" "asg_attach" {
  autoscaling_group_name = aws_autoscaling_group.secure_prod_asg.name
  lb_target_group_arn   = aws_lb_target_group.secure_prod_tg.arn
}

output "alb_target_group_arn" {
  value = aws_lb_target_group.secure_prod_tg.arn
}

########################
# RDS Multi-AZ Instance
########################
resource "aws_db_subnet_group" "secure_prod_db_subnet" {
  name       = "secure-prod-db-subnet-${local.env_suffix}"
  subnet_ids = [aws_subnet.public1.id, aws_subnet.public2.id]
  tags = {
    Name        = "secure-prod-db-subnet-${local.env_suffix}"
    Environment = local.env_suffix
  }
}

resource "aws_db_instance" "secure_prod_db" {
  identifier              = "secure-prod-db-${local.env_suffix}"
  allocated_storage       = 20
  engine                  = "mysql"
  instance_class          = "db.t3.micro"
  username                = "admin"
  password                = jsondecode(data.aws_secretsmanager_secret_version.rds_password_version.secret_string)["password"]
  db_subnet_group_name    = aws_db_subnet_group.secure_prod_db_subnet.name
  vpc_security_group_ids  = [aws_security_group.rds_sg.id]
  multi_az                = true
  skip_final_snapshot     = true
  publicly_accessible     = false
  tags = {
    Name        = "secure-prod-db-${local.env_suffix}"
    Environment = local.env_suffix
  }
}

data "aws_secretsmanager_secret_version" "rds_password_version" {
  secret_id = aws_secretsmanager_secret.rds_password.id
}

resource "aws_security_group" "rds_sg" {
  name        = "secure-prod-rds-sg-${local.env_suffix}"
  vpc_id      = aws_vpc.main.id
  description = "DB SG for secure production"
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    security_groups = [aws_security_group.alb_sg_http.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name        = "secure-prod-rds-sg-${local.env_suffix}"
    Environment = local.env_suffix
  }
}

output "rds_instance_endpoint" {
  value = aws_db_instance.secure_prod_db.endpoint
}

########################
# DynamoDB Table with Auto Scaling
########################
resource "aws_dynamodb_table" "secure_prod_table" {
  name         = "secure-prod-table-${local.env_suffix}"
  billing_mode = "PROVISIONED"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  read_capacity  = 5
  write_capacity = 5
  tags = {
    Name        = "secure-prod-table-${local.env_suffix}"
    Environment = local.env_suffix
  }
}

resource "aws_appautoscaling_target" "dynamodb_read" {
  max_capacity       = 20
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.secure_prod_table.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_read_policy" {
  name               = "secure-prod-table-read-policy-${local.env_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_read.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_read.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_read.service_namespace
  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_target" "dynamodb_write" {
  max_capacity       = 20
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.secure_prod_table.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_write_policy" {
  name               = "secure-prod-table-write-policy-${local.env_suffix}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_write.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_write.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_write.service_namespace
  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.secure_prod_table.name
}

output "dynamodb_table_arn" {
  value = aws_dynamodb_table.secure_prod_table.arn
}