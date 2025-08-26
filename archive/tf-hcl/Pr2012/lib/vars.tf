# Global variables for the Terraform configuration
# Note: Default values are loaded from lib/terraform.tfvars
# To switch environments, pass -var-file=enviroments/<env>.tfvars when running Terraform.

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project for resource tagging"
  type        = string
  default     = "secure-iam-setup"
}

variable "allowed_ip_cidr" {
  description = "CIDR block for IP restriction policy"
  type        = string
  default     = "203.0.113.0/24"
}

variable "iam_users" {
  description = "List of IAM users to create"
  type = list(object({
    username = string
    groups   = list(string)
  }))
  default = [
    {
      username = "developer1"
      groups   = ["developers"]
    },
    {
      username = "admin1"
      groups   = ["administrators"]
    }
  ]
}

variable "iam_roles" {
  description = "List of IAM roles to create"
  type = list(object({
    name               = string
    description        = string
    assume_role_policy = string
    managed_policies   = list(string)
  }))
  default = [
    {
      name               = "EC2ReadOnlyRole"
      description        = "Role with read-only access to EC2"
      assume_role_policy = "ec2"
      managed_policies   = ["arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"]
    }
  ]
}

variable "force_mfa" {
  description = "Enforce MFA for all IAM users"
  type        = bool
  default     = true
}