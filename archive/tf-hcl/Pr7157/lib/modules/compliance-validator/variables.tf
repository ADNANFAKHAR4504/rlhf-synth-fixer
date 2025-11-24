variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "ec2_instances" {
  description = "Map of EC2 instances to validate"
  type        = any
  default     = {}
}

variable "rds_instances" {
  description = "Map of RDS instances to validate"
  type        = any
  default     = {}
}

variable "s3_buckets" {
  description = "Map of S3 buckets to validate (basic bucket info only - encryption/versioning/public access require AWS CLI or external data source)"
  type        = any
  default     = {}
}

variable "iam_roles" {
  description = "Map of IAM roles to validate"
  type        = any
  default     = {}
}

variable "security_groups" {
  description = "Map of security groups to validate"
  type        = any
  default     = {}
}

variable "default_security_groups" {
  description = "Map of default security groups"
  type        = any
  default     = {}
}

variable "approved_ami_ids" {
  description = "List of approved AMI IDs"
  type        = list(string)
  default     = []
}

variable "minimum_backup_retention_days" {
  description = "Minimum backup retention days for RDS"
  type        = number
  default     = 7
}

variable "production_bucket_names" {
  description = "List of production bucket names"
  type        = list(string)
  default     = []
}

variable "required_tags" {
  description = "Map of required tags"
  type        = map(string)
  default     = {}
}

variable "sensitive_ports" {
  description = "List of sensitive ports"
  type        = list(number)
  default     = []
}
