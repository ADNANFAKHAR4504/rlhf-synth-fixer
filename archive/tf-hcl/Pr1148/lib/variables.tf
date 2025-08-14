# variables.tf
# Variable definitions for the secure AWS infrastructure

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
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

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "DevOpsTeam"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "secure-foundation"
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "10.0.0.0/8" # Restrict to internal network only
}

# Common tags to be applied to all resources
locals {
  # Create a unique suffix for resource naming
  name_suffix = var.environment_suffix != "" ? var.environment_suffix : random_id.resource_suffix.hex

  common_tags = {
    Name        = "${var.project_name}-${local.name_suffix}"
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }
}
