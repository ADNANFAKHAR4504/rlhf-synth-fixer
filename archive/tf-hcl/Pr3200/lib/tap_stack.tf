# Variables
variable "aws_region" {
  description = "The AWS region to deploy resources in (must match provider.tf var)"
  type        = string
  default     = "us-west-2"
  validation {
    condition     = var.aws_region == "us-west-2" || var.aws_region == "us-east-1"
    error_message = "Only us-west-2 (primary) and us-east-1 (secondary) regions are allowed."
  }
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name for resource tagging"
  type        = string
  default     = "tap"
}

variable "environment" {
  description = "Environment name for tagging (e.g. dev, test, prod)"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner name for resource tagging"
  type        = string
  default     = "DevSecOps"
}

variable "allowed_ips" {
  description = "List of allowed IPv4 CIDR ranges for HTTPS access"
  type        = list(string)
  default     = ["10.0.0.0/8", "192.168.0.0/16"]
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "tapdb"
}

variable "db_username" {
  description = "RDS database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "RDS database master password"
  type        = string
  sensitive   = true
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "lambda_runtime" {
  description = "Lambda runtime (latest recommended)"
  type        = string
  default     = "nodejs20.x"
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway (requires available EIP quota)"
  type        = bool
  default     = false  # Set to false to avoid EIP quota issues
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_region" "current" {}

# KMS keys (data and logs)
resource "aws_kms_key" "data" {
  description             = "CMK for data at rest (S3, RDS, DynamoDB, EBS, SNS)"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project}-data-kms"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "data" {
  name          = "alias/${var.project}-data"
  target_key_id = aws_kms_key.data.key_id
}

resource "aws_kms_key" "logs" {
  description             = "CMK for log encryption (CloudWatch Logs, CloudTrail)"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DecryptDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:${data.aws_partition.current.partition}:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to describe key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project}-logs-kms"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "logs" {
  name          = "alias/${var.project}-logs"
  target_key_id = aws_kms_key.logs.key_id
}

# VPC and networking
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.project}-vpc"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project}-public-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.project}-private-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project}-igw"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Note: NAT Gateway requires an EIP. If you hit EIP quota limits, 
# you may need to release unused EIPs or request a quota increase
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? 1 : 0
  domain = "vpc"

  tags = {
    Name        = "${var.project}-nat-eip"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_nat_gateway" "nat" {
  count         = var.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  depends_on = [aws_internet_gateway.igw]

  tags = {
    Name        = "${var.project}-nat"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name        = "${var.project}-public-rt"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.nat[0].id
    }
  }

  tags = {
    Name        = "${var.project}-private-rt"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# S3 Gateway VPC Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name        = "${var.project}-s3-endpoint"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Flow Logs to CloudWatch with KMS
resource "aws_cloudwatch_log_group" "vpc_flow" {
  name              = "/aws/vpc/flow-logs/${var.project}-${var.environment}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn

  tags = {
    Name        = "${var.project}-vpc-flow-logs"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role" "vpc_flow" {
  name = "${var.project}-vpc-flow-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.project}-vpc-flow-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy" "vpc_flow" {
  name = "${var.project}-vpc-flow-policy"
  role = aws_iam_role.vpc_flow.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogGroups", "logs:DescribeLogStreams"],
        Resource = "*"
      }
    ]
  })
}

resource "aws_flow_log" "vpc" {
  vpc_id               = aws_vpc.main.id
  traffic_type         = "ALL"
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_flow.arn
  iam_role_arn         = aws_iam_role.vpc_flow.arn

  tags = {
    Name        = "${var.project}-vpc-flow"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Security Groups (default deny)
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.main.id

  # No ingress or egress rules: deny-all by default

  tags = {
    Name        = "${var.project}-default-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "lambda" {
  name        = "${var.project}-lambda-sg"
  description = "Lambda SG with restricted egress"
  vpc_id      = aws_vpc.main.id

  # No ingress

  tags = {
    Name        = "${var.project}-lambda-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.project}-rds-sg"
  description = "RDS SG"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name        = "${var.project}-rds-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Separate security group rules to avoid circular dependency
resource "aws_security_group_rule" "lambda_to_rds" {
  type                     = "egress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.rds.id
  security_group_id        = aws_security_group.lambda.id
  description              = "MySQL to RDS"
}

resource "aws_security_group_rule" "rds_from_lambda" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.rds.id
  description              = "MySQL from Lambda"
}

# S3 bucket for static assets (encrypted, private, TLS enforced)
resource "aws_s3_bucket" "static" {
  bucket = "${var.project}-static-${data.aws_caller_identity.current.account_id}-${var.aws_region}"

  tags = {
    Name        = "${var.project}-static"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  bucket = aws_s3_bucket.static.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.data.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "static" {
  bucket                  = aws_s3_bucket.static.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "static_tls_only" {
  bucket = aws_s3_bucket.static.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid: "DenyInsecureTransport",
        Effect: "Deny",
        Principal: "*",
        Action: "s3:*",
        Resource: [aws_s3_bucket.static.arn, "${aws_s3_bucket.static.arn}/*"],
        Condition: {
          Bool: {"aws:SecureTransport": false}
        }
      }
    ]
  })
}

# DynamoDB (CMK encryption, PITR)
resource "aws_dynamodb_table" "app" {
  name         = "${var.project}-app-data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.data.arn
  }

  tags = {
    Name        = "${var.project}-dynamodb"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttled" {
  alarm_name          = "${var.project}-dynamodb-throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "DynamoDB throttled requests detected"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  dimensions = {
    TableName = aws_dynamodb_table.app.name
  }

  tags = {
    Name        = "${var.project}-ddb-throttle-alarm"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# RDS (private, Multi-AZ, encrypted, SSL required)
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnets"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "${var.project}-db-subnets"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_db_parameter_group" "mysql" {
  name   = "${var.project}-mysql-params"
  family = "mysql8.0"

  parameter {
    name  = "require_secure_transport"
    value = "ON"
  }

  tags = {
    Name        = "${var.project}-mysql-params"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_db_instance" "main" {
  identifier                = "${var.project}-db"
  allocated_storage         = 20
  storage_type              = "gp3"
  engine                    = "mysql"
  engine_version            = "8.0"
  instance_class            = var.rds_instance_class
  db_name                   = var.db_name
  username                  = var.db_username
  password                  = var.db_password
  parameter_group_name      = aws_db_parameter_group.mysql.name
  db_subnet_group_name      = aws_db_subnet_group.main.name
  vpc_security_group_ids    = [aws_security_group.rds.id]
  multi_az                  = true
  storage_encrypted         = true
  kms_key_id                = aws_kms_key.data.arn
  backup_retention_period   = 7
  copy_tags_to_snapshot     = true
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project}-db-final"
  publicly_accessible       = false
  auto_minor_version_upgrade  = true
  allow_major_version_upgrade = false

  tags = {
    Name        = "${var.project}-db"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project}-rds-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU > 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "${var.project}-rds-cpu-alarm"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Minimal EC2 instance (private only, no ingress)
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_security_group" "ec2" {
  name        = "${var.project}-ec2-sg"
  description = "EC2 SG with no ingress"
  vpc_id      = aws_vpc.main.id

  # No ingress rules

  # Restrictive egress: DNS + HTTPS for patching via NAT
  egress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "DNS"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name        = "${var.project}-ec2-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role" "ec2" {
  name = "${var.project}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "ec2.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.project}-ec2-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_policy" "ec2_least" {
  name        = "${var.project}-ec2-policy"
  description = "Least-privilege EC2 policy for S3 read and CW logs"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect: "Allow",
        Action: ["s3:GetObject", "s3:ListBucket"],
        Resource: [aws_s3_bucket.static.arn, "${aws_s3_bucket.static.arn}/*"]
      },
      {
        Effect: "Allow",
        Action: ["kms:Decrypt", "kms:GenerateDataKey"],
        Resource: aws_kms_key.data.arn
      },
      {
        Effect: "Allow",
        Action: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        Resource: "arn:${data.aws_partition.current.partition}:logs:*:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_attach" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2_least.arn
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project}-ec2-profile"
  role = aws_iam_role.ec2.name
}

resource "aws_instance" "web" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.private[0].id
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    encrypted             = true
    kms_key_id            = aws_kms_key.data.arn
    delete_on_termination = true
  }

  tags = {
    Name        = "${var.project}-ec2"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Lambda (inline source via archive)
locals {
  lambda_source = <<EOF
exports.handler = async (event) => {
  return { statusCode: 200, body: JSON.stringify({ ok: true, time: new Date().toISOString() }) };
}
EOF
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/function.zip"

  source {
    content  = local.lambda_source
    filename = "index.js"
  }
}

resource "aws_iam_role" "lambda" {
  name = "${var.project}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.project}-lambda-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_policy" "lambda_least" {
  name        = "${var.project}-lambda-policy"
  description = "Least-privilege Lambda policy"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:DeleteItem","dynamodb:Query","dynamodb:Scan"
        ],
        Resource: aws_dynamodb_table.app.arn
      },
      {
        Effect: "Allow",
        Action: ["kms:Decrypt","kms:GenerateDataKey"],
        Resource: aws_kms_key.data.arn
      },
      {
        Effect: "Allow",
        Action: ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],
        Resource: "arn:${data.aws_partition.current.partition}:logs:*:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect: "Allow",
        Action: ["ec2:CreateNetworkInterface","ec2:DescribeNetworkInterfaces","ec2:DeleteNetworkInterface"],
        Resource: "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_least.arn
}

resource "aws_lambda_function" "app" {
  function_name    = "${var.project}-app"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = var.lambda_runtime
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = filebase64sha256(data.archive_file.lambda_zip.output_path)

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.app.name
      RDS_HOST   = aws_db_instance.main.address
      RDS_DB     = aws_db_instance.main.db_name
      RDS_USER   = var.db_username
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name        = "${var.project}-lambda"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.app.function_name}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.logs.arn

  tags = {
    Name        = "${var.project}-lambda-logs"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Lambda errors detected"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  dimensions = {
    FunctionName = aws_lambda_function.app.function_name
  }

  tags = {
    Name        = "${var.project}-lambda-errors-alarm"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# API Gateway (Regional) and integration
resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project}-api"
  description = "API for ${var.project}"
  endpoint_configuration { types = ["REGIONAL"] }

  tags = {
    Name        = "${var.project}-api"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_api_gateway_resource" "root_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "api"
}

resource "aws_api_gateway_method" "get" {
  rest_api_id      = aws_api_gateway_rest_api.api.id
  resource_id      = aws_api_gateway_resource.root_resource.id
  http_method      = "GET"
  authorization    = "NONE"
  api_key_required = false
}

resource "aws_api_gateway_integration" "lambda_proxy" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.root_resource.id
  http_method             = aws_api_gateway_method.get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.app.invoke_arn
}

resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_cloudwatch_log_group" "apigw" {
  name              = "/aws/apigateway/${var.project}-${var.environment}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.logs.arn

  tags = {
    Name        = "${var.project}-apigw-logs"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_api_gateway_deployment" "api" {
  depends_on = [aws_api_gateway_integration.lambda_proxy]
  rest_api_id = aws_api_gateway_rest_api.api.id
  lifecycle { create_before_destroy = true }
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  deployment_id = aws_api_gateway_deployment.api.id
  stage_name    = "prod"

  # Note: access_log_settings requires CloudWatch Logs role to be set at account level
  # Run: aws apigateway update-account --patch-operations op=replace,path=/cloudwatchRoleArn,value=<role-arn>
  # For now, we're disabling access logs to avoid account-level prerequisites

  tags = {
    Name        = "${var.project}-api-stage"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# WAFv2 (attach at CloudFront for edge) - Must be in us-east-1 for CLOUDFRONT scope
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "aws_wafv2_ip_set" "allowed" {
  provider           = aws.us_east_1
  name               = "${var.project}-allowed-ips"
  description        = "Allowed IPs"
  scope              = "CLOUDFRONT"
  ip_address_version = "IPV4"
  addresses          = var.allowed_ips

  tags = {
    Name        = "${var.project}-allowed-ips"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_wafv2_web_acl" "edge" {
  provider    = aws.us_east_1
  name        = "${var.project}-edge-waf"
  description = "Default block, allow only allowed IPs"
  scope       = "CLOUDFRONT"

  default_action {
    block {}
  }

  rule {
    name     = "AllowSpecificIPs"
    priority = 1

    action {
      allow {}
    }

    statement {
      ip_set_reference_statement {
        arn = aws_wafv2_ip_set.allowed.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AllowSpecificIPs"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project}-edge-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "${var.project}-edge-waf"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudFront for static and API (edge optimization)
resource "aws_cloudfront_origin_access_identity" "static" {
  comment = "OAI for ${var.project} static"
}

locals {
  api_origin_domain = replace(aws_api_gateway_stage.prod.invoke_url, "https://", "")
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled         = true
  is_ipv6_enabled = true

  origin {
    domain_name = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id   = "static-s3"
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.static.cloudfront_access_identity_path
    }
  }

  origin {
    domain_name = replace(local.api_origin_domain, "/prod", "")
    origin_id   = "api-gw"
    custom_origin_config {
      origin_protocol_policy = "https-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    origin_path = "/prod"
  }

  default_cache_behavior {
    target_origin_id       = "static-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  ordered_cache_behavior {
    path_pattern           = "/api*"
    target_origin_id       = "api-gw"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Host"]
      cookies {
        forward = "all"
      }
    }
    
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate { cloudfront_default_certificate = true }

  web_acl_id = aws_wafv2_web_acl.edge.arn

  tags = {
    Name        = "${var.project}-cdn"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# SNS for alerts (encrypted)
resource "aws_sns_topic" "alerts" {
  name              = "${var.project}-alerts"
  kms_master_key_id = aws_kms_key.data.arn

  tags = {
    Name        = "${var.project}-alerts"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_sns_topic_policy" "alerts" {
  arn    = aws_sns_topic.alerts.arn
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid: "AllowCloudWatch",
        Effect: "Allow",
        Principal: { Service: "cloudwatch.amazonaws.com" },
        Action: "SNS:Publish",
        Resource: aws_sns_topic.alerts.arn
      }
    ]
  })
}

# CloudTrail (logs managed policy usage and security changes)
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.project}-cloudtrail-${data.aws_caller_identity.current.account_id}-${var.aws_region}"

  tags = {
    Name        = "${var.project}-cloudtrail-bucket"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.logs.arn
    }
  }
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project}-${var.environment}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn

  tags = {
    Name        = "${var.project}-cloudtrail-logs"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role" "cloudtrail" {
  name = "${var.project}-cloudtrail-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "cloudtrail.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.project}-cloudtrail-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy" "cloudtrail" {
  name = "${var.project}-cloudtrail-policy"
  role = aws_iam_role.cloudtrail.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect: "Allow",
        Action: ["logs:CreateLogStream","logs:PutLogEvents","logs:CreateLogGroup"],
        Resource: "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

resource "aws_cloudtrail" "main" {
  name                          = "${var.project}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail.arn
  kms_key_id                    = aws_kms_key.logs.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  depends_on = [
    aws_s3_bucket_policy.cloudtrail,
    aws_iam_role_policy.cloudtrail
  ]

  tags = {
    Name        = "${var.project}-trail"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# GuardDuty in primary and secondary + findings to SNS via EventBridge
resource "aws_guardduty_detector" "primary" {
  enable = true
  finding_publishing_frequency = "SIX_HOURS"

  tags = {
    Name        = "${var.project}-gd-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}

resource "aws_guardduty_detector" "secondary" {
  provider = aws.secondary
  enable   = true
  finding_publishing_frequency = "SIX_HOURS"

  tags = {
    Name        = "${var.project}-gd-secondary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "${var.project}-guardduty-findings"
  description = "Route GuardDuty findings to SNS"
  event_pattern = jsonencode({
    source = ["aws.guardduty"],
    detail-type = ["GuardDuty Finding"]
  })

  tags = {
    Name        = "${var.project}-gd-rule"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_event_target" "guardduty_to_sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "sns"
  arn       = aws_sns_topic.alerts.arn
}

resource "aws_lambda_permission" "events_to_sns_placeholder" {
  count         = 0
  statement_id  = "placeholder"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "events.amazonaws.com"
}

# DevSecOps role and policy to review security config (advisory)
resource "aws_iam_role" "devsecops" {
  name = "${var.project}-devsecops-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root" },
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.project}-devsecops-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_policy" "security_change_guard" {
  name        = "${var.project}-security-change-guard"
  description = "Read-only policy for DevSecOps to review security configuration"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid: "ReadOnlySecurityResources",
        Effect: "Allow",
        Action: [
          "iam:Get*","iam:List*",
          "ec2:Describe*",
          "wafv2:Get*","wafv2:List*",
          "kms:Describe*","kms:List*","kms:GetKeyPolicy",
          "cloudtrail:Get*","cloudtrail:List*","cloudtrail:LookupEvents",
          "guardduty:Get*","guardduty:List*",
          "logs:Describe*","logs:Get*","logs:List*"
        ],
        Resource: "*"
      }
    ]
  })
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.address
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.app.name
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.app.function_name
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "static_bucket_name" {
  description = "Static assets S3 bucket"
  value       = aws_s3_bucket.static.bucket
}

output "sns_topic_arn" {
  description = "Alerts SNS topic ARN"
  value       = aws_sns_topic.alerts.arn
}

output "kms_data_key_id" {
  description = "KMS data key ID"
  value       = aws_kms_key.data.key_id
}

output "kms_logs_key_id" {
  description = "KMS logs key ID"
  value       = aws_kms_key.logs.key_id
}


