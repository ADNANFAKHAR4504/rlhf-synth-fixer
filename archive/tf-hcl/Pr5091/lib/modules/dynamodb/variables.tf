variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "replica_regions" {
  description = "List of replica regions"
  type        = list(string)
}

variable "is_production" {
  description = "Is this a production environment"
  type        = bool
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "replica_kms_keys" {
  description = "Map of region to KMS key ARN"
  type        = map(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
