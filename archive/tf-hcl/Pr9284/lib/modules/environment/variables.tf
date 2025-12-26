variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "environment_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "availability_zones" {
  description = "Availability zones to use"
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type for the environment"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs (disable for LocalStack compatibility)"
  type        = bool
  default     = true
}

variable "enable_ec2_instances" {
  description = "Enable EC2 instances (disable for LocalStack compatibility)"
  type        = bool
  default     = true
}