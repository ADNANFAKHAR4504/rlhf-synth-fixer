variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "microservices_count" {
  description = "Number of microservices"
  type        = number
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "lambda_functions" {
  description = "List of Lambda function ARNs"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
