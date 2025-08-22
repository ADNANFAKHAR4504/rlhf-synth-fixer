# IAM Roles module

# Data source for assume role policies
data "aws_iam_policy_document" "assume_role" {
  for_each = { for role in var.roles : role.name => role }

  statement {
    effect = "Allow"

    principals {
      type = each.value.assume_role_policy == "ec2" ? "Service" : "AWS"
      identifiers = each.value.assume_role_policy == "ec2" ? [
        "ec2.amazonaws.com"
      ] : [
        "arn:aws:iam::${var.account_id}:root"
      ]
    }

    actions = ["sts:AssumeRole"]
  }
}

# Create IAM roles
resource "aws_iam_role" "roles" {
  for_each = { for role in var.roles : role.name => role }

  name               = "${var.project_name}-${each.value.name}-${var.environment}"
  description        = each.value.description
  assume_role_policy = data.aws_iam_policy_document.assume_role[each.key].json

  tags = {
    Name        = each.value.name
    Environment = var.environment
    Project     = var.project_name
  }
}

# Attach managed policies to roles
resource "aws_iam_role_policy_attachment" "role_policies" {
  for_each = {
    for pair in flatten([
      for role_key, role in { for r in var.roles : r.name => r } : [
        for policy in role.managed_policies : {
          role_key   = role_key
          policy_arn = policy
          key        = "${role_key}-${policy}"
        }
      ]
    ]) : pair.key => pair
  }

  role       = aws_iam_role.roles[each.value.role_key].name
  policy_arn = each.value.policy_arn
}

# Create instance profiles for EC2 roles
resource "aws_iam_instance_profile" "role_profiles" {
  for_each = {
    for role in var.roles : role.name => role
    if role.assume_role_policy == "ec2"
  }

  name = "${var.project_name}-${each.value.name}-profile-${var.environment}"
  role = aws_iam_role.roles[each.key].name
}