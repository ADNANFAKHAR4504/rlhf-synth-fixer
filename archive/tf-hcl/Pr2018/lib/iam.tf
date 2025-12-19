resource "aws_iam_role" "ec2_role" {
  name = "${var.environment_tag}-ec2-role-${random_id.deployment.hex}"
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
    Name        = "${var.environment_tag}-ec2-role-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment_tag}-ec2-profile-${random_id.deployment.hex}"
  role = aws_iam_role.ec2_role.name
  tags = {
    Name        = "${var.environment_tag}-ec2-profile-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

resource "aws_iam_role_policy" "ec2_s3_policy" {
  name = "${var.environment_tag}-ec2-s3-policy-${random_id.deployment.hex}"
  role = aws_iam_role.ec2_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.app_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.app_data.arn
      }
    ]
  })
}