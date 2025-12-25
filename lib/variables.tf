variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "myapp"
}

variable "environments" {
  description = "List of environments"
  type        = list(string)
  default     = ["dev", "prod"]
}

variable "notification_email" {
  description = "Email for pipeline notifications"
  type        = string
  default     = "devops@company.com"
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "your-org"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "your-app-repo"
}

variable "github_branch" {
  description = "GitHub branch to track"
  type        = string
  default     = "main"
}

variable "environment_suffix" {
  description = "Suffix for environment-specific resource naming"
  type        = string
  default     = "dev"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project    = "MyApp"
    ManagedBy  = "terraform"
    CostCenter = "engineering"
  }
}

variable "is_localstack" {
  description = "Flag to indicate if deploying to LocalStack (auto-detected from AWS_ENDPOINT_URL)"
  type        = bool
  default     = false
}