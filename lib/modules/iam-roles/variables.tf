variable "roles" {
  description = "List of roles to create"
  type = list(object({
    name               = string
    description        = string
    assume_role_policy = string
    managed_policies   = list(string)
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

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}