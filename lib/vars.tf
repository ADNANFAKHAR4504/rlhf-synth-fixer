variable "aws_region" {
  description = "The AWS region to deploy the infrastructure to."
  type        = string
}

variable "author" {
  description = "The author of the infrastructure."
  type        = string
}

variable "created_date" {
  description = "The date the infrastructure was created."
  type        = string
}

variable "availability_zones" {
  description = "The availability zones to deploy the infrastructure to."
  type        = list(string)
}

variable "account_id" {
  description = "The AWS account ID."
  type        = string
}

variable "project_name" {
  description = "The name of the project."
  type        = string
}

variable "environment" {
  description = "The environment to deploy the infrastructure to."
  type        = string
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC."
  type        = string
}

variable "public_subnet_cidrs" {
  description = "The CIDR blocks for the public subnets."
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "The CIDR blocks for the private subnets."
  type        = list(string)
}

variable "db_username" {
  description = "The username for the database."
  type        = string
}

variable "db_password" {
  description = "The password for the database."
  type        = string
  sensitive   = true
}

variable "ami_id" {
  description = "The ID of the AMI to use for the EC2 instances."
  type        = string
}

variable "instance_type" {
  description = "The type of EC2 instance to use."
  type        = string
}
