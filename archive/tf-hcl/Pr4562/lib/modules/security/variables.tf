# modules/security/variables.tf - Security Module Variables

variable "vpc_a_id" {
  description = "ID of VPC-A"
  type        = string
}

variable "vpc_b_id" {
  description = "ID of VPC-B"
  type        = string
}

variable "vpc_a_cidr" {
  description = "CIDR block of VPC-A"
  type        = string
}

variable "vpc_b_cidr" {
  description = "CIDR block of VPC-B"
  type        = string
}

variable "allowed_ports" {
  description = "List of allowed ports for cross-VPC communication"
  type        = list(string)
  default     = ["443", "8080", "3306"]
}

variable "suffix" {
  description = "Random suffix for resource naming"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}