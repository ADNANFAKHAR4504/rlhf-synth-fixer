resource "aws_cloudwatch_log_group" "fraud_detection" {
  name              = "/ecs/fraud-detection-${var.environmentSuffix}"
  retention_in_days = 7

  tags = {
    Name = "fraud-detection-logs-${var.environmentSuffix}"
  }
}

resource "aws_cloudwatch_log_group" "transaction_processor" {
  name              = "/ecs/transaction-processor-${var.environmentSuffix}"
  retention_in_days = 7

  tags = {
    Name = "transaction-processor-logs-${var.environmentSuffix}"
  }
}
