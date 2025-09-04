variable "security_team_email" {
  description = "Email address for security alerts"
  type        = string
  default     = "security-team@company.local"
}

variable "target_account_id" {
  description = "Target AWS account ID for multi-account setup"
  type        = string
  default     = ""
}

variable "corporate_cidr" {
  description = "Corporate network CIDR for security group rules"
  type        = string
  default     = "10.0.0.0/8"
}
