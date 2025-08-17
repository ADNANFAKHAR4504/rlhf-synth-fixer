variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "idp_arn" {
  description = "Identity Provider ARN"
  type        = string
}

variable "idp_url" {
  description = "Identity Provider URL"
  type        = string
}

variable "idp_thumbprint" {
  description = "Identity Provider thumbprint"
  type        = string
}