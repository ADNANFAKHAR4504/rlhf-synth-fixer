resource "aws_sns_topic" "pipeline_approval" {
  name              = "pipeline-approval-v1-${var.environment_suffix}"
  display_name      = "Pipeline Approval Notifications"
  kms_master_key_id = aws_kms_key.artifacts.id

  tags = {
    Name = "pipeline-approval-v1-${var.environment_suffix}"
  }
}

resource "aws_sns_topic_subscription" "pipeline_approval" {
  count = length(var.approval_sns_emails)

  topic_arn = aws_sns_topic.pipeline_approval.arn
  protocol  = "email"
  endpoint  = var.approval_sns_emails[count.index]
}
