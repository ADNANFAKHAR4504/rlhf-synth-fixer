resource "aws_codecommit_repository" "app" {
  repository_name = "${var.codecommit_repository_name}-v1-${var.environment_suffix}"
  description     = "Repository for payment gateway application"

  tags = {
    Name = "codecommit-v1-${var.environment_suffix}"
  }
}

resource "aws_codecommit_approval_rule_template" "main_branch_protection" {
  name        = "main-branch-protection-v1-${var.environment_suffix}-${formatdate("YYYYMMDDhhmmss", timestamp())}"
  description = "Require approval for main branch changes"

  lifecycle {
    ignore_changes = [name]
  }

  content = jsonencode({
    Version               = "2018-11-08"
    DestinationReferences = ["refs/heads/${var.codecommit_branch}"]
    Statements = [
      {
        Type                    = "Approvers"
        NumberOfApprovalsNeeded = 1
        ApprovalPoolMembers     = ["arn:aws:sts::${data.aws_caller_identity.current.account_id}:assumed-role/*"]
      }
    ]
  })
}

resource "aws_codecommit_approval_rule_template_association" "main" {
  approval_rule_template_name = aws_codecommit_approval_rule_template.main_branch_protection.name
  repository_name             = aws_codecommit_repository.app.repository_name
}
