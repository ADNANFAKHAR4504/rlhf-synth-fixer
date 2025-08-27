variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "secure-infrastructure"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "kms_key_id_us_east_1" {
  description = "KMS key ID for encryption in us-east-1"
  type        = string
  default     = ""
}

variable "kms_key_id_us_west_2" {
  description = "KMS key ID for encryption in us-west-2"
  type        = string
  default     = ""
}

variable "db_password" {
  description = "Database password for S3 module access"
  type        = string
  sensitive   = true
  default     = ""
}
