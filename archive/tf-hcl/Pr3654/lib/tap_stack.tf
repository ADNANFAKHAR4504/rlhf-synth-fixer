
# =============================================================================
# VARIABLES
# =============================================================================

variable "aws_region" {
  description = "The AWS region to deploy resources"
  default     = "us-west-2"
}

variable "unique_id" {
  description = "A unique identifier to be used in resource naming"
  type        = string
  default     = "iac-350039-prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "ssh_cidr" {
  description = "CIDR block for SSH access"
  default     = "203.0.113.0/24"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Department  = "Engineering"
    Project     = "Web Application"
  }
}

variable "db_instance_class" {
  description = "RDS instance class"
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Name of the database"
  default     = "appdb"
}

variable "db_username" {
  description = "Username for the database"
  default     = "dbadmin"
}


variable "lambda_name" {
  description = "Name of the Lambda function"
  default     = "app-processor"
}

data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {}

data "aws_rds_engine_version" "postgresql" {
  engine       = "postgres"
  default_only = true
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  name_prefix            = "${var.unique_id}-"
  s3_bucket_name         = "${local.name_prefix}secure-app-bucket"
  cloudtrail_bucket_name = "${local.name_prefix}secure-cloudtrail-logs"
  availability_zones     = slice(data.aws_availability_zones.available.names, 0, 2)
  common_tags = merge(var.tags, {
    ManagedBy = "Terraform"
  })
}

# =============================================================================
# VPC RESOURCES
# =============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}main-vpc" })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}main-igw" })
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = element(local.availability_zones, count.index)
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "${local.name_prefix}public-subnet-${count.index + 1}" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}public-route-table" })
}

resource "aws_route" "public_igw" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = element(aws_subnet.public.*.id, count.index)
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags = merge(local.common_tags, { Name = "${local.name_prefix}nat-eip" })
}

resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.common_tags, { Name = "${local.name_prefix}nat-gateway" })

  depends_on = [aws_internet_gateway.igw]
}

resource "aws_subnet" "private" {
  count                   = length(var.private_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_subnet_cidrs[count.index]
  availability_zone       = element(local.availability_zones, count.index)
  map_public_ip_on_launch = false
  tags                    = merge(local.common_tags, { Name = "${local.name_prefix}private-subnet-${count.index + 1}" })
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}private-route-table" })
}

resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = element(aws_subnet.private.*.id, count.index)
  route_table_id = aws_route_table.private.id
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

resource "aws_security_group" "web" {
  name        = "${local.name_prefix}web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTPS traffic from ALB"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
    description = "SSH access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}web-sg" })
}

resource "aws_security_group" "db" {
  name        = "${local.name_prefix}db-sg"
  description = "Security group for database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "PostgreSQL from web servers"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}db-sg" })
}

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}alb-sg"
  description = "Security group for application load balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}alb-sg" })
}

# =============================================================================
# S3 RESOURCES
# =============================================================================

resource "aws_s3_bucket" "app" {
  bucket = local.s3_bucket_name
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "app" {
  bucket                  = aws_s3_bucket.app.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
  bucket = aws_s3_bucket.app.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket" "cloudtrail" {
  bucket = local.cloudtrail_bucket_name
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket                  = aws_s3_bucket.cloudtrail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "AWSCloudTrailAclCheck",
        Effect   = "Allow",
        Principal = { Service = "cloudtrail.amazonaws.com" },
        Action   = "s3:GetBucketAcl",
        Resource = "arn:aws:s3:::${local.cloudtrail_bucket_name}"
      },
      {
        Sid      = "AWSCloudTrailWrite",
        Effect   = "Allow",
        Principal = { Service = "cloudtrail.amazonaws.com" },
        Action   = "s3:PutObject",
        Resource = "arn:aws:s3:::${local.cloudtrail_bucket_name}/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
        Condition = { StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" } }
      }
    ]
  })
}

# =============================================================================
# IAM RESOURCES
# =============================================================================

resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}ec2-s3-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" } }]
  })

  tags = local.common_tags
}

resource "aws_iam_policy" "s3_access" {
  name        = "${local.name_prefix}s3-bucket-access"
  description = "Policy that grants access to specific S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action   = ["s3:GetObject", "s3:ListBucket", "s3:PutObject"],
      Effect   = "Allow",
      Resource = ["arn:aws:s3:::${local.s3_bucket_name}", "arn:aws:s3:::${local.s3_bucket_name}/*"]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}ec2-s3-profile"
  role = aws_iam_role.ec2_role.name
}

resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}lambda-s3-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" } }]
  })

  tags = local.common_tags
}

resource "aws_iam_policy" "lambda_s3_policy" {
  name        = "${local.name_prefix}lambda-s3-policy"
  description = "Allow Lambda to access S3"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action   = ["s3:GetObject"],
      Effect   = "Allow",
      Resource = "${aws_s3_bucket.app.arn}/*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_s3_policy.arn
}

resource "aws_iam_role" "config_role" {
  name = "${local.name_prefix}aws-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "config.amazonaws.com" } }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# =============================================================================
# RDS RESOURCES
# =============================================================================

resource "aws_kms_key" "rds" {
  description         = "KMS key for RDS encryption"
  enable_key_rotation = true
  tags                = local.common_tags
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}rds-encryption-key"
  target_key_id = aws_kms_key.rds.key_id
}

resource "aws_db_subnet_group" "default" {
  name       = "${local.name_prefix}main-db-subnet-group"
  subnet_ids = aws_subnet.private.*.id
  tags       = local.common_tags
}

resource "aws_db_parameter_group" "postgres" {
  name   = "${local.name_prefix}postgres-parameters"
  family = data.aws_rds_engine_version.postgresql.parameter_group_family

  parameter {
    name  = "log_statement"
    value = "all"
  }

  tags = local.common_tags
}

# ── Generate a strong random DB password (no manual input).
#    RDS forbids certain characters in master password; we use a safe set.
resource "random_password" "db_master" {
  length           = 24
  special          = true
  override_special = "_#%+=-"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

resource "aws_db_instance" "postgres" {
  allocated_storage            = 20
  storage_type                 = "gp3"
  engine                       = "postgres"
  engine_version               = data.aws_rds_engine_version.postgresql.version
  instance_class               = var.db_instance_class
  db_name                      = var.db_name
  username                     = var.db_username
  password                     = random_password.db_master.result
  parameter_group_name         = aws_db_parameter_group.postgres.name
  vpc_security_group_ids       = [aws_security_group.db.id]
  db_subnet_group_name         = aws_db_subnet_group.default.name
  skip_final_snapshot          = true
  storage_encrypted            = true
  kms_key_id                   = aws_kms_key.rds.arn
  auto_minor_version_upgrade   = true
  backup_retention_period      = 7
  multi_az                     = true
  deletion_protection          = true
  performance_insights_enabled = true

  tags = local.common_tags
}

# =============================================================================
# ALB AND AUTO SCALING RESOURCES
# =============================================================================

resource "aws_lb" "app" {
  name                        = "${local.name_prefix}app-lb"
  internal                    = false
  load_balancer_type          = "application"
  security_groups             = [aws_security_group.alb.id]
  subnets                     = aws_subnet.public.*.id
  enable_deletion_protection  = true
  drop_invalid_header_fields  = true
  tags                        = local.common_tags
}

resource "aws_lb_target_group" "app" {
  name     = "${local.name_prefix}app-target-group"
  port     = 443
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}app-launch-template"
  image_id      = "ami-0c65adc9a5c1b5d7c"
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.web.id]

  iam_instance_profile { name = aws_iam_instance_profile.ec2_profile.name }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    amazon-linux-extras install nginx1 -y

    rm -f /etc/nginx/conf.d/default.conf

    cat <<'NGINXCONF' > /etc/nginx/conf.d/app.conf
    server {
      listen 443 default_server;
      listen [::]:443 default_server;
      server_name _;

      location / {
        return 200 'OK';
      }
    }
    NGINXCONF

    systemctl enable nginx
    systemctl restart nginx
  EOF
  )

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  monitoring { enabled = true }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tags = local.common_tags
}

resource "aws_autoscaling_group" "app" {
  name                = "${local.name_prefix}app-asg"
  desired_capacity    = 2
  min_size            = 1
  max_size            = 4
  vpc_zone_identifier = aws_subnet.private.*.id
  health_check_type   = "ELB"

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.app.arn]

  dynamic "tag" {
    for_each = merge(local.common_tags, { Name = "${local.name_prefix}web-server" })
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${local.name_prefix}scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${local.name_prefix}scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

# =============================================================================
# LAMBDA RESOURCES
# =============================================================================


resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.name_prefix}${var.lambda_name}"
  retention_in_days = 14
  tags              = local.common_tags
}

data "archive_file" "inline_lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda_inline.zip"

  source {
    content  = <<-JS
      // index.js
      // Processes CSV-style numeric payloads from S3 object creation events.
      const AWS = require("aws-sdk");
      const s3 = new AWS.S3();

      const parseNumbers = text =>
        text
          .split(/[ \t\r\n,]+/)
          .map(value => value.trim())
          .filter(Boolean)
          .map(Number)
          .filter(Number.isFinite);

      exports.handler = async event => {
        console.log("Received event", JSON.stringify(event));
        const records = Array.isArray(event?.Records) ? event.Records : [];
        if (!records.length) {
          console.log("No S3 records found in event");
          return { statusCode: 200, body: JSON.stringify({ recordsProcessed: 0 }) };
        }

        const results = [];

        for (const record of records) {
          const bucket = record?.s3?.bucket?.name;
          const rawKey = record?.s3?.object?.key;
          if (!bucket || !rawKey) {
            console.log("Skipping record missing bucket or key", JSON.stringify(record));
            continue;
          }

          const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
          try {
            const object = await s3.getObject({ Bucket: bucket, Key: key }).promise();
            const body = object.Body ? object.Body.toString("utf-8") : "";
            const numbers = parseNumbers(body);

            if (!numbers.length) {
              console.log(`No numeric data found for s3://$${bucket}/$${key}`);
              continue;
            }

            const count = numbers.length;
            const sum = numbers.reduce((total, value) => total + value, 0);
            const avg = count ? sum / count : 0;

            console.log(`Processed s3://$${bucket}/$${key} count=$${count} sum=$${sum} avg=$${avg}`);
            results.push({ bucket, key, count, sum, avg });
          } catch (error) {
            console.log(`Error processing s3://$${bucket}/$${key}`, error?.message ?? String(error));
          }
        }

        return { statusCode: 200, body: JSON.stringify({ processed: results.length, results }) };
      };
    JS
    filename = "index.js"
  }
}

resource "aws_lambda_function" "app" {
  function_name   = "${local.name_prefix}${var.lambda_name}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs16.x"
  filename        = data.archive_file.inline_lambda.output_path
  source_code_hash = data.archive_file.inline_lambda.output_base64sha256
  depends_on      = [aws_cloudwatch_log_group.lambda, aws_iam_role_policy_attachment.lambda_logs]

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.app.bucket
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_permission" "allow_bucket" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.app.arn
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.app.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.app.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_bucket]
}

# =============================================================================
# CLOUDWATCH RESOURCES
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.name_prefix}high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]
  dimensions          = { AutoScalingGroupName = aws_autoscaling_group.app.name }
  tags                = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${local.name_prefix}low-cpu-utilization"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 20
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]
  dimensions          = { AutoScalingGroupName = aws_autoscaling_group.app.name }
  tags                = local.common_tags
}

# =============================================================================
# API GATEWAY RESOURCES
# =============================================================================

resource "aws_api_gateway_rest_api" "app" {
  name        = "${local.name_prefix}app-api"
  description = "API Gateway for web application"
  endpoint_configuration { types = ["REGIONAL"] }
  tags = local.common_tags
}

resource "aws_api_gateway_resource" "app" {
  rest_api_id = aws_api_gateway_rest_api.app.id
  parent_id   = aws_api_gateway_rest_api.app.root_resource_id
  path_part   = "resource"
}

resource "aws_api_gateway_method" "app" {
  rest_api_id   = aws_api_gateway_rest_api.app.id
  resource_id   = aws_api_gateway_resource.app.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id             = aws_api_gateway_rest_api.app.id
  resource_id             = aws_api_gateway_resource.app.id
  http_method             = aws_api_gateway_method.app.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.app.invoke_arn
}

resource "aws_api_gateway_deployment" "app" {
  depends_on = [aws_api_gateway_integration.lambda]
  rest_api_id = aws_api_gateway_rest_api.app.id

  lifecycle { create_before_destroy = true }
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id   = aws_api_gateway_rest_api.app.id
  deployment_id = aws_api_gateway_deployment.app.id
  stage_name    = "prod"

  tags = local.common_tags
}

resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.app.id}/*/*/${aws_api_gateway_resource.app.path_part}"
}

# =============================================================================
# CLOUDTRAIL RESOURCES
# =============================================================================

resource "aws_cloudtrail" "main" {
  name                          = "${local.name_prefix}org-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  depends_on                    = [aws_s3_bucket_policy.cloudtrail]
  tags                          = local.common_tags
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "db_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.db.id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "alb_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.app.dns_name
}

output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}

output "ec2_iam_role" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.postgres.arn
}

output "s3_bucket_name" {
  description = "Name of the application S3 bucket"
  value       = aws_s3_bucket.app.bucket
}

output "cloudtrail_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail trail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = aws_cloudtrail.main.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.app.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.app.arn
}
