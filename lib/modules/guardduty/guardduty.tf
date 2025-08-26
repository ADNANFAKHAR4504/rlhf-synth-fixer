# Create GuardDuty Detector
resource "aws_guardduty_detector" "this" {
  enable = var.enable_guardduty
}

# Optional: Invite Member Accounts (if any provided)
resource "aws_guardduty_member" "members" {
  for_each = var.member_accounts

  account_id               = each.key
  detector_id               = aws_guardduty_detector.this.id
  email                     = each.value.email
  invitation_message        = each.value.invitation_message
  disable_email_notification = false
}

# Optional: Publish findings to SNS topic
resource "aws_guardduty_publishing_destination" "this" {
  count         = var.findings_export_bucket_arn != "" ? 1 : 0
  detector_id   = aws_guardduty_detector.this.id
  destination_arn = var.findings_export_bucket_arn
  kms_key_arn     = var.kms_key_arn
}
