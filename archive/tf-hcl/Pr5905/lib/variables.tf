variable "environment_suffix" {
  description = "Unique suffix for resource naming to prevent conflicts"
  type        = string
}

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "ID of the existing VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for EC2 and RDS"
  type        = list(string)
}

variable "db_subnet_ids" {
  description = "List of subnet IDs for RDS Aurora cluster"
  type        = list(string)
}

variable "ami_id" {
  description = "AMI ID for EC2 instances (Amazon Linux 2 with Docker)"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for blue/green environments"
  type        = string
  default     = "t3.medium"
}

variable "min_instances" {
  description = "Minimum number of instances in Auto Scaling Groups"
  type        = number
  default     = 2
}

variable "max_instances" {
  description = "Maximum number of instances in Auto Scaling Groups"
  type        = number
  default     = 6
}

variable "desired_instances" {
  description = "Desired number of instances in Auto Scaling Groups"
  type        = number
  default     = 2
}

variable "db_master_username" {
  description = "Master username for RDS Aurora cluster"
  type        = string
  default     = "admin"
}

variable "db_master_password" {
  description = "Master password for RDS Aurora cluster"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for DNS records"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "blue_traffic_weight" {
  description = "Traffic weight for blue environment (0-100)"
  type        = number
  default     = 100
}

variable "green_traffic_weight" {
  description = "Traffic weight for green environment (0-100)"
  type        = number
  default     = 0
}

variable "app_version_blue" {
  description = "Application version for blue environment"
  type        = string
  default     = "1.0.0"
}

variable "app_version_green" {
  description = "Application version for green environment"
  type        = string
  default     = "1.0.0"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
