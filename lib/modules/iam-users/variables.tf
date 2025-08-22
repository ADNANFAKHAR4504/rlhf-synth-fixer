variable "users" {
  description = "List of users to create"
  type = list(object({
    username = string
    groups   = list(string)
  }))
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "force_mfa" {
  description = "Whether to enforce MFA"
  type        = bool
  default     = true
}

variable "ip_restriction_policy_arn" {
  description = "ARN of the IP restriction policy"
  type        = string
}

variable "mfa_policy_arn" {
  description = "ARN of the MFA policy"
  type        = string
  default     = null
}