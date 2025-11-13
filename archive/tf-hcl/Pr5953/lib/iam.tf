# iam.tf - IAM roles and policies for cross-account access

# -----------------------------------------------------------------------------
# IAM ROLE FOR CROSS-ACCOUNT VPC PEERING
# -----------------------------------------------------------------------------

# IAM role for cross-account VPC peering operations
resource "aws_iam_role" "vpc_peering" {
  provider = aws.primary
  name     = "vpc-peering-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = var.partner_account_id != "" ? "arn:aws:iam::${var.partner_account_id}:root" : data.aws_caller_identity.current.arn
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${local.project_name}-${var.environment_suffix}"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "vpc-peering-role-${var.environment_suffix}"
  })
}

# IAM policy for VPC peering with least privilege
resource "aws_iam_policy" "vpc_peering" {
  provider    = aws.primary
  name        = "vpc-peering-policy-${var.environment_suffix}"
  description = "Least privilege policy for VPC peering operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowVPCPeeringOperations"
        Effect = "Allow"
        Action = [
          "ec2:DescribeVpcPeeringConnections",
          "ec2:DescribeVpcs",
          "ec2:DescribeRouteTables",
          "ec2:DescribeSubnets"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowPeeringAccept"
        Effect = "Allow"
        Action = [
          "ec2:AcceptVpcPeeringConnection",
          "ec2:ModifyVpcPeeringConnectionOptions"
        ]
        Resource = [
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:vpc-peering-connection/*",
          "arn:aws:ec2:${var.partner_region}:${data.aws_caller_identity.current.account_id}:vpc-peering-connection/*"
        ]
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Project" = local.project_name
          }
        }
      },
      {
        Sid    = "DenyDangerousOperations"
        Effect = "Deny"
        Action = [
          "ec2:DeleteVpcPeeringConnection",
          "ec2:RejectVpcPeeringConnection",
          "ec2:CreateRoute",
          "ec2:DeleteRoute"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:PrincipalArn" = aws_iam_role.vpc_peering.arn
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "vpc-peering-policy-${var.environment_suffix}"
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "vpc_peering" {
  provider   = aws.primary
  role       = aws_iam_role.vpc_peering.name
  policy_arn = aws_iam_policy.vpc_peering.arn
}

# -----------------------------------------------------------------------------
# IAM ROLE FOR FLOW LOGS
# -----------------------------------------------------------------------------

# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  provider = aws.primary
  name     = "vpc-flow-logs-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "vpc-flow-logs-role-${var.environment_suffix}"
  })
}

# IAM policy for Flow Logs to write to CloudWatch Logs
resource "aws_iam_policy" "flow_logs" {
  provider    = aws.primary
  name        = "vpc-flow-logs-policy-${var.environment_suffix}"
  description = "Policy for VPC Flow Logs to write to CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowFlowLogsWrite"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/vpc/peering/*"
      },
      {
        Sid    = "DenyUnauthorizedAccess"
        Effect = "Deny"
        Action = [
          "logs:DeleteLogGroup",
          "logs:DeleteLogStream"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "vpc-flow-logs-policy-${var.environment_suffix}"
  })
}

# Attach policy to Flow Logs role
resource "aws_iam_role_policy_attachment" "flow_logs" {
  provider   = aws.primary
  role       = aws_iam_role.flow_logs.name
  policy_arn = aws_iam_policy.flow_logs.arn
}