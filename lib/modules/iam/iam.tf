resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-ec2-instance-profile"
  role        = aws_iam_role.ec2.name
}

resource "aws_iam_role" "ec2" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })

  tags = {
    Name        = "${var.project_name}-ec2-role"
    Project     = var.project_name
    Environment = var.environment
  }
}


resource "random_pet" "suffix" {
  length = 2
}

resource "aws_iam_user" "main" {
  count = length(var.iam_users)
  name  = "${var.iam_users[count.index]}-${random_pet.suffix.id}"
}

resource "aws_iam_user_login_profile" "main" {
  count                   = length(var.iam_users)
  user                    = aws_iam_user.main[count.index].name
  password_reset_required = true
}

resource "aws_iam_policy" "mfa_enforcement" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-mfa-enforcement-policy"
  description = "Enforce MFA for all IAM users"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAllUsersToListAccounts"
        Effect = "Allow"
        Action = [
          "iam:ListAccountAliases",
          "iam:ListUsers",
          "iam:GetAccountSummary",
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowIndividualUserToSeeAndManageOnlyTheirOwnAccountInformation"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser",
          "iam:CreateAccessKey",
          "iam:UpdateAccessKey",
          "iam:DeleteAccessKey",
          "iam:ListAccessKeys",
          "iam:CreateLoginProfile",
          "iam:UpdateLoginProfile",
          "iam:DeleteLoginProfile",
          "iam:GetLoginProfile",
          "iam:CreateSSHPublicKey",
          "iam:UpdateSSHPublicKey",
          "iam:DeleteSSHPublicKey",
          "iam:ListSSHPublicKeys",
          "iam:UploadSSHPublicKey",
          "iam:CreateServiceSpecificCredential",
          "iam:UpdateServiceSpecificCredential",
          "iam:DeleteServiceSpecificCredential",
          "iam:ListServiceSpecificCredentials",
          "iam:ResetServiceSpecificCredential",
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice",
          "iam:ListMFADevices",
          "iam:DeactivateMFADevice",
          "iam:DeleteVirtualMFADevice",
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "BlockMostAccessUnlessSignedInWithMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken",
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      },
    ]
  })
}

resource "aws_iam_user_policy_attachment" "mfa_enforcement" {
  count      = length(var.iam_users)
  user       = aws_iam_user.main[count.index].name
  policy_arn = aws_iam_policy.mfa_enforcement.arn
}

resource "aws_iam_role" "flow_log" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_policy" "flow_log" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-flow-log-policy"
  description = "Allow VPC Flow Logs to publish to CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "flow_log" {
  role       = aws_iam_role.flow_log.name
  policy_arn = aws_iam_policy.flow_log.arn
}

resource "aws_iam_policy" "s3_access" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-s3-access-policy"
  description = "Allow access to S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:s3:::*",
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.s3_access.arn
}
