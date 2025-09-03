# Local values
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
  }

  # Environment-specific configurations
  environment_config = {
    staging = {
      instance_type                = "t3.small"
      min_size                    = 1
      max_size                    = 3
      desired_capacity            = 2
      enable_deletion_protection  = false
      enable_nat_gateway         = false
      enable_flow_logs           = false
      db_instance_class          = "db.t3.micro"
    }
    production = {
      instance_type                = "t3.large"
      min_size                    = 2
      max_size                    = 10
      desired_capacity            = 3
      enable_deletion_protection  = true
      enable_nat_gateway         = true
      enable_flow_logs           = true
      db_instance_class          = "db.t3.small"
    }
  }

  current_config = local.environment_config[var.environment]
}


# Root Variables Configuration

# Root Variables Configuration

# General Configuration
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
  default = "staging"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9-]+$", var.project_name))
    error_message = "Project name must contain only alphanumeric characters and hyphens."
  }
  default = "TFMULTITURN"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "Turing"
}

variable "cost_center" {
  description = "Cost center for resource billing"
  type        = string
  default     = "Turing"
}


# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
  validation {
    condition     = length(var.public_subnet_cidrs) >= 2
    error_message = "At least 2 public subnets are required for high availability."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
  validation {
    condition     = length(var.private_subnet_cidrs) >= 2
    error_message = "At least 2 private subnets are required for high availability."
  }
}

variable "flow_logs_retention_days" {
  description = "Retention period for VPC Flow Logs in days"
  type        = number
  default     = 14
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.flow_logs_retention_days)
    error_message = "Flow logs retention days must be a valid CloudWatch Logs retention period."
  }
}

# Security Configuration
variable "app_port" {
  description = "Application port number"
  type        = number
  default     = 80
  validation {
    condition     = var.app_port > 0 && var.app_port <= 65535
    error_message = "Application port must be between 1 and 65535."
  }
}

variable "db_port" {
  description = "Database port number"
  type        = number
  default     = 3306
  validation {
    condition     = var.db_port > 0 && var.db_port <= 65535
    error_message = "Database port must be between 1 and 65535."
  }
}

variable "enable_ssh_access" {
  description = "Enable SSH access via bastion host"
  type        = bool
  default     = false
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = []
  validation {
    condition = alltrue([
      for cidr in var.ssh_allowed_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "All SSH allowed CIDRs must be valid IPv4 CIDR blocks."
  }
}

variable "kms_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7
  validation {
    condition     = var.kms_deletion_window >= 7 && var.kms_deletion_window <= 30
    error_message = "KMS deletion window must be between 7 and 30 days."
  }
}

# ALB Configuration
variable "target_protocol" {
  description = "Protocol to use for routing traffic to targets"
  type        = string
  default     = "HTTP"
}

variable "alb_idle_timeout" {
  description = "Time in seconds that connections are allowed to be idle"
  type        = number
  default     = 60
  validation {
    condition     = var.alb_idle_timeout >= 1 && var.alb_idle_timeout <= 4000
    error_message = "ALB idle timeout must be between 1 and 4000 seconds."
  }
}

variable "enable_alb_access_logs" {
  description = "Enable ALB access logs"
  type        = bool
  default     = false
}

variable "alb_access_logs_bucket" {
  description = "S3 bucket for ALB access logs"
  type        = string
  default     = ""
}

variable "alb_access_logs_prefix" {
  description = "S3 prefix for ALB access logs"
  type        = string
  default     = "alb-logs"
}

# Health Check Configuration
variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/"
}

variable "health_check_healthy_threshold" {
  description = "Number of consecutive health checks successes required"
  type        = number
  default     = 2
  validation {
    condition     = var.health_check_healthy_threshold >= 2 && var.health_check_healthy_threshold <= 10
    error_message = "Health check healthy threshold must be between 2 and 10."
  }
}

variable "health_check_interval" {
  description = "Approximate amount of time between health checks"
  type        = number
  default     = 30
  validation {
    condition     = var.health_check_interval >= 5 && var.health_check_interval <= 300
    error_message = "Health check interval must be between 5 and 300 seconds."
  }
}

variable "health_check_matcher" {
  description = "Response codes to use when checking for a healthy responses"
  type        = string
  default     = "200"
}

variable "health_check_timeout" {
  description = "Amount of time to wait when receiving a response from the health check"
  type        = number
  default     = 5
  validation {
    condition     = var.health_check_timeout >= 2 && var.health_check_timeout <= 120
    error_message = "Health check timeout must be between 2 and 120 seconds."
  }
}

variable "health_check_unhealthy_threshold" {
  description = "Number of consecutive health check failures required"
  type        = number
  default     = 2
  validation {
    condition     = var.health_check_unhealthy_threshold >= 2 && var.health_check_unhealthy_threshold <= 10
    error_message = "Health check unhealthy threshold must be between 2 and 10."
  }
}

# ALB Stickiness Configuration
variable "enable_alb_stickiness" {
  description = "Enable load balancer cookie stickiness"
  type        = bool
  default     = false
}

variable "alb_stickiness_duration" {
  description = "Time period for which requests from a client should be routed to the same target"
  type        = number
  default     = 86400
  validation {
    condition     = var.alb_stickiness_duration >= 1 && var.alb_stickiness_duration <= 604800
    error_message = "ALB stickiness duration must be between 1 second and 7 days (604800 seconds)."
  }
}

# ALB CloudWatch Alarms
variable "alb_response_time_threshold" {
  description = "Response time threshold for CloudWatch alarm (in seconds)"
  type        = number
  default     = 1.0
}

variable "alb_unhealthy_hosts_threshold" {
  description = "Unhealthy hosts threshold for CloudWatch alarm"
  type        = number
  default     = 0
}

# WAF Configuration
variable "enable_waf" {
  description = "Enable WAF for ALB"
  type        = bool
  default     = false
}

variable "waf_web_acl_arn" {
  description = "ARN of WAF Web ACL to associate with ALB"
  type        = string
  default     = ""
}

# EC2 Configuration
variable "ami_id" {
  description = "AMI ID for EC2 instances (leave empty for latest Amazon Linux 2)"
  type        = string
  default     = ""
}

variable "key_pair_name" {
  description = "EC2 Key Pair name for SSH access"
  type        = string
  default     = ""
}

variable "health_check_type" {
  description = "Health check type for ASG"
  type        = string
  default     = "ELB"
  validation {
    condition     = contains(["EC2", "ELB"], var.health_check_type)
    error_message = "Health check type must be either EC2 or ELB."
  }
}

variable "health_check_grace_period" {
  description = "Health check grace period in seconds"
  type        = number
  default     = 300
  validation {
    condition     = var.health_check_grace_period >= 0
    error_message = "Health check grace period must be non-negative."
  }
}

# Instance Refresh Configuration
variable "instance_refresh_min_healthy_percentage" {
  description = "Minimum healthy percentage during instance refresh"
  type        = number
  default     = 50
  validation {
    condition     = var.instance_refresh_min_healthy_percentage >= 0 && var.instance_refresh_min_healthy_percentage <= 100
    error_message = "Instance refresh minimum healthy percentage must be between 0 and 100."
  }
}

variable "instance_warmup" {
  description = "Instance warmup time in seconds"
  type        = number
  default     = 300
  validation {
    condition     = var.instance_warmup >= 0
    error_message = "Instance warmup must be non-negative."
  }
}

variable "termination_policies" {
  description = "Termination policies for ASG"
  type        = list(string)
  default     = ["Default"]
  validation {
    condition = alltrue([
      for policy in var.termination_policies : 
      contains(["OldestInstance", "NewestInstance", "OldestLaunchConfiguration", "OldestLaunchTemplate", "ClosestToNextInstanceHour", "Default"], policy)
    ])
    error_message = "Termination policies must be valid ASG termination policies."
  }
}

variable "protect_from_scale_in" {
  description = "Protect instances from scale in"
  type        = bool
  default     = false
}

# Auto Scaling Policies
variable "scale_up_adjustment" {
  description = "Number of instances to add when scaling up"
  type        = number
  default     = 1
}

variable "scale_up_cooldown" {
  description = "Cooldown period after scaling up (seconds)"
  type        = number
  default     = 300
  validation {
    condition     = var.scale_up_cooldown >= 0
    error_message = "Scale up cooldown must be non-negative."
  }
}

variable "scale_down_adjustment" {
  description = "Number of instances to remove when scaling down"
  type        = number
  default     = -1
}

variable "scale_down_cooldown" {
  description = "Cooldown period after scaling down (seconds)"
  type        = number
  default     = 300
  validation {
    condition     = var.scale_down_cooldown >= 0
    error_message = "Scale down cooldown must be non-negative."
  }
}

# CloudWatch Configuration
variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms"
  type        = bool
  default     = true
}

variable "cpu_high_threshold" {
  description = "CPU utilization threshold for scaling up"
  type        = number
  default     = 80
  validation {
    condition     = var.cpu_high_threshold > 0 && var.cpu_high_threshold <= 100
    error_message = "CPU high threshold must be between 0 and 100."
  }
}

variable "cpu_high_evaluation_periods" {
  description = "Number of evaluation periods for CPU high alarm"
  type        = number
  default     = 2
  validation {
    condition     = var.cpu_high_evaluation_periods >= 1
    error_message = "CPU high evaluation periods must be at least 1."
  }
}

variable "cpu_high_period" {
  description = "Period for CPU high alarm in seconds"
  type        = number
  default     = 300
  validation {
    condition     = var.cpu_high_period >= 60
    error_message = "CPU high period must be at least 60 seconds."
  }
}

variable "cpu_low_threshold" {
  description = "CPU utilization threshold for scaling down"
  type        = number
  default     = 10
  validation {
    condition     = var.cpu_low_threshold >= 0 && var.cpu_low_threshold < 100
    error_message = "CPU low threshold must be between 0 and 100."
  }
}

variable "cpu_low_evaluation_periods" {
  description = "Number of evaluation periods for CPU low alarm"
  type        = number
  default     = 2
  validation {
    condition     = var.cpu_low_evaluation_periods >= 1
    error_message = "CPU low evaluation periods must be at least 1."
  }
}

variable "cpu_low_period" {
  description = "Period for CPU low alarm in seconds"
  type        = number
  default     = 300
  validation {
    condition     = var.cpu_low_period >= 60
    error_message = "CPU low period must be at least 60 seconds."
  }
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarm triggers"
  type        = list(string)
  default     = []
}

# Instance Configuration
variable "ebs_optimized" {
  description = "Enable EBS optimization"
  type        = bool
  default     = true
}

variable "detailed_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = false
}

variable "block_device_mappings" {
  description = "Block device mappings for instances"
  type = list(object({
    device_name           = string
    volume_size           = number
    volume_type           = string
    iops                  = number
    throughput            = number
    encrypted             = bool
    kms_key_id           = string
    delete_on_termination = bool
  }))
  default = [
    {
      device_name           = "/dev/xvda"
      volume_size           = 20
      volume_type           = "gp3"
      iops                  = 3000
      throughput            = 125
      encrypted             = true
      kms_key_id           = ""
      delete_on_termination = true
    }
  ]
}

# Secrets and Configuration
variable "secrets_manager_secret_name" {
  description = "Name of the Secrets Manager secret"
  type        = string
  default     = ""
}

variable "additional_packages" {
  description = "Additional packages to install"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch Logs retention period."
  }
}

# Notifications
variable "enable_notifications" {
  description = "Enable SNS notifications"
  type        = bool
  default     = false
}

variable "notification_emails" {
  description = "List of email addresses for notifications"
  type        = list(string)
  default     = []
}