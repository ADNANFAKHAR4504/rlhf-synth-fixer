Here's the fix for the error. The `aws_iam_group` resource doesn't support the `tags` argument. Remove the tags line from the IAM group resource:

```hcl
# IAM Group for MFA enforcement
resource "aws_iam_group" "mfa_required" {
  name = "mfa-required-group"
  
  # Remove this line - IAM groups don't support tags
  # tags = local.common_tags
}
```

**Complete fixed code snippet:**

```hcl
# IAM Group for MFA enforcement
resource "aws_iam_group" "mfa_required" {
  name = "mfa-required-group"
}

# IAM Policy for MFA enforcement
resource "aws_iam_policy" "mfa_required" {
  name        = "mfa-required-policy"
  description = "Policy requiring MFA for all actions"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnPasswords"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:ListMFADevices",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptUnlessSignedInWithMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_group_policy_attachment" "mfa_required" {
  group      = aws_iam_group.mfa_required.name
  policy_arn = aws_iam_policy.mfa_required.arn
}
```

**Explanation:**
- The `aws_iam_group` resource in Terraform's AWS provider doesn't support the `tags` argument
- IAM groups in AWS don't support tagging at the resource level
- The IAM policy (`aws_iam_policy`) still supports tags, so those remain intact
- This is a common limitation with some IAM resources in AWS

The fix simply removes the unsupported `tags` argument from the IAM group resource while keeping all other functionality intact.
