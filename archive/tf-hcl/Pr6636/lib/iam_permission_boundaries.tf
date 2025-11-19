# Permission boundary policy restricting access to us-east-1 region
resource "aws_iam_policy" "permission_boundary" {
  name        = "permission-boundary-${var.environment_suffix}"
  description = "Permission boundary restricting access to us-east-1 region"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "RestrictToUSEast1"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = "us-east-1"
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "permission-boundary-${var.environment_suffix}"
    }
  )
}
