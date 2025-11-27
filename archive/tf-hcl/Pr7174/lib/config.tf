# AWS Config Recorder for us-east-1
resource "aws_config_configuration_recorder" "us_east_1" {
  provider = aws.us_east_1
  name     = "config-recorder-${var.environment_suffix}-us-east-1"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = false
    include_global_resource_types = true
    resource_types                = var.resource_types_to_record
  }
}

# AWS Config Delivery Channel for us-east-1
resource "aws_config_delivery_channel" "us_east_1" {
  provider = aws.us_east_1
  name     = "config-delivery-${var.environment_suffix}-us-east-1"

  s3_bucket_name = aws_s3_bucket.config_bucket.id
  s3_key_prefix  = "us-east-1"
  sns_topic_arn  = aws_sns_topic.compliance_notifications.arn

  snapshot_delivery_properties {
    delivery_frequency = var.config_delivery_frequency
  }

  depends_on = [aws_config_configuration_recorder.us_east_1]
}

# Start Config Recorder for us-east-1
resource "aws_config_configuration_recorder_status" "us_east_1" {
  provider = aws.us_east_1
  name     = aws_config_configuration_recorder.us_east_1.name

  is_enabled = true

  depends_on = [aws_config_delivery_channel.us_east_1]
}

# AWS Config Recorder for us-west-2
resource "aws_config_configuration_recorder" "us_west_2" {
  provider = aws.us_west_2
  name     = "config-recorder-${var.environment_suffix}-us-west-2"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = false
    include_global_resource_types = false
    resource_types                = var.resource_types_to_record
  }
}

# AWS Config Delivery Channel for us-west-2
resource "aws_config_delivery_channel" "us_west_2" {
  provider = aws.us_west_2
  name     = "config-delivery-${var.environment_suffix}-us-west-2"

  s3_bucket_name = aws_s3_bucket.config_bucket.id
  s3_key_prefix  = "us-west-2"
  sns_topic_arn  = aws_sns_topic.compliance_notifications.arn

  snapshot_delivery_properties {
    delivery_frequency = var.config_delivery_frequency
  }

  depends_on = [aws_config_configuration_recorder.us_west_2]
}

# Start Config Recorder for us-west-2
resource "aws_config_configuration_recorder_status" "us_west_2" {
  provider = aws.us_west_2
  name     = aws_config_configuration_recorder.us_west_2.name

  is_enabled = true

  depends_on = [aws_config_delivery_channel.us_west_2]
}

# AWS Config Recorder for eu-west-1
resource "aws_config_configuration_recorder" "eu_west_1" {
  provider = aws.eu_west_1
  name     = "config-recorder-${var.environment_suffix}-eu-west-1"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = false
    include_global_resource_types = false
    resource_types                = var.resource_types_to_record
  }
}

# AWS Config Delivery Channel for eu-west-1
resource "aws_config_delivery_channel" "eu_west_1" {
  provider = aws.eu_west_1
  name     = "config-delivery-${var.environment_suffix}-eu-west-1"

  s3_bucket_name = aws_s3_bucket.config_bucket.id
  s3_key_prefix  = "eu-west-1"
  sns_topic_arn  = aws_sns_topic.compliance_notifications.arn

  snapshot_delivery_properties {
    delivery_frequency = var.config_delivery_frequency
  }

  depends_on = [aws_config_configuration_recorder.eu_west_1]
}

# Start Config Recorder for eu-west-1
resource "aws_config_configuration_recorder_status" "eu_west_1" {
  provider = aws.eu_west_1
  name     = aws_config_configuration_recorder.eu_west_1.name

  is_enabled = true

  depends_on = [aws_config_delivery_channel.eu_west_1]
}
