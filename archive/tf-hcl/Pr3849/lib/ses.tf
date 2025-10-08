resource "aws_ses_email_identity" "sender" {
  email = var.sender_email
}

resource "aws_ses_configuration_set" "receipts" {
  name = "${var.project_name}-receipts-${local.env_suffix}"
}

resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "cloudwatch-destination"
  configuration_set_name = aws_ses_configuration_set.receipts.name
  enabled                = true
  matching_types         = ["send", "reject", "bounce", "complaint", "delivery"]

  cloudwatch_destination {
    default_value  = "default"
    dimension_name = "ses:configuration-set"
    value_source   = "messageTag"
  }
}
