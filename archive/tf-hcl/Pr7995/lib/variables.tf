variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region for infrastructure validation"
  type        = string
  default     = "us-east-1"
}

variable "approved_ami_ids" {
  description = "List of approved AMI IDs for EC2 instances"
  type        = list(string)
  default = [
    "ami-0c55b159cbfafe1f0", # Amazon Linux 2
    "ami-0747bdcabd34c712a", # Ubuntu 20.04
    "ami-0a5c3558529277641"  # Amazon Linux 2023
  ]
}

variable "required_tags" {
  description = "List of required tags for all resources"
  type        = list(string)
  default = [
    "Environment",
    "Owner",
    "CostCenter",
    "DataClassification"
  ]
}

variable "bucket_names_to_validate" {
  description = "List of S3 bucket names to validate"
  type        = list(string)
  default     = []
}

variable "security_group_ids_to_validate" {
  description = "List of security group IDs to validate"
  type        = list(string)
  default     = []
}

variable "instance_ids_to_validate" {
  description = "List of EC2 instance IDs to validate"
  type        = list(string)
  default     = []
}

variable "validation_enabled" {
  description = "Enable validation checks"
  type        = bool
  default     = true
}
