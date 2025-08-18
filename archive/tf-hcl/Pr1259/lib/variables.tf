variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "resource_prefix" {
  description = "Prefix for all resources"
  type        = string
  default     = "SecureTF"
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for inbound traffic"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring for resources"
  type        = bool
  default     = true
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., pr123, dev)"
  type        = string
  default     = "dev"
}