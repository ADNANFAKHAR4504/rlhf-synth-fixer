# IAM User with MFA requirement
data "aws_iam_user" "app_user" {
  user_name = "${var.project_name}-app-user"
}

data "aws_iam_policy" "mfa_policy" {
  name = "${var.project_name}-mfa-policy"
}

resource "aws_iam_user_policy_attachment" "mfa_attachment" {
  user       = data.aws_iam_user.app_user.user_name
  policy_arn = data.aws_iam_policy.mfa_policy.arn
}

# IAM Role for EC2
resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-ec2-role"
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
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-ec2-instance-profile"
  role = aws_iam_role.ec2.name
}
