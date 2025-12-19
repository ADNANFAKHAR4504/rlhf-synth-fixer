# kinesis.tf - Kinesis Data Stream for transaction events

resource "aws_kinesis_stream" "transactions" {
  name             = "transaction-stream-${var.environment_suffix}"
  shard_count      = var.kinesis_shard_count
  retention_period = 24

  # Enable enhanced shard-level metrics (Constraint #4)
  shard_level_metrics = [
    "IncomingBytes",
    "IncomingRecords",
    "OutgoingBytes",
    "OutgoingRecords",
    "WriteProvisionedThroughputExceeded",
    "ReadProvisionedThroughputExceeded",
    "IteratorAgeMilliseconds"
  ]

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  tags = {
    Name = "transaction-stream-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Kinesis
resource "aws_cloudwatch_log_group" "kinesis" {
  name              = "/aws/kinesis/transaction-stream-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "kinesis-logs-${var.environment_suffix}"
  }
}
