variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for OpenSearch"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs for OpenSearch"
  type        = list(string)
}

variable "enable_multi_az" {
  description = "Enable multi-AZ configuration"
  type        = bool
}

variable "is_production" {
  description = "Is this a production environment"
  type        = bool
}

variable "instance_type" {
  description = "OpenSearch instance type"
  type        = string
}

variable "instance_count" {
  description = "Number of OpenSearch instances"
  type        = number
}

variable "volume_size" {
  description = "EBS volume size in GB"
  type        = number
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "master_username" {
  description = "Master username for OpenSearch"
  type        = string
}

variable "master_password" {
  description = "Master password for OpenSearch"
  type        = string
  sensitive   = true
}

variable "retention_days" {
  description = "Log retention in days"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
