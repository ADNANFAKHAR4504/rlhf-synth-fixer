# modules/sqs/variables.tf

variable "transaction_validation_queue_name" {
  description = "Name for the transaction validation FIFO queue"
  type        = string
}

variable "transaction_validation_dlq_name" {
  description = "Name for the transaction validation dead letter queue"
  type        = string
}

variable "fraud_detection_queue_name" {
  description = "Name for the fraud detection FIFO queue"
  type        = string
}

variable "fraud_detection_dlq_name" {
  description = "Name for the fraud detection dead letter queue"
  type        = string
}

variable "payment_notification_queue_name" {
  description = "Name for the payment notification FIFO queue"
  type        = string
}

variable "payment_notification_dlq_name" {
  description = "Name for the payment notification dead letter queue"
  type        = string
}

variable "message_retention_seconds" {
  description = "Message retention period in seconds"
  type        = number
  default     = 604800 # 7 days
}

variable "dlq_message_retention_seconds" {
  description = "Dead letter queue message retention period in seconds"
  type        = number
  default     = 1209600 # 14 days
}

variable "visibility_timeout_seconds" {
  description = "Visibility timeout for SQS messages in seconds"
  type        = number
  default     = 300 # 5 minutes
}

variable "max_message_size" {
  description = "Maximum message size in bytes"
  type        = number
  default     = 262144 # 256KB
}

variable "max_receive_count" {
  description = "Maximum number of receives before sending to DLQ"
  type        = number
  default     = 3
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "lambda_validation_role_arn" {
  description = "ARN of the Lambda validation role"
  type        = string
}

variable "lambda_fraud_role_arn" {
  description = "ARN of the Lambda fraud detection role"
  type        = string
}

variable "lambda_notification_role_arn" {
  description = "ARN of the Lambda notification role"
  type        = string
}

variable "eventbridge_role_arn" {
  description = "ARN of the EventBridge role"
  type        = string
}

variable "transaction_state_table_name" {
  description = "Name for the DynamoDB transaction state table"
  type        = string
}

variable "ssm_validation_queue_url" {
  description = "SSM parameter name for validation queue URL"
  type        = string
}

variable "ssm_fraud_queue_url" {
  description = "SSM parameter name for fraud queue URL"
  type        = string
}

variable "ssm_notification_queue_url" {
  description = "SSM parameter name for notification queue URL"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}