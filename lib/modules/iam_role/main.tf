# modules/iam_role/main.tf
resource "aws_iam_role" "main" {
  name_prefix = "${var.role_name_prefix}-${var.environment}-role-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = var.assume_role_services[0]
      }
    }]
  })
  
  tags = var.role_tags
}

resource "aws_iam_policy" "s3_access" {
  name_prefix = "${var.policy_name_prefix}-${var.environment}-policy-"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = var.s3_permissions
      Effect   = "Allow"
      Resource = [var.bucket_arn, "${var.bucket_arn}/*"]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "attach" {
  role       = aws_iam_role.main.name
  policy_arn = aws_iam_policy.s3_access.arn
}

output "role_arn" {
  value = aws_iam_role.main.arn
}
