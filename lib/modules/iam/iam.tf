# IAM Role for CloudTrail -> CloudWatch
resource "aws_iam_role" "cloudtrail_cw" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.cloudtrail_assume.json
}

resource "aws_iam_role_policy" "cloudtrail_cw_policy" {
  name   = var.policy_name
  role   = aws_iam_role.cloudtrail_cw.id
  policy = data.aws_iam_policy_document.cloudtrail_cw_policy.json
}

data "aws_iam_policy_document" "cloudtrail_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "cloudtrail_cw_policy" {
  statement {
    actions   = ["logs:PutLogEvents", "logs:CreateLogStream"]
    resources = ["arn:aws:logs:${region}:${data.aws_caller_identity.current.id}:log-group:/aws/cloudtrail/cloudtrail-logs-pr2219:*"]
  }
}