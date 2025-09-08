variable "security_team_email" {
  description = "Email address for security team notifications"
  type        = string
  default     = "security-team@example.com"
}

variable "corporate_cidr" {
  description = "Corporate network CIDR for security group rules"
  type        = string
  default     = "10.0.0.0/8"
}

variable "target_account_id" {
  description = "Target account ID for cross-account deployment (leave empty for same account)"
  type        = string
  default     = ""
}
