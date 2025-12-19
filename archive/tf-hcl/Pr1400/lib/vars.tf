# Variables
variable "project" {
  description = "Project Name"
  type        = string
  default     = "IAC-291320"
}

variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for private subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "Name of the EC2 Key Pair"
  type        = string
  default     = "prod-key"
  sensitive   = true
}

variable "db_password_length" {
  description = "Length of the database password"
  type        = number
  default     = 16
  sensitive   = true
}