variable "name_prefix" {
  description = "Prefix to use for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, stage, prod)"
  type        = string
}

variable "color" {
  description = "Color for blue/green deployment (blue or green)"
  type        = string
  validation {
    condition     = contains(["blue", "green"], var.color)
    error_message = "Color must be either 'blue' or 'green'."
  }
}

variable "ami_id" {
  description = "ID of the AMI to use for instances"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "security_group_id" {
  description = "ID of the security group for instances"
  type        = string
}

variable "instance_profile_name" {
  description = "Name of the instance profile to attach to instances"
  type        = string
}

variable "root_volume_size" {
  description = "Size of the root volume in GB"
  type        = number
  default     = 20
}

variable "kms_key_id" {
  description = "ID of the KMS key for EBS encryption"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "target_group_arn" {
  description = "ARN of the target group for the ASG"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the ASG"
  type        = list(string)
}

variable "desired_capacity" {
  description = "Desired number of instances in the ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in the ASG"
  type        = number
  default     = 4
}

variable "min_size" {
  description = "Minimum number of instances in the ASG"
  type        = number
  default     = 1
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "load_balancer_arn" {
  description = "ARN of the load balancer"
  type        = string
}
