variable "topic_name" {
  description = "Name of the SNS topic for security alerts"
  type        = string
}

variable "kms_key_id" {
  description = "KMS Key id"
  type        = string
}