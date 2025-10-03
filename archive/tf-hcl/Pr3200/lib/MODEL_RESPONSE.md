### Reasoning Trace
---

I need to create a comprehensive Terraform script (`tap_stack.tf`) that implements a secure AWS infrastructure for a web application. I'll need to ensure it incorporates all the requirements while following AWS best practices for security, scalability, and compliance. Let me break down the requirements and start building the script.

First, I'll define the variables needed for the infrastructure:

```hcl
# Variable declarations with default values
variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-west-2"
}

variable "secondary_region" {
  description = "Secondary AWS region for certain resources"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "webapp"
}

variable "environment" {
  description = "Environment name for tagging"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner name for tagging"
  type        = string
  default     = "DevSecOps"
}

variable "allowed_ips" {
  description = "List of allowed IP ranges for HTTPS access"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"] # Default to private IP ranges
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "rds_instance_class" {
  description = "The instance class for RDS"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_database_name" {
  description = "The name of the database to create"
  type        = string
  default     = "appdb"
}

variable "rds_username" {
  description = "Username for the RDS database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "rds_password" {
  description = "Password for the RDS database"
  type        = string
  sensitive   = true
  # Default value should be provided via tfvars file or environment variables, not hardcoded
}

variable "rds_backup_retention_period" {
  description = "The number of days to retain backups"
  type        = number
  default     = 7
}

variable "ec2_instance_type" {
  description = "The instance type for EC2 instances"
  type        = string
  default     = "t3.micro"
}

variable "lambda_runtime" {
  description = "The runtime for Lambda functions"
  type        = string
  default     = "nodejs18.x" # Using the latest Node.js runtime as of now
}
```

Now, I'll define the networking components:

```hcl
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

# Availability Zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Private subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]

  tags = {
    Name        = "${var.project}-private-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Public subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project}-igw"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  tags = {
    Name        = "${var.project}-nat-eip"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name        = "${var.project}-nat"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.main]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project}-public-rt"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Route table for private subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name        = "${var.project}-private-rt"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Route table association with public subnets
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route table association with private subnets
resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# VPC Endpoint for S3
resource "aws_vpc_endpoint" "s3" {
  vpc_id          = aws_vpc.main.id
  service_name    = "com.amazonaws.${var.aws_region}.s3"
  route_table_ids = [aws_route_table.private.id]

  tags = {
    Name        = "${var.project}-s3-endpoint"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  log_destination      = aws_cloudwatch_log_group.flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  iam_role_arn         = aws_iam_role.flow_logs.arn

  tags = {
    Name        = "${var.project}-vpc-flow-logs"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch Log Group for Flow Logs
resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flow-logs/${var.project}"
  retention_in_days = 30

  tags = {
    Name        = "${var.project}-flow-logs"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM Role for Flow Logs
resource "aws_iam_role" "flow_logs" {
  name = "${var.project}-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        },
        Effect = "Allow",
        Sid    = ""
      }
    ]
  })

  tags = {
    Name        = "${var.project}-flow-logs-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM Policy for Flow Logs
resource "aws_iam_role_policy" "flow_logs" {
  name = "${var.project}-flow-logs-policy"
  role = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ],
        Effect   = "Allow",
        Resource = "*"
      }
    ]
  })
}
```

Now let's define the Security Groups:

```hcl
# Default security group with deny all
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.main.id

  # Deny all inbound traffic by default (empty ingress)
  
  # Deny all outbound traffic by default (empty egress)

  tags = {
    Name        = "${var.project}-default-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Security Group for web applications (HTTPS only from specific IPs)
resource "aws_security_group" "web" {
  name        = "${var.project}-web-sg"
  description = "Security group for web applications"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from specified IPs"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_ips
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project}-web-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Security Group for RDS instances
resource "aws_security_group" "rds" {
  name        = "${var.project}-rds-sg"
  description = "Security group for RDS instances"
  vpc_id      = aws_vpc.main.id

  # Allow inbound from EC2 instances only
  ingress {
    description     = "MySQL from EC2 instances"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  # No outbound traffic needed for RDS

  tags = {
    Name        = "${var.project}-rds-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Security Group for Lambda functions
resource "aws_security_group" "lambda" {
  name        = "${var.project}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  # No inbound traffic needed for Lambda
  
  # Allow outbound to RDS, S3 VPC endpoint and other services
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project}-lambda-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}
```

Now, let's define KMS keys for encryption:

```hcl
# KMS key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project} encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "Enable IAM User Permissions",
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Action   = "kms:*",
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key",
        Effect = "Allow",
        Principal = {
          AWS = [
            aws_iam_role.ec2_role.arn,
            aws_iam_role.lambda_role.arn
          ]
        },
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project}-kms-key"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# KMS key alias
resource "aws_kms_alias" "main" {
  name          = "alias/${var.project}-key"
  target_key_id = aws_kms_key.main.key_id
}

# Current caller identity
data "aws_caller_identity" "current" {}
```

Let's define the S3 bucket for static assets and CloudFront:

```hcl
# S3 bucket for static assets
resource "aws_s3_bucket" "static_assets" {
  bucket = "${var.project}-static-assets-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.project}-static-assets"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket                  = aws_s3_bucket.static_assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront origin access identity
resource "aws_cloudfront_origin_access_identity" "static_assets" {
  comment = "Origin access identity for ${var.project} static assets"
}

# S3 bucket policy for CloudFront
resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal",
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.static_assets.id}"
        },
        Action   = "s3:GetObject",
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
      }
    ]
  })
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "static_assets" {
  origin {
    domain_name = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.static_assets.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.static_assets.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_100"

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name        = "${var.project}-cloudfront"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}
```

Let's define the IAM roles and policies:

```hcl
# IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.project}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = "ec2.amazonaws.com"
        },
        Effect = "Allow",
        Sid    = ""
      }
    ]
  })

  tags = {
    Name        = "${var.project}-ec2-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM policy for EC2 instances
resource "aws_iam_policy" "ec2_policy" {
  name        = "${var.project}-ec2-policy"
  description = "Policy for ${var.project} EC2 instances"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Effect = "Allow",
        Resource = [
          aws_s3_bucket.static_assets.arn,
          "${aws_s3_bucket.static_assets.arn}/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        Effect   = "Allow",
        Resource = aws_kms_key.main.arn
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Effect   = "Allow",
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = {
    Name        = "${var.project}-ec2-policy"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Attach policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# IAM instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.project}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = "lambda.amazonaws.com"
        },
        Effect = "Allow",
        Sid    = ""
      }
    ]
  })

  tags = {
    Name        = "${var.project}-lambda-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM policy for Lambda functions
resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.project}-lambda-policy"
  description = "Policy for ${var.project} Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ],
        Effect = "Allow",
        Resource = [
          aws_s3_bucket.static_assets.arn,
          "${aws_s3_bucket.static_assets.arn}/*"
        ]
      },
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        Effect   = "Allow",
        Resource = aws_dynamodb_table.app_data.arn
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        Effect   = "Allow",
        Resource = aws_kms_key.main.arn
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Effect   = "Allow",
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ],
        Effect   = "Allow",
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project}-lambda-policy"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Attach policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# IAM role for DevSecOps approval
resource "aws_iam_role" "devsecops_role" {
  name = "${var.project}-devsecops-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Effect = "Allow",
        Sid    = ""
      }
    ]
  })

  tags = {
    Name        = "${var.project}-devsecops-role"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# IAM policy for DevSecOps approval
resource "aws_iam_policy" "devsecops_policy" {
  name        = "${var.project}-devsecops-policy"
  description = "Policy for ${var.project} DevSecOps approval"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "iam:GetPolicyVersion",
          "iam:GetPolicy",
          "iam:ListPolicyVersions",
          "iam:GetRole",
          "iam:ListRolePolicies",
          "iam:GetRolePolicy",
          "iam:ListAttachedRolePolicies",
          "kms:DescribeKey",
          "kms:GetKeyPolicy",
          "kms:ListKeyPolicies",
          "kms:ListResourceTags",
          "waf:GetWebACL",
          "waf:GetRule",
          "waf:ListRules",
          "wafv2:GetWebACL",
          "wafv2:ListRuleGroups",
          "wafv2:ListWebACLs",
          "cloudfront:GetDistribution",
          "cloudfront:GetDistributionConfig",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSecurityGroupRules",
          "s3:GetEncryptionConfiguration",
          "s3:GetBucketPolicy",
          "s3:GetBucketAcl",
          "s3:GetBucketPublicAccessBlock"
        ],
        Effect   = "Allow",
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project}-devsecops-policy"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Attach policy to DevSecOps role
resource "aws_iam_role_policy_attachment" "devsecops_policy_attachment" {
  role       = aws_iam_role.devsecops_role.name
  policy_arn = aws_iam_policy.devsecops_policy.arn
}
```

Now, let's define the DynamoDB table:

```hcl
# DynamoDB table
resource "aws_dynamodb_table" "app_data" {
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
    kms_key_arn = aws_kms_key.main.arn
  }

  tags = {
    Name        = "${var.project}-app-data"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch alarm for DynamoDB unusual patterns
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttled_requests" {
  alarm_name          = "${var.project}-dynamodb-throttled-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alarm when throttled requests exceed threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.app_data.name
  }

  tags = {
    Name        = "${var.project}-dynamodb-alarm"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}
```

Let's define the RDS database:

```hcl
# RDS subnet group
resource "aws_db_subnet_group" "main" {
  name        = "${var.project}-db-subnet-group"
  description = "DB subnet group for ${var.project}"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name        = "${var.project}-db-subnet-group"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# RDS parameter group
resource "aws_db_parameter_group" "main" {
  name        = "${var.project}-db-parameter-group"
  family      = "mysql8.0"
  description = "DB parameter group for ${var.project}"

  parameter {
    name  = "character_set_server"
    value = "utf8"
  }

  parameter {
    name  = "character_set_client"
    value = "utf8"
  }

  tags = {
    Name        = "${var.project}-db-parameter-group"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# RDS instance
resource "aws_db_instance" "main" {
  identifier                  = "${var.project}-db"
  allocated_storage           = 20
  storage_type                = "gp2"
  engine                      = "mysql"
  engine_version              = "8.0"
  instance_class              = var.rds_instance_class
  db_name                     = var.rds_database_name
  username                    = var.rds_username
  password                    = var.rds_password
  parameter_group_name        = aws_db_parameter_group.main.name
  db_subnet_group_name        = aws_db_subnet_group.main.name
  vpc_security_group_ids      = [aws_security_group.rds.id]
  multi_az                    = true
  storage_encrypted           = true
  kms_key_id                  = aws_kms_key.main.arn
  backup_retention_period     = var.rds_backup_retention_period
  copy_tags_to_snapshot       = true
  deletion_protection         = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${var.project}-db-final-snapshot"
  publicly_accessible         = false
  auto_minor_version_upgrade  = true
  allow_major_version_upgrade = false
  apply_immediately           = false
  maintenance_window          = "sun:03:00-sun:04:00"
  backup_window               = "02:00-03:00"
  
  tags = {
    Name        = "${var.project}-db"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch alarm for RDS CPU utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project}-rds-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alarm when CPU exceeds 80%"
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
```

Let's define the Lambda function:

```hcl
# Lambda function
resource "aws_lambda_function" "app" {
  function_name    = "${var.project}-app"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = var.lambda_runtime
  filename         = "${path.module}/function.zip" # This is a placeholder, you'll need to create this file
  source_code_hash = filebase64sha256("${path.module}/function.zip")

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.app_data.name,
      RDS_ENDPOINT   = aws_db_instance.main.endpoint,
      RDS_DATABASE   = aws_db_instance.main.db_name,
      RDS_USERNAME   = aws_db_instance.main.username
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

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.app.function_name}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project}-lambda-logs"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alarm when Lambda errors occur"
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
```

Let's define the API Gateway:

```hcl
# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project}-api"
  description = "API for ${var.project}"
  
  endpoint_configuration {
    types = ["EDGE"]
  }

  tags = {
    Name        = "${var.project}-api"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# API Gateway resource
resource "aws_api_gateway_resource" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "resource"
}

# API Gateway method
resource "aws_api_gateway_method" "main" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.main.id
  http_method   = "GET"
  authorization_type = "NONE"
}

# API Gateway integration
resource "aws_api_gateway_integration" "main" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.main.id
  http_method             = aws_api_gateway_method.main.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.app.invoke_arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [aws_api_gateway_integration.main]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }
}

# WAF Web ACL for API Gateway
resource "aws_wafv2_web_acl" "api" {
  name        = "${var.project}-api-waf"
  description = "WAF Web ACL for ${var.project} API"
  scope       = "REGIONAL"

  default_action {
    block {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

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
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AllowSpecificIPs"
    priority = 2

    action {
      allow {}
    }

    statement {
      ip_set_reference_statement {
        arn = aws_wafv2_ip_set.allowed_ips.arn
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
    metric_name                = "${var.project}-api-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "${var.project}-api-waf"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# WAF IP Set for allowed IPs
resource "aws_wafv2_ip_set" "allowed_ips" {
  name               = "${var.project}-allowed-ips"
  description        = "Allowed IP addresses"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = var.allowed_ips

  tags = {
    Name        = "${var.project}-allowed-ips"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# WAF Web ACL Association for API Gateway
resource "aws_wafv2_web_acl_association" "api" {
  resource_arn = aws_api_gateway_stage.main.arn
  web_acl_arn  = aws_wafv2_web_acl.api.arn
}

# API Gateway stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format          = jsonencode({
      requestId               = "$context.requestId",
      sourceIp                = "$context.identity.sourceIp",
      requestTime             = "$context.requestTime",
      protocol                = "$context.protocol",
      httpMethod              = "$context.httpMethod",
      resourcePath            = "$context.resourcePath",
      routeKey                = "$context.routeKey",
      status                  = "$context.status",
      responseLength          = "$context.responseLength",
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }

  tags = {
    Name        = "${var.project}-api-stage"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project}-api-gateway-logs"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}
```

Let's define an EC2 instance for web application:

```hcl
# EC2 instance for web application
resource "aws_instance" "web" {
  ami                    = "ami-0c55b159cbfafe1f0" # Amazon Linux 2 AMI, you should use a more specific AMI
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  key_name               = aws_key_pair.main.key_name

  root_block_device {
    volume_type           = "gp2"
    volume_size           = 20
    delete_on_termination = true
    encrypted             = true
    kms_key_id            = aws_kms_key.main.arn
  }

  tags = {
    Name        = "${var.project}-web-instance"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Key pair for EC2 instances
resource "aws_key_pair" "main" {
  key_name   = "${var.project}-key"
  public_key = "ssh-rsa AAAA... user@example.com" # Replace with your public key

  tags = {
    Name        = "${var.project}-key-pair"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# CloudWatch alarm for EC2 CPU utilization
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  alarm_name          = "${var.project}-ec2-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alarm when CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.web.id
  }

  tags = {
    Name        = "${var.project}-ec2-cpu-alarm"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}
```

Let's define SNS topic for alerts:

```hcl
# SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts"
  
  kms_master_key_id = aws_kms_key.main.arn

  tags = {
    Name        = "${var.project}-alerts"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# SNS topic policy
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowCloudWatchAlarms",
        Effect = "Allow",
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        },
        Action   = "SNS:Publish",
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Sid    = "AllowGuardDuty",
        Effect = "Allow",
        Principal = {
          Service = "guardduty.amazonaws.com"
        },
        Action   = "SNS:Publish",
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}
```

Now let's set up GuardDuty:

```hcl
# GuardDuty detector in primary region
resource "aws_guardduty_detector" "primary" {
  enable = true

  finding_publishing_frequency = "SIX_HOURS"

  tags = {
    Name        = "${var.project}-guardduty-primary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# GuardDuty detector in secondary region
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}

resource "aws_guardduty_detector" "secondary" {
  provider = aws.secondary
  enable   = true

  finding_publishing_frequency = "SIX_HOURS"

  tags = {
    Name        = "${var.project}-guardduty-secondary"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# GuardDuty publishing destination
resource "aws_guardduty_publishing_destination" "primary" {
  detector_id     = aws_guardduty_detector.primary.id
  destination_arn = aws_s3_bucket.guardduty_findings.arn
  kms_key_arn     = aws_kms_key.main.arn
}

# S3 bucket for GuardDuty findings
resource "aws_s3_bucket" "guardduty_findings" {
  bucket = "${var.project}-guardduty-findings-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.project}-guardduty-findings"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# S3 bucket versioning for GuardDuty findings
resource "aws_s3_bucket_versioning" "guardduty_findings" {
  bucket = aws_s3_bucket.guardduty_findings.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption for GuardDuty findings
resource "aws_s3_bucket_server_side_encryption_configuration" "guardduty_findings" {
  bucket = aws_s3_bucket.guardduty_findings.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket public access block for GuardDuty findings
resource "aws_s3_bucket_public_access_block" "guardduty_findings" {
  bucket                  = aws_s3_bucket.guardduty_findings.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for GuardDuty findings
resource "aws_s3_bucket_policy" "guardduty_findings" {
  bucket = aws_s3_bucket.guardduty_findings.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowGuardDutyToPutObjects",
        Effect = "Allow",
        Principal = {
          Service = "guardduty.amazonaws.com"
        },
        Action = "s3:PutObject",
        Resource = "${aws_s3_bucket.guardduty_findings.arn}/*"
      },
      {
        Sid    = "AllowGuardDutyToGetBucketLocation",
        Effect = "Allow",
        Principal = {
          Service = "guardduty.amazonaws.com"
        },
        Action = "s3:GetBucketLocation",
        Resource = aws_s3_bucket.guardduty_findings.arn
      }
    ]
  })
}
```

Finally, let's define the outputs:

```hcl
# Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "rds_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB table"
  value       = aws_dynamodb_table.app_data.name
}

output "lambda_function_name" {
  description = "The name of the Lambda function"
  value       = aws_lambda_function.app.function_name
}

output "api_gateway_invoke_url" {
  description = "The invoke URL of the API Gateway"
  value       = "${aws_api_gateway_deployment.main.invoke_url}${aws_api_gateway_stage.main.stage_name}"
}

output "cloudfront_distribution_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.domain_name
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.static_assets.bucket
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic"
  value       = aws_sns_topic.alerts.arn
}

output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = aws_kms_key.main.id
}

output "waf_web_acl_id" {
  description = "The ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.api.id
}

output "guardduty_detector_id" {
  description = "The ID of the GuardDuty detector"
  value       = aws_guardduty_detector.primary.id
}
```

Now I have all the components defined for the `tap_stack.tf` file. Let me consolidate everything into a single comprehensive file:

This file includes:
1. Variable declarations with default values
2. Networking (VPC, subnets, route tables, etc.)
3. Security groups with proper restrictions
4. IAM roles and policies with least privilege
5. KMS keys for encryption
6. S3 buckets with encryption and versioning
7. CloudFront distribution
8. DynamoDB table with encryption
9. RDS instance in private subnet with encryption
10. Lambda function with proper IAM role
11. API Gateway with WAF
12. EC2 instance with encrypted EBS
13. SNS topic with encryption
14. GuardDuty with publishing destination
15. CloudWatch alarms and logs
16. Outputs for all key resources

The script follows AWS best practices for security, including:
- Default deny for security groups
- Encryption at rest for all data stores
- Encryption in transit
- Least privilege for IAM roles
- WAF for API Gateway
- GuardDuty for threat detection
- CloudWatch for monitoring
- VPC Flow Logs for network monitoring
- Multi-AZ for RDS
- Private subnets for sensitive resources
### Answer 
---

# Secure AWS Infrastructure Terraform Configuration

I'll create a comprehensive Terraform file (`tap_stack.tf`) implementing a secure infrastructure for a web application on AWS, following all security best practices and requirements.

```hcl
# Variables
variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-west-2"
  validation {
    condition     = var.aws_region == "us-west-2" || var.aws_region == "us-east-1"
    error_message = "Only us-west-2 (primary) and us-east-1 (secondary) regions are allowed."
  }
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
  description = "List of allowed IP CIDR ranges for HTTPS access"
  type        = list(string)
  default     = ["10.0.0.0/8", "192.168.0.0/16"] # Replace with actual IP ranges
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "db_name" {
  description = "The name of the RDS database"
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
  default     = null # Should be set via environment variable or tfvars
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC and Networking
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

# Public subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Private subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.project}-private-subnet-${count.index + 1}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project}-igw"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  
  tags = {
    Name        = "${var.project}-nat-eip"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name        = "${var.project}-nat"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
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

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name        = "${var.project}-private-rt"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Route table associations
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

# VPC Endpoint for S3 (keep traffic within AWS network)
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

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name        = "${var.project}-flow-log"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/flow-logs/${var.project}-${var.environment}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn

  tags = {
    Name        = "${var.project}-flow-logs"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# Security Groups
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.main.id

  # Empty ingress and egress means deny all by default
  
  tags = {
    Name        = "${var.project}-default-sg"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}