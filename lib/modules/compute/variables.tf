variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ID of the ALB security group"
  type        = string
}

variable "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  type        = string
}

variable "instance_profile_name" {
  description = "Name of the IAM instance profile"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of the KMS key"
  type        = string
}