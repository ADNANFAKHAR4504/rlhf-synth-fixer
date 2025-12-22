# AWS Region Migration - Variables Configuration
# Platform: Terraform with HCL

# Region Configuration
variable "aws_region" {
  description = "AWS region for infrastructure deployment (us-west-1 for source, us-west-2 for target)"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across environments"
  type        = string
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones for the region"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnet internet access (set to false to reduce costs)"
  type        = bool
  default     = false
}

variable "enable_vpc_resources" {
  description = "Enable VPC and networking resources (set to false for LocalStack which has limited EC2/VPC support)"
  type        = bool
  default     = false
}

# Web Tier Configuration
variable "web_instance_count" {
  description = "Number of web tier EC2 instances"
  type        = number
  default     = 0
}

variable "web_instance_type" {
  description = "EC2 instance type for web tier"
  type        = string
  default     = "t3.small"
}

variable "web_ami_id" {
  description = "AMI ID for web tier instances (must be region-specific)"
  type        = string
  default     = "ami-0c55b159cbfafe1f0"
}

# Application Tier Configuration
variable "app_instance_count" {
  description = "Number of application tier EC2 instances"
  type        = number
  default     = 0
}

variable "app_instance_type" {
  description = "EC2 instance type for application tier"
  type        = string
  default     = "t3.medium"
}

variable "app_ami_id" {
  description = "AMI ID for application tier instances (must be region-specific)"
  type        = string
  default     = "ami-0c55b159cbfafe1f0"
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
