# Configuration Recorder (must be created before delivery channel)
resource "aws_config_configuration_recorder" "main" {
  name     = "${local.project_prefix}-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_iam_role_policy.config_role_policy]
}

# Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "${local.project_prefix}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket

  depends_on = [aws_config_configuration_recorder.main]
}

# Config Rules for Required Tags
resource "aws_config_config_rule" "required_tags" {
  name = "${local.project_prefix}-required-tags"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key = "environment"
    tag2Key = "owner"
  })

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-required-tags-rule"
  })
}

# Enable Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}