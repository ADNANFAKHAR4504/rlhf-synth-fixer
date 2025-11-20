# EMR Service Role
resource "aws_iam_role" "emr_service_role" {
  name = "${local.bucket_prefix}-emr-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "elasticmapreduce.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "emr_service_role" {
  role       = aws_iam_role.emr_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEMRServicePolicy_v2"
}

# S3 permissions for EMR service role to access TLS certificate and other security configurations
resource "aws_iam_role_policy" "emr_service_s3_permissions" {
  name = "${local.bucket_prefix}-emr-service-s3-permissions"
  role = aws_iam_role.emr_service_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "${aws_s3_bucket.logs.arn}/security/*",
          "${aws_s3_bucket.logs.arn}/bootstrap/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.logs.arn
        ]
      }
    ]
  })
}

# Additional EC2 permissions for EMR to create managed security groups in public subnets
# Note: EMR requires these permissions to create its own managed security groups when
# launching clusters in public subnets. The managed policy may not include all required
# permissions for public subnet deployments.
resource "aws_iam_role_policy" "emr_service_ec2_permissions" {
  name = "${local.bucket_prefix}-emr-service-ec2-permissions"
  role = aws_iam_role.emr_service_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSecurityGroup",
          "ec2:DescribeSecurityGroups",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:DeleteSecurityGroup",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeInstances",
          "ec2:DescribeImages",
          "ec2:DescribeAccountAttributes",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeKeyPairs",
          "ec2:DescribeRouteTables",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeNatGateways",
          "ec2:DescribeNetworkAcls",
          "ec2:ModifyNetworkInterfaceAttribute",
          "ec2:AttachNetworkInterface",
          "ec2:DetachNetworkInterface",
          "ec2:CreateTags",
          "ec2:DescribeTags",
          "ec2:RunInstances",
          "ec2:TerminateInstances",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:ModifyInstanceAttribute",
          "ec2:AssociateAddress",
          "ec2:DisassociateAddress",
          "ec2:AllocateAddress",
          "ec2:ReleaseAddress",
          "ec2:CreateVolume",
          "ec2:DeleteVolume",
          "ec2:AttachVolume",
          "ec2:DetachVolume",
          "ec2:DescribeVolumes",
          "ec2:DescribeVolumeStatus",
          "ec2:DescribeSnapshots",
          "ec2:CreateSnapshot",
          "ec2:DeleteSnapshot",
          "ec2:ModifyVolumeAttribute",
          "iam:PassRole"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.emr_ec2_role.arn,
          aws_iam_role.emr_autoscaling_role.arn
        ]
      }
    ]
  })
}

# KMS permissions for EMR service role to use default EBS encryption key
resource "aws_iam_role_policy" "emr_service_ebs_kms" {
  name = "${local.bucket_prefix}-emr-service-ebs-kms"
  role = aws_iam_role.emr_service_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:DescribeKey",
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant"
        ]
        Resource = "arn:aws:kms:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:key/*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "ec2.${data.aws_region.current.id}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

# EMR EC2 Instance Profile Role
resource "aws_iam_role" "emr_ec2_role" {
  name = "${local.bucket_prefix}-emr-ec2-role"

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

  tags = local.common_tags
}

# Least-privilege S3 access policy
resource "aws_iam_role_policy" "emr_s3_access" {
  name = "${local.bucket_prefix}-emr-s3-access"
  role = aws_iam_role.emr_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListAndLocateDataBuckets"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.raw.arn,
          aws_s3_bucket.curated.arn,
          aws_s3_bucket.logs.arn
        ]
      },
      {
        Sid    = "ReadRawTradingData"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.raw.arn}/*"
      },
      {
        Sid    = "WriteCuratedAnalyticsData"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.curated.arn}/*"
      },
      {
        Sid    = "PublishClusterLogs"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.logs.arn}/bootstrap/*",
          "${aws_s3_bucket.logs.arn}/emr-logs/*"
        ]
      },
      {
        Sid    = "ReadSecurityConfigurations"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "${aws_s3_bucket.logs.arn}/security/*"
        ]
      }
    ]
  })
}

# CloudWatch Logs policy
resource "aws_iam_role_policy" "emr_cloudwatch_logs" {
  name = "${local.bucket_prefix}-emr-cloudwatch-logs"
  role = aws_iam_role.emr_ec2_role.id

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
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${aws_cloudwatch_log_group.emr_cluster_logs.name}",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${aws_cloudwatch_log_group.emr_cluster_logs.name}:*"
        ]
      }
    ]
  })
}

# EC2 tagging policy for EMR
resource "aws_iam_role_policy" "emr_ec2_tagging" {
  name = "${local.bucket_prefix}-emr-ec2-tagging"
  role = aws_iam_role.emr_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "ec2:DescribeTags",
          "ec2:DescribeInstances"
        ]
        Resource = [
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/*",
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:volume/*"
        ]
      }
    ]
  })
}

# KMS permissions for EMR EC2 role to use default EBS encryption key
resource "aws_iam_role_policy" "emr_ec2_ebs_kms" {
  name = "${local.bucket_prefix}-emr-ec2-ebs-kms"
  role = aws_iam_role.emr_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:DescribeKey"
        ]
        Resource = "arn:aws:kms:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:key/*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "ec2.${data.aws_region.current.id}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

resource "aws_iam_instance_profile" "emr_ec2_instance_profile" {
  name = "${local.bucket_prefix}-emr-ec2-profile"
  role = aws_iam_role.emr_ec2_role.name
}

# Auto Scaling Role
resource "aws_iam_role" "emr_autoscaling_role" {
  name = "${local.bucket_prefix}-emr-autoscaling-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "application-autoscaling.amazonaws.com",
            "elasticmapreduce.amazonaws.com"
          ]
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "emr_autoscaling_role" {
  role       = aws_iam_role.emr_autoscaling_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceforAutoScalingRole"
}