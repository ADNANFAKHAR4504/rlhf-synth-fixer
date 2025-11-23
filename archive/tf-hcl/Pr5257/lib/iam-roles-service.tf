# Service IAM Roles

# EC2 Instance Role
data "aws_iam_policy_document" "ec2_trust" {
  statement {
    sid     = "AllowEC2AssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2_instance" {
  count = var.enable_ec2_instance_role ? 1 : 0

  name                 = "${local.name_prefix}-ec2-instance-role-${local.name_suffix}"
  description          = "EC2 instance role with minimal required permissions"
  assume_role_policy   = data.aws_iam_policy_document.ec2_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    RoleType = "Service-EC2"
  })
}

# EC2 Instance Policy
data "aws_iam_policy_document" "ec2_instance_policy" {
  # Allow reading from Systems Manager Parameter Store
  statement {
    sid    = "ReadParameterStore"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath"
    ]
    resources = [
      "arn:${local.partition}:ssm:${local.region}:${local.account_id}:parameter/${var.project_name}/*"
    ]
  }

  # Allow writing logs to CloudWatch
  statement {
    sid    = "WriteCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = [
      "arn:${local.partition}:logs:${local.region}:${local.account_id}:log-group:/aws/ec2/*"
    ]
  }

  # Allow reading from specific S3 buckets
  statement {
    sid    = "ReadS3Configuration"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:${local.partition}:s3:::${local.name_prefix}-config-*",
      "arn:${local.partition}:s3:::${local.name_prefix}-config-*/*"
    ]
  }

  # Allow RDS connection
  statement {
    sid    = "RDSConnect"
    effect = "Allow"
    actions = [
      "rds-db:connect"
    ]
    resources = [
      "arn:${local.partition}:rds-db:${local.region}:${local.account_id}:dbuser:*/${var.project_name}*"
    ]
  }
}

resource "aws_iam_policy" "ec2_instance" {
  count = var.enable_ec2_instance_role ? 1 : 0

  name        = "${local.name_prefix}-ec2-instance-policy-${local.name_suffix}"
  description = "EC2 instance policy with least privilege access"
  policy      = data.aws_iam_policy_document.ec2_instance_policy.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_instance" {
  count = var.enable_ec2_instance_role ? 1 : 0

  role       = aws_iam_role.ec2_instance[0].name
  policy_arn = aws_iam_policy.ec2_instance[0].arn
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  count = var.enable_ec2_instance_role ? 1 : 0

  name = "${local.name_prefix}-ec2-instance-profile-${local.name_suffix}"
  role = aws_iam_role.ec2_instance[0].name

  tags = local.common_tags
}

# Lambda Execution Role
data "aws_iam_policy_document" "lambda_trust" {
  statement {
    sid     = "AllowLambdaAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_execution" {
  count = var.enable_lambda_execution_role ? 1 : 0

  name                 = "${local.name_prefix}-lambda-execution-role-${local.name_suffix}"
  description          = "Lambda execution role with scoped permissions"
  assume_role_policy   = data.aws_iam_policy_document.lambda_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    RoleType = "Service-Lambda"
  })
}

# Lambda Execution Policy
data "aws_iam_policy_document" "lambda_execution_policy" {
  # CloudWatch Logs permissions
  statement {
    sid    = "WriteLambdaLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "arn:${local.partition}:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/*"
    ]
  }

  # X-Ray tracing permissions
  statement {
    sid    = "XRayTracing"
    effect = "Allow"
    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords"
    ]
    resources = ["*"]
  }

  # VPC network interface permissions (if Lambda needs VPC access)
  statement {
    sid    = "VPCNetworkAccess"
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:AssignPrivateIpAddresses",
      "ec2:UnassignPrivateIpAddresses"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "lambda_execution" {
  count = var.enable_lambda_execution_role ? 1 : 0

  name        = "${local.name_prefix}-lambda-execution-policy-${local.name_suffix}"
  description = "Lambda execution policy with necessary permissions"
  policy      = data.aws_iam_policy_document.lambda_execution_policy.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_execution" {
  count = var.enable_lambda_execution_role ? 1 : 0

  role       = aws_iam_role.lambda_execution[0].name
  policy_arn = aws_iam_policy.lambda_execution[0].arn
}

# RDS Enhanced Monitoring Role
data "aws_iam_policy_document" "rds_monitoring_trust" {
  statement {
    sid     = "AllowRDSMonitoring"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "rds_monitoring" {
  count = var.enable_rds_monitoring_role ? 1 : 0

  name                 = "${local.name_prefix}-rds-monitoring-role-${local.name_suffix}"
  description          = "RDS Enhanced Monitoring role"
  assume_role_policy   = data.aws_iam_policy_document.rds_monitoring_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    RoleType = "Service-RDS"
  })
}

# Attach AWS managed policy for RDS monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.enable_rds_monitoring_role ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:${local.partition}:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
