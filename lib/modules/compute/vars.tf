variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "environment" {
  description = "The environment (e.g., staging, production)"
  type        = string
}

variable "app_subnet_ids" {
  description = "A list of subnet IDs for the application"
  type        = list(string)
}

variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}

variable "instance_type" {
  description = "The EC2 instance type"
  type        = string
}

variable "ami_id" {
  description = "The ID of the AMI to use for the EC2 instances"
  type        = string
}

variable "ec2_sg_id" {
  description = "The ID of the security group for the EC2 instances"
  type        = string
}

variable "ec2_iam_profile" {
  description = "The name of the IAM instance profile for the EC2 instances"
  type        = string
}

variable "ebs_kms_key_arn" {
  description = "The ARN of the KMS key for EBS encryption"
  type        = string
}

variable "log_group_name" {
  description = "The name of the CloudWatch log group"
  type        = string
}

variable "tg_arn" {
  description = "The ARN of the target group"
  type        = string
}

variable "common_tags" {
  description = "A map of common tags to apply to all resources"
  type        = map(string)
}
