variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid collisions"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dr"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"
}

variable "db_master_username" {
  description = "Master username for Aurora"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora"
  type        = string
  sensitive   = true
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.r5.large"
}

variable "domain_name" {
  description = "Domain name for Route 53 (optional - leave empty to skip Route 53 setup)"
  type        = string
  default     = ""
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/health"
}

variable "backup_retention_days" {
  description = "Backup retention in days"
  type        = number
  default     = 7
}

variable "vpc_cidr_primary" {
  description = "Primary VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "Secondary VPC CIDR"
  type        = string
  default     = "10.1.0.0/16"
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    Project   = "MultiRegionDR"
    ManagedBy = "Terraform"
  }
}

# CI/CD Required Variables
variable "aws_region" {
  description = "AWS region for single-provider resources"
  type        = string
  default     = "us-east-1"
}

variable "repository" {
  description = "Repository name"
  type        = string
  default     = "iac-test-automations"
}

variable "commit_author" {
  description = "Commit author"
  type        = string
  default     = "terraform"
}

variable "pr_number" {
  description = "Pull request number"
  type        = string
  default     = "local"
}

variable "team" {
  description = "Team name"
  type        = string
  default     = "synth"
}
