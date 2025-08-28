variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}

variable "secrets_policy_arn" {
  description = "ARN of the secrets access policy"
  type        = string
}