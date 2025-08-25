resource "aws_kms_key" "pipeline_key" {
  description             = "KMS key for CI/CD pipeline encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableIAMUserPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCodePipelineAccess"
        Effect = "Allow"
        Principal = {
          Service = ["codepipeline.amazonaws.com", "codebuild.amazonaws.com"]
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-pipeline-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "pipeline_key" {
  name          = "alias/${var.project_name}-${var.environment_suffix}-pipeline"
  target_key_id = aws_kms_key.pipeline_key.key_id
}