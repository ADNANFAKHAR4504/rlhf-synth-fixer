variable "project_name" {
  type        = string
  description = "The name of the project"
  default     = "tap-app"
}

variable "environment" {
  type        = string
  description = "The environment name"
  default     = "dev"
}

variable "vpc_cidr" {
  type        = string
  description = "The CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "The CIDR blocks for the public subnets"
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "The CIDR blocks for the private subnets"
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "db_username" {
  type        = string
  description = "The username for the RDS instance"
  sensitive   = true
  default     = "admin"
}

variable "db_password" {
  type        = string
  description = "The password for the RDS instance"
  sensitive   = true
  default     = "password"
}

variable "ami_id" {
  type        = string
  description = "The ID of the AMI to use for the EC2 instances"
  default     = "ami-0c55b159cbfafe1f0"
}

variable "instance_type" {
  type        = string
  description = "The instance type to use for the EC2 instances"
  default     = "t2.micro"
}
