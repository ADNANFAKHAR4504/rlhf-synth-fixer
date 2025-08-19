variable "project_name" {
  type        = string
  description = "The name of the project"
}

variable "environment" {
  type        = string
  description = "The environment name"
}

variable "vpc_cidr" {
  type        = string
  description = "The CIDR block for the VPC"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "The CIDR blocks for the public subnets"
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "The CIDR blocks for the private subnets"
}

variable "db_username" {
  type        = string
  description = "The username for the RDS instance"
  sensitive   = true
}

variable "db_password" {
  type        = string
  description = "The password for the RDS instance"
  sensitive   = true
}

variable "ami_id" {
  type        = string
  description = "The ID of the AMI to use for the EC2 instances"
}

variable "instance_type" {
  type        = string
  description = "The instance type to use for the EC2 instances"
}
