variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
}

variable "table_name" {
  description = "DynamoDB table name"
  type        = string
}

variable "billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PROVISIONED", "PAY_PER_REQUEST"], var.billing_mode)
    error_message = "Billing mode must be PROVISIONED or PAY_PER_REQUEST"
  }
}

variable "hash_key" {
  description = "Hash key attribute name"
  type        = string
}

variable "attributes" {
  description = "List of attribute definitions"
  type = list(object({
    name = string
    type = string
  }))
}

variable "replica_regions" {
  description = "List of replica regions"
  type        = list(string)
}
