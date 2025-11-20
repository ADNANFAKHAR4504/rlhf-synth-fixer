variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming uniqueness"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
}

variable "codecommit_repository_name" {
  description = "CodeCommit repository name"
  type        = string
  default     = "payment-gateway"
}

variable "codecommit_branch" {
  description = "CodeCommit branch to track"
  type        = string
  default     = "main"
}

variable "approval_sns_emails" {
  description = "Email addresses for pipeline approval notifications"
  type        = list(string)
  default     = ["approver@example.com"]
}

variable "container_port" {
  description = "Container port for application"
  type        = number
  default     = 8080
}

variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = string
  default     = "256"
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = string
  default     = "512"
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "repository" {
  description = "Repository name"
  type        = string
  default     = "synth-q2m3j4"
}

variable "commit_author" {
  description = "Commit author"
  type        = string
  default     = "mayanksethi-turing"
}

variable "pr_number" {
  description = "PR number"
  type        = string
  default     = "0"
}

variable "team" {
  description = "Team name"
  type        = string
  default     = "synth"
}
