```hcl
# VPC Configuration
resource "aws_vpc" "web_app_vpc" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "web-app-vpc-274802" }
}

resource "aws_subnet" "public_subnet" {
  vpc_id            = aws_vpc.web_app_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-2a"
  tags = { Name = "public-subnet-274802" }
}

# Security Groups
resource "aws_security_group" "web_sg" {
  vpc_id = aws_vpc.web_app_vpc.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "web-sg-274802" }
}

# S3 with KMS Encryption
resource "aws_kms_key" "s3_encryption" {
  description = "S3 bucket encryption key"
  tags = { Name = "s3-kms-key-274802" }
}

resource "aws_s3_bucket" "app_storage" {
  bucket = "webapp-bucket-274802"
  acl    = "private"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.s3_encryption.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }

  versioning { enabled = true }
  tags = { Name = "webapp-s3-274802" }
}

# IAM Roles
resource "aws_iam_role" "ecs_task_role" {
  name = "ecs-task-role-274802"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "s3_read_policy" {
  name = "s3-read-policy-274802"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = ["s3:GetObject"]
      Resource = aws_s3_bucket.app_storage.arn
      Effect = "Allow"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "attach_s3_policy" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.s3_read_policy.arn
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "unauthorized_access" {
  alarm_name          = "unauthorized-access-alarm-274802"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when unauthorized API calls detected"
}

resource "aws_cloudwatch_metric_alarm" "iam_policy_changes" {
  alarm_name          = "iam-policy-change-alarm-274802"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "CreatePolicy"
  namespace           = "AWS/IAM"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when IAM policies are created/modified"
}

# Outputs
output "vpc_id" {
  value = aws_vpc.web_app_vpc.id
}

output "s3_bucket_name" {
  value = aws_s3_bucket.app_storage.bucket
}
```

This configuration establishes:

1. **VPC Network**: Isolated network with public subnet
2. **Security**: HTTPS-only security group
3. **Storage**: S3 bucket with KMS encryption
4. **Permissions**: ECS task role with least-privilege S3 access
5. **Monitoring**: CloudWatch alarms for unauthorized access and IAM changes

The solution follows AWS best practices while maintaining operational simplicity. All resources use unique names with "274802" prefix and include proper tagging for identification. The IAM policy follows least privilege by only granting S3 read access.