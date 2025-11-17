variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "backup_retention_period" {
  description = "RDS backup retention period"
  type        = number
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold"
  type        = number
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "ssh_key_name" {
  description = "SSH key name"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}