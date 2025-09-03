resource "aws_iam_role" "ec2_secrets_role" {
  name = "${var.project}-ec2-secrets-role"
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
  tags = var.common_tags
}

resource "aws_iam_policy" "ec2_secrets_policy" {
  name        = "${var.project}-ec2-secrets-policy"
  description = "Policy to allow EC2 to read specific secrets"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.secret_arn
      }
    ]
  })
  tags = var.common_tags
}


resource "aws_iam_role_policy_attachment" "ec2_secrets_attachment" {
  role       = aws_iam_role.ec2_secrets_role.name
  policy_arn = aws_iam_policy.ec2_secrets_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project}-ec2-profile"
  role = aws_iam_role.ec2_secrets_role.name
  tags = var.common_tags
}
