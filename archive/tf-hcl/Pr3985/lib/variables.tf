variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "ssh_allowed_ip" {
  description = "IP address allowed to SSH to EC2 instances (in CIDR notation)"
  type        = string
  default     = "203.0.113.0/32"
}

variable "use_secrets_manager" {
  description = "Whether to use AWS Secrets Manager for RDS password (recommended for production)"
  type        = bool
  default     = true
}

variable "db_password" {
  description = "RDS database master password (only used if use_secrets_manager is false)"
  type        = string
  default     = null
  sensitive   = true
}
