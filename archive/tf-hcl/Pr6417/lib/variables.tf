variable "environmentSuffix" {
  description = "Environment suffix for resource naming to support multiple PR environments"
  type        = string
  validation {
    condition     = length(var.environmentSuffix) > 0 && length(var.environmentSuffix) <= 20
    error_message = "environmentSuffix must be between 1 and 20 characters"
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "ap-southeast-1"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "aws_region must be a valid AWS region format"
  }
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.micro"
  validation {
    condition     = can(regex("^[a-z][0-9][a-z]?\\.(nano|micro|small|medium|large|xlarge|[0-9]+xlarge)$", var.instance_type))
    error_message = "instance_type must be a valid EC2 instance type"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid CIDR block"
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = map(string)
  default = {
    "subnet-1" = "10.0.1.0/24"
    "subnet-2" = "10.0.2.0/24"
  }
  validation {
    condition     = alltrue([for cidr in values(var.public_subnet_cidrs) : can(cidrhost(cidr, 0))])
    error_message = "All public_subnet_cidrs must be valid CIDR blocks"
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = map(string)
  default = {
    "subnet-1" = "10.0.10.0/24"
    "subnet-2" = "10.0.11.0/24"
  }
  validation {
    condition     = alltrue([for cidr in values(var.private_subnet_cidrs) : can(cidrhost(cidr, 0))])
    error_message = "All private_subnet_cidrs must be valid CIDR blocks"
  }
}

variable "availability_zones" {
  description = "Availability zones for subnet placement"
  type        = map(string)
  default = {
    "subnet-1" = "ap-southeast-1a"
    "subnet-2" = "ap-southeast-1b"
  }
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
  validation {
    condition     = can(regex("^db\\.[a-z][0-9][a-z]?\\.(micro|small|medium|large|xlarge|[0-9]+xlarge)$", var.db_instance_class))
    error_message = "db_instance_class must be a valid RDS instance class"
  }
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
  validation {
    condition     = var.db_allocated_storage >= 20 && var.db_allocated_storage <= 65536
    error_message = "db_allocated_storage must be between 20 and 65536 GB"
  }
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0.35"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "infrastructure-refactor"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "engineering"
}

variable "ec2_instances" {
  description = "Map of EC2 instances to create"
  type = map(object({
    instance_type = string
    subnet_key    = string
  }))
  default = {
    "web-1" = {
      instance_type = "t3.micro"
      subnet_key    = "subnet-1"
    }
    "web-2" = {
      instance_type = "t3.micro"
      subnet_key    = "subnet-2"
    }
  }
}

variable "enable_monitoring" {
  description = "Enable detailed monitoring for EC2 instances"
  type        = bool
  default     = true
}

variable "secrets_manager_secret_name" {
  description = "Name of the AWS Secrets Manager secret for database credentials"
  type        = string
  default     = "rds-db-credentials"
}