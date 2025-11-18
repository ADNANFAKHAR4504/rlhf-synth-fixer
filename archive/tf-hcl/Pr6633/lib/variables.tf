variable "environment_suffix" {
  description = "Suffix to append to resource names for environment separation"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "primary_region" {
  description = "Primary AWS region for resource deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "default_tags" {
  description = "Default tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "FintechApp"
    Team       = "DevOps"
    CostCenter = "Engineering"
  }
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
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "availability_zones" {
  description = "Availability zones for subnet placement"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

# EC2 Module Variables
variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "ec2_ami_id" {
  description = "AMI ID for EC2 instances (leave empty to use latest Amazon Linux 2)"
  type        = string
  default     = ""
}

variable "asg_min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
  default     = 6
}

variable "asg_desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
  default     = 2
}

# RDS Module Variables
variable "rds_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.15"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "rds_database_name" {
  description = "Name of the initial database"
  type        = string
  default     = "fintechdb"
}

variable "rds_master_username" {
  description = "Master username for RDS"
  type        = string
  default     = "dbadmin"
}

variable "rds_master_password" {
  description = "Master password for RDS (use environment variable TF_VAR_rds_master_password)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.rds_master_password) >= 8
    error_message = "RDS master password must be at least 8 characters long."
  }
}

variable "rds_backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "use_existing_vpc" {
  description = "Whether to use existing VPC (for migration)"
  type        = bool
  default     = false
}

# Security Group Rules Configuration
variable "security_group_rules" {
  description = "Map of security group rules to create dynamically"
  type = map(object({
    type        = string
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    description = string
  }))
  default = {
    http = {
      type        = "ingress"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "Allow HTTP traffic"
    }
    https = {
      type        = "ingress"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "Allow HTTPS traffic"
    }
    ssh = {
      type        = "ingress"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = ["10.0.0.0/16"]
      description = "Allow SSH from VPC"
    }
    postgres = {
      type        = "ingress"
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      cidr_blocks = ["10.0.0.0/16"]
      description = "Allow PostgreSQL from VPC"
    }
    egress_all = {
      type        = "egress"
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
      description = "Allow all outbound traffic"
    }
  }
}
