# modules/waf/variables.tf

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "pr_number" {
  description = "PR number for resource identification"
  type        = string
}

variable "alb_arn" {
  description = "ARN of the Application Load Balancer"
  type        = string
}

variable "rate_limit" {
  description = "Rate limit for requests per 5 minutes from a single IP"
  type        = number
  default     = 2000
}

variable "blocked_countries" {
  description = "List of country codes to block (ISO 3166-1 alpha-2)"
  type        = list(string)
  default     = []
}

variable "log_retention" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
