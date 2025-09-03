########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

locals {
    env = terraform.workspace

    aws_profile = {
        default =  "default"
        staging = "staging"
        production = "prod"
    }

    common_tags = {
      Project       = "multi-account-awsprofile-infrastructure"
      ManagedBy     = "terraform"
      CostCenter    = "engineering"
      Owner         = "platform-team"
    }

}

variable "environment" {
    default = "default"
}

variable "min_size" {
    type = number
    default = 1
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "instance_type" {
    default = "t3.micro"
}

variable "max_size" {
    type = number
    default = 2
}

variable "desired_capacity" {
    type = number
    default = 1
}