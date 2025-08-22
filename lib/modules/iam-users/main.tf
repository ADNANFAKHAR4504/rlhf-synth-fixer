# IAM Users module with MFA enforcement

# Create IAM users
resource "aws_iam_user" "users" {
  for_each = { for user in var.users : user.username => user }

  name          = each.value.username
  force_destroy = true

  tags = {
    Name        = each.value.username
    Environment = var.environment
    Project     = var.project_name
  }
}

# Add users to their respective groups
resource "aws_iam_user_group_membership" "user_groups" {
  for_each = { for user in var.users : user.username => user }

  user   = aws_iam_user.users[each.key].name
  groups = [for group in each.value.groups : "${var.project_name}-${group}-${var.environment}"]
}

# Create access keys for users (optional, consider using temporary credentials)
resource "aws_iam_access_key" "user_keys" {
  for_each = { for user in var.users : user.username => user }

  user = aws_iam_user.users[each.key].name
}

# Attach IP restriction policy to users
resource "aws_iam_user_policy_attachment" "ip_restriction" {
  for_each = { for user in var.users : user.username => user }

  user       = aws_iam_user.users[each.key].name
  policy_arn = var.ip_restriction_policy_arn
}

# Attach MFA policy to users if enabled
resource "aws_iam_user_policy_attachment" "mfa_policy" {
  for_each = var.force_mfa ? { for user in var.users : user.username => user } : {}

  user       = aws_iam_user.users[each.key].name
  policy_arn = var.mfa_policy_arn
}
