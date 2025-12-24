# Dead Letter Queue for event-validator Lambda
resource "aws_sqs_queue" "validator_dlq" {
  name                       = "${var.project_name}-validator-dlq-${var.environment_suffix}"
  message_retention_seconds  = 1209600 # 14 days
  visibility_timeout_seconds = 300

  tags = {
    Name = "${var.project_name}-validator-dlq-${var.environment_suffix}"
  }
}

# Dead Letter Queue for event-processor Lambda
resource "aws_sqs_queue" "processor_dlq" {
  name                       = "${var.project_name}-processor-dlq-${var.environment_suffix}"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 300

  tags = {
    Name = "${var.project_name}-processor-dlq-${var.environment_suffix}"
  }
}

# Dead Letter Queue for event-enricher Lambda
resource "aws_sqs_queue" "enricher_dlq" {
  name                       = "${var.project_name}-enricher-dlq-${var.environment_suffix}"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 300

  tags = {
    Name = "${var.project_name}-enricher-dlq-${var.environment_suffix}"
  }
}
