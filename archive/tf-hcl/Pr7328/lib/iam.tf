# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2_role" {
  name = "ec2-app-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name    = "ec2-app-role-${var.environment_suffix}"
    DR-Role = "both"
  })
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "cloudwatch-logs-policy-${var.environment_suffix}"
  role = aws_iam_role.ec2_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for S3 Access
resource "aws_iam_role_policy" "s3_access" {
  name = "s3-access-policy-${var.environment_suffix}"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*",
          aws_s3_bucket.secondary.arn,
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-app-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2_role.name

  tags = merge(local.common_tags, {
    Name    = "ec2-app-profile-${var.environment_suffix}"
    DR-Role = "both"
  })
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup_role" {
  name = "backup-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "backup.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name    = "backup-role-${var.environment_suffix}"
    DR-Role = "both"
  })
}

# IAM Policy Attachment for Backup Service
resource "aws_iam_role_policy_attachment" "backup_service" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# IAM Policy Attachment for Backup Restores
resource "aws_iam_role_policy_attachment" "backup_restores" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}
