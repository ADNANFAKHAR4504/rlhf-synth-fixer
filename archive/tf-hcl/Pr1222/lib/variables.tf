variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "proj"
}

variable "environments" {
  description = "List of environments"
  type        = list(string)
  default     = ["dev"] # Reduced to just dev to avoid VPC limits
}

variable "owner" {
  description = "Resource owner tag"
  type        = string
  default     = "devops-team"
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "admin"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = "synthtrainr843"
}