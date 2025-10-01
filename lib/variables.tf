variable "resource_suffix" {
  description = "A suffix to append to all resource names for uniqueness"
  type        = string
  default     = "dev"

  validation {
    condition     = length(var.resource_suffix) > 0
    error_message = "resource_suffix must not be empty"
  }
}

variable "db_username" {
  description = "Username for the RDS database"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for the RDS database. If empty, a secure password will be generated."
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "mydb"
}

variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ssh_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access (REQUIRED when use_ssm = false; prefer a single /32)"
  type        = list(string)
  default     = []   # not required when use_ssm = true

  validation {
    condition     = var.use_ssm ? true : length(var.ssh_cidr_blocks) > 0
    error_message = "ssh_cidr_blocks must be provided and should be restricted (e.g. [\"1.2.3.4/32\"]) when use_ssm = false"
  }
}

variable "ssh_public_key" {
  description = "SSH public key (single-line, contents of <key>.pub). Do NOT commit private keys."
  type        = string
  default     = ""

  validation {
    condition     = var.use_ssm ? true : length(var.ssh_public_key) > 0
    error_message = "ssh_public_key is required (paste the public key string or use a non-tracked file) when use_ssm = false"
  }
}

variable "use_ssm" {
  description = "If true, enable AWS SSM Session Manager on the instance (recommended). If false, provision SSH key + security group rule."
  type        = bool
  default     = true
}

variable "region" {
  description = "AWS region for resources. Override with TF_VAR_region or set AWS_REGION in the environment."
  type        = string
  default     = "us-east-1" # sensible default; TF_VAR_region will override in CI/deploy
}

variable "iac_rlhf_tag_value" {
  description = "Value for the iac-rlhf-amazon tag (set to identify resources created by this IaC)"
  type        = string
  default     = "true"
}