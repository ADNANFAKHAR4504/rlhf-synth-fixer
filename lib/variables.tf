# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "ssh_allowed_ip" {
  description = "IP address allowed for SSH access (use your actual IP/32)"
  type        = string
  default     = "203.0.113.0/32" # Example IP - replace with your actual IP
}

variable "db_password" {
  description = "Master password for RDS database (use AWS Secrets Manager in production)"
  type        = string
  sensitive   = true
  default     = "ChangeMePlease123!" # CHANGE THIS - use secrets manager in production
}
