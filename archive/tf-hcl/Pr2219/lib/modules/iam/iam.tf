# IAM Role for CloudTrail -> CloudWatch
resource "aws_iam_role" "cloudtrail_cw" {
  name               = var.role_name
  assume_role_policy = var.assume_policy
}

resource "aws_iam_role_policy" "cloudtrail_cw_policy" {
  name   = var.policy_name
  role   = aws_iam_role.cloudtrail_cw.id
  policy = var.iam_policy
}

# Optional AWS Config role policy attachment
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  for_each   = var.policy_arn != "" ? { attach = var.policy_arn } : {}
  role       = aws_iam_role.cloudtrail_cw.name
  policy_arn = each.value
}