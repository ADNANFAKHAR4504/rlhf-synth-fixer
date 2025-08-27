// Module: iam
// Contains roles, instance profile, policies, and assume role policy documents

########################
# Assume Role Policies  #
########################

data "aws_iam_policy_document" "cloudtrail_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "vpc_flow_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

########################
# Inline Policies       #
########################

data "aws_iam_policy_document" "cloudtrail_policy" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${var.cloudtrail_log_group_arn}:*"]
  }
}

data "aws_iam_policy_document" "vpc_flow_policy" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "ec2_policy" {
  statement {
    actions = [
      "ssm:UpdateInstanceInformation",
      "ssm:SendCommand",
      "ssm:ListCommands",
      "ssm:ListCommandInvocations",
      "ssm:DescribeInstanceInformation",
      "ssm:GetDeployablePatchSnapshotForInstance",
      "ssm:GetDefaultPatchBaseline",
      "ssm:GetManifest",
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:ListAssociations",
      "ssm:ListInstanceAssociations",
      "ssm:PutInventory",
      "ssm:PutComplianceItems",
      "ssm:PutConfigurePackageResult",
      "ssm:UpdateAssociationStatus",
      "ssm:UpdateInstanceAssociationStatus",
      "ec2messages:AcknowledgeMessage",
      "ec2messages:DeleteMessage",
      "ec2messages:FailMessage",
      "ec2messages:GetEndpoint",
      "ec2messages:GetMessages",
      "ec2messages:SendReply"
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }
  statement {
    actions = [
      "ec2:DescribeSecurityGroups",
      "ec2:AuthorizeSecurityGroupIngress",
      "ec2:RevokeSecurityGroupIngress"
    ]
    resources = ["*"]
  }
}

###############
# IAM Roles    #
###############

resource "aws_iam_role" "cloudtrail" {
  name_prefix        = "${var.project_name}-${var.environment_suffix}-cloudtrail-role-"
  assume_role_policy = data.aws_iam_policy_document.cloudtrail_assume.json
  tags               = var.common_tags
}

resource "aws_iam_role_policy" "cloudtrail" {
  name   = "${var.project_name}-${var.environment_suffix}-cloudtrail-policy"
  role   = aws_iam_role.cloudtrail.id
  policy = data.aws_iam_policy_document.cloudtrail_policy.json
}

resource "aws_iam_role" "vpc_flow" {
  count              = var.enable_vpc_flow_logs ? 1 : 0
  name_prefix        = "${var.project_name}-${var.environment_suffix}-vpc-flow-role-"
  assume_role_policy = data.aws_iam_policy_document.vpc_flow_assume.json
  tags               = var.common_tags
}

resource "aws_iam_role_policy" "vpc_flow" {
  count  = var.enable_vpc_flow_logs ? 1 : 0
  name   = "${var.project_name}-${var.environment_suffix}-vpc-flow-policy"
  role   = aws_iam_role.vpc_flow[0].id
  policy = data.aws_iam_policy_document.vpc_flow_policy.json
}

resource "aws_iam_role" "ec2" {
  name_prefix        = "${var.project_name}-${var.environment_suffix}-ec2-role-"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
  tags               = var.common_tags
}

resource "aws_iam_role_policy" "ec2" {
  name   = "${var.project_name}-${var.environment_suffix}-ec2-policy"
  role   = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.ec2_policy.json
}

resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-ec2-profile-"
  role        = aws_iam_role.ec2.name
  tags        = var.common_tags
}

resource "aws_iam_role" "lambda" {
  name_prefix        = "${var.project_name}-${var.environment_suffix}-lambda-role-"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = var.common_tags
}

resource "aws_iam_role_policy" "lambda" {
  name   = "${var.project_name}-${var.environment_suffix}-lambda-policy"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}
