resource "aws_sns_topic" "security_alerts" {
  name = var.topic_name
  kms_master_key_id = var.kms_key_id
    tags = {
        Name    = var.topic_name
  }
}
