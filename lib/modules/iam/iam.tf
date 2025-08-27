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
