########################
# S3 Bucket with AES-256 Encryption
########################

resource "aws_s3_bucket" "secure_prod" {
  bucket = "${var.bucket_name}-${var.environment}"
  tags   = merge(var.bucket_tags, { Environment = var.environment })
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

output "bucket_tags" {
  value = aws_s3_bucket.secure_prod.tags
}

########################
# IAM Roles and Policies for EC2
########################

resource "aws_iam_role" "ec2_role" {
  name = "secure-ec2-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.bucket_tags, { Environment = var.environment })
}

# Policy for EC2 to write to CloudWatch Logs
resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name        = "secure-cloudwatch-logs-policy-${var.environment}"
  description = "Allow EC2 to write logs to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = merge(var.bucket_tags, { Environment = var.environment })
}

# Policy for EC2 to access S3 buckets
resource "aws_iam_policy" "s3_access_policy" {
  name        = "secure-s3-access-policy-${var.environment}"
  description = "Allow EC2 to access S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject"
        ],
        Resource = [
          "arn:aws:s3:::*"
        ]
      }
    ]
  })

  tags = merge(var.bucket_tags, { Environment = var.environment })
}

# Attach policies to EC2 role
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

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "secure-ec2-profile-${var.environment}"
  role = aws_iam_role.ec2_role.name

  tags = merge(var.bucket_tags, { Environment = var.environment })
}

########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
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

########################
# S3 Bucket
########################


########################
# Network ACLs (NACLs) - Only allow TCP ports 443 and 22
########################

resource "aws_network_acl" "secure_prod" {
  vpc_id = aws_vpc.main.id

  # Allow inbound HTTPS (443)
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow inbound SSH (22)
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 22
    to_port    = 22
  }

  # Deny all other inbound traffic
  ingress {
    protocol   = "-1"
    rule_no    = 120
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 65535
  }

  # Allow outbound HTTPS (443)
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow outbound SSH (22)
  egress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 22
    to_port    = 22
  }

  # Deny all other outbound traffic
  egress {
    protocol   = "-1"
    rule_no    = 120
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 65535
  }

  tags = merge(var.bucket_tags, { Environment = var.environment })
}

########################
# RDS Password Storage in AWS Secrets Manager
########################

resource "random_password" "rds_password" {
  length  = 16
  special = true
}

resource "aws_secretsmanager_secret" "rds_password" {
  name        = "secure-rds-password-${var.environment}"
  description = "RDS instance password for secure production environment"
  tags        = merge(var.bucket_tags, { Environment = var.environment })
}

resource "aws_secretsmanager_secret_version" "rds_password_version" {
  secret_id     = aws_secretsmanager_secret.rds_password.id
  secret_string = jsonencode({
    username = "admin",
    password = random_password.rds_password.result,
    port     = 3306
  })
}

########################
# CloudWatch Dashboard with EC2, RDS, and Auto Scaling Widgets
########################

resource "aws_cloudwatch_dashboard" "secure_prod" {
  dashboard_name = "secure-dashboard-${var.environment}"
  dashboard_body = jsonencode({
    widgets = [
      {
        "type": "metric",
        "x": 0,
        "y": 0,
        "width": 12,
        "height": 6,
        "properties": {
          "metrics": [
            [ "AWS/EC2", "CPUUtilization", "InstanceId", "i-xxxxxxxxxxxxxxxxx" ]
          ],
          "period": 300,
          "stat": "Average",
          "region": var.aws_region,
          "title": "EC2 CPU Utilization"
        }
      },
      {
        "type": "metric",
        "x": 12,
        "y": 0,
        "width": 12,
        "height": 6,
        "properties": {
          "metrics": [
            [ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "secure-prod-db" ]
          ],
          "period": 300,
          "stat": "Average",
          "region": var.aws_region,
          "title": "RDS CPU Utilization"
        }
      },
      {
        "type": "metric",
        "x": 0,
        "y": 6,
        "width": 24,
        "height": 6,
        "properties": {
          "metrics": [
            [ "AWS/AutoScaling", "GroupInServiceInstances", "AutoScalingGroupName", "secure-prod-asg" ]
          ],
          "period": 300,
          "stat": "Average",
          "region": var.aws_region,
          "title": "Auto Scaling Group In-Service Instances"
        }
      }
    ]
  })
  tags = merge(var.bucket_tags, { Environment = var.environment })
}
