variable "project_name" {
  type        = string
  description = "The name of the project"
}

variable "environment" {
  type        = string
  description = "The environment name"
}

variable "vpc_id" {
  type        = string
  description = "The ID of the VPC"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "The IDs of the public subnets"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "The IDs of the private subnets"
}

variable "ec2_sg_id" {
  type        = string
  description = "The ID of the EC2 security group"
}

variable "alb_sg_id" {
  type        = string
  description = "The ID of the ALB security group"
}

variable "instance_profile_name" {
  type        = string
  description = "The name of the EC2 instance profile"
}

variable "ami_id" {
  type        = string
  description = "The ID of the AMI to use for the EC2 instances"
}

variable "instance_type" {
  type        = string
  description = "The instance type to use for the EC2 instances"
}
