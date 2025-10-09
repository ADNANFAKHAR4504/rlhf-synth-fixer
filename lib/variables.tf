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

variable "db_password" {
  description = "RDS database master password (use AWS Secrets Manager in production)"
  type        = string
  default     = "ChangeMe123!"
  sensitive   = true
}
