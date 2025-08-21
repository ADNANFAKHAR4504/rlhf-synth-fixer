# Root-level variables moved out of tap_stack.tf

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ec2_key_pair_name" {
  description = "EC2 key pair name (optional - leave empty to skip key pair)"
  type        = string
  default     = ""
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-west-1"
}

variable "secondary_aws_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "allowed_cidr_blocks" {
  description = "Allowed CIDR blocks for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/24"]
}

variable "create_vpcs" {
  description = "Whether to create VPCs and VPC-dependent resources (set to false if VPC limit is reached)"
  type        = bool
  default     = false
}

variable "create_cloudtrail" {
  description = "Whether to create CloudTrail (set to false if CloudTrail limit is reached)"
  type        = bool
  default     = false
}
