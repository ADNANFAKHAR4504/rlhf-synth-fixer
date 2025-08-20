variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "allowed_ips" {
  description = "Allowed IPs for bastion (CIDR list)"
  type        = list(string)
}

variable "private_subnets_cidr" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "db_port" {
  description = "Database port"
  type        = number
}

variable "http_port" {
  description = "HTTP port"
  type        = number
}

variable "https_port" {
  description = "HTTPS port"
  type        = number
}

variable "ssh_port" {
  description = "SSH port"
  type        = number
}

variable "enable_waf" {
  description = "Enable WAF"
  type        = bool
}

variable "manage_config_recorder" {
  description = "If true Terraform will create/manage AWS Config recorder/delivery channel. If your account already has one, set to false and import."
  type        = bool
}

variable "logs_bucket_arn" {
  description = "ARN of the S3 bucket for logs"
  type        = string
}

variable "logs_bucket_id" {
  description = "ID of the S3 bucket for logs"
  type        = string
}

variable "alb_arn" {
  description = "ARN of the Application Load Balancer"
  type        = string
}
