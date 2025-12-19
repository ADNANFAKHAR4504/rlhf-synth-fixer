# Config Aggregator to collect data from all regions
resource "aws_config_configuration_aggregator" "organization" {
  provider = aws.primary
  name     = "config-aggregator-${var.environment_suffix}"

  account_aggregation_source {
    account_ids = [local.account_id]
    regions     = var.aws_regions
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_east_1,
    aws_config_configuration_recorder_status.us_west_2,
    aws_config_configuration_recorder_status.eu_west_1
  ]

  tags = {
    Name        = "config-aggregator-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
