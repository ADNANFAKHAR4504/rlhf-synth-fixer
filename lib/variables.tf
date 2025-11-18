# Core variables with validation
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
  default     = "devtest"

  validation {
    condition     = can(regex("^[a-z0-9]{6,12}$", var.environment_suffix))
    error_message = "Environment suffix must be 6-12 lowercase alphanumeric characters."
  }
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "iac-test-automations"

  validation {
    condition     = length(var.project_name) > 2 && length(var.project_name) <= 32
    error_message = "Project name must be between 3 and 32 characters."
  }
}

variable "east_vpc_cidr" {
  description = "CIDR block for the primary (us-east-1) VPC"
  type        = string
  default     = "10.10.0.0/16"
}

variable "west_vpc_cidr" {
  description = "CIDR block for the secondary (us-west-2) VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "team_name" {
  description = "Team responsible for the infrastructure"
  type        = string
  default     = "platform"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "engineering"
}

variable "compliance_level" {
  description = "Compliance level (standard, high, critical)"
  type        = string
  default     = "high"

  validation {
    condition     = can(regex("^(standard|high|critical)$", var.compliance_level))
    error_message = "Compliance level must be standard, high, or critical."
  }
}

# EC2 variables
variable "web_instance_type" {
  description = "Instance type for web tier"
  type        = string
  default     = "t3.medium"

  validation {
    condition     = can(regex("^t3\\.(micro|small|medium|large|xlarge|2xlarge)$", var.web_instance_type))
    error_message = "Web instance type must be a valid t3 instance type."
  }
}

variable "app_instance_type" {
  description = "Instance type for application tier"
  type        = string
  default     = "t3.large"
}

variable "worker_instance_type" {
  description = "Instance type for worker tier"
  type        = string
  default     = "t3.large"
}

# Auto Scaling variables
variable "asg_configurations" {
  description = "Auto Scaling Group configurations"
  type = map(object({
    min_size         = number
    max_size         = number
    desired_capacity = number
  }))
  default = {
    web = {
      min_size         = 2
      max_size         = 10
      desired_capacity = 3
    }
    app = {
      min_size         = 3
      max_size         = 15
      desired_capacity = 5
    }
    worker = {
      min_size         = 2
      max_size         = 8
      desired_capacity = 3
    }
  }

  validation {
    condition = alltrue([
      for k, v in var.asg_configurations :
      v.min_size >= 1 && v.min_size <= v.desired_capacity && v.desired_capacity <= v.max_size
    ])
    error_message = "ASG sizes must satisfy: 1 <= min <= desired <= max."
  }
}

# RDS variables
variable "mysql_instance_class" {
  description = "Instance class for MySQL Aurora cluster"
  type        = string
  default     = "db.r6g.large"

  validation {
    condition     = can(regex("^db\\.(r6g|r5)\\.(large|xlarge|2xlarge|4xlarge)$", var.mysql_instance_class))
    error_message = "MySQL instance class must be a valid Aurora instance type."
  }
}

variable "mysql_instance_count" {
  description = "Number of instances in MySQL cluster (including writer)"
  type        = number
  default     = 2

  validation {
    condition     = var.mysql_instance_count >= 1 && var.mysql_instance_count <= 15
    error_message = "MySQL instance count must be between 1 and 15."
  }
}

variable "mysql_database_name" {
  description = "Database name for MySQL cluster"
  type        = string
  default     = "fintech_db"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{1,63}$", var.mysql_database_name))
    error_message = "Database name must start with a letter and contain only alphanumeric characters and underscores."
  }
}

variable "postgres_instance_class" {
  description = "Instance class for PostgreSQL Aurora cluster"
  type        = string
  default     = "db.r6g.large"
}

variable "postgres_instance_count" {
  description = "Number of instances in PostgreSQL cluster"
  type        = number
  default     = 2
}

variable "postgres_database_name" {
  description = "Database name for PostgreSQL cluster"
  type        = string
  default     = "analytics_db"
}

# Optional features
variable "enable_state_locking" {
  description = "Enable DynamoDB table for Terraform state locking"
  type        = bool
  default     = true
}

variable "enable_ssm_secrets" {
  description = "Enable AWS Systems Manager Parameter Store for secrets"
  type        = bool
  default     = true
}

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution for static assets"
  type        = bool
  default     = true
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = can(regex("^PriceClass_(All|200|100)$", var.cloudfront_price_class))
    error_message = "CloudFront price class must be PriceClass_All, PriceClass_200, or PriceClass_100."
  }
}
# Database credentials
variable "db_master_username" {
  description = "Master username for RDS clusters"
  type        = string
  default     = "admin"
  sensitive   = true

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{1,15}$", var.db_master_username))
    error_message = "Database username must start with a letter and be 2-16 characters."
  }
}

variable "db_master_password" {
  description = "Master password for RDS clusters"
  type        = string
  default     = "TempPassword123!"
  sensitive   = true

  validation {
    condition     = length(var.db_master_password) >= 8
    error_message = "Database password must be at least 8 characters."
  }
}