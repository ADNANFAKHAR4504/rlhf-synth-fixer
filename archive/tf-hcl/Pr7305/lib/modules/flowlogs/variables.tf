variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_name" {
  description = "VPC name for naming resources"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 7
}

variable "traffic_type" {
  description = "Type of traffic to capture"
  type        = string
  default     = "ALL"

  validation {
    condition     = contains(["ALL", "ACCEPT", "REJECT"], var.traffic_type)
    error_message = "Traffic type must be ALL, ACCEPT, or REJECT."
  }
}

variable "aggregation_interval" {
  description = "Maximum interval of time during which a flow of packets is captured"
  type        = number
  default     = 60

  validation {
    condition     = contains([60, 600], var.aggregation_interval)
    error_message = "Aggregation interval must be 60 or 600 seconds."
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}