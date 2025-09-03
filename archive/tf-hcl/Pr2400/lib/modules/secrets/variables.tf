variable "secrets_config" {
  description = "Configuration for secrets in AWS Secrets Manager"
  type = map(object({
    description = string
  }))
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}