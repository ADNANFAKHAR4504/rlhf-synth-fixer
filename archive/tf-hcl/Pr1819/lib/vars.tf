variable "aws_region" {
  description = "The AWS region to deploy the infrastructure to."
  type        = string
  default     = "us-east-1"
}

variable "author" {
  description = "The author of the infrastructure."
  type        = string
  default     = "ngwakoleslieelijah"
}

variable "created_date" {
  description = "The date the infrastructure was created."
  type        = string
  default     = "2025-08-14T21:08:49Z"
}

variable "availability_zones" {
  description = "The availability zones to deploy the infrastructure to."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "account_id" {
  description = "The AWS account ID."
  type        = string
  default     = "123456789012"
}

variable "project_name" {
  description = "The name of the project."
  type        = string
  default     = "IaC-AWS-Nova-Model-Breaking"
}

variable "environment" {
  description = "The environment to deploy the infrastructure to."
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "The CIDR blocks for the public subnets."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "The CIDR blocks for the private subnets."
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "db_username" {
  description = "The username for the database."
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "The password for the database."
  type        = string
  sensitive   = true
  default     = "password"
}

variable "ami_id" {
  description = "The ID of the AMI to use for the EC2 instances."
  type        = string
  default     = "ami-0c520850203c586f6"
}

variable "instance_type" {
  description = "The type of EC2 instance to use."
  type        = string
  default     = "t2.micro"
}
