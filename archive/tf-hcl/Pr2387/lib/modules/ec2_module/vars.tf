# EC2 Module Variables
variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9-]+$", var.project_name))
    error_message = "Project name must contain only alphanumeric characters and hyphens."
  }
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for EC2 instances"
  type        = list(string)
  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "At least 2 private subnets are required for high availability."
  }
}

variable "web_security_group_id" {
  description = "Security group ID for web servers"
  type        = string
  validation {
    condition     = can(regex("^sg-", var.web_security_group_id))
    error_message = "Security group ID must be a valid security group identifier."
  }
}

variable "iam_instance_profile_name" {
  description = "IAM instance profile name for EC2 instances"
  type        = string
}

variable "target_group_arn" {
  description = "Target group ARN for Auto Scaling Group"
  type        = string
  validation {
    condition     = can(regex("^arn:aws:elasticloadbalancing:", var.target_group_arn))
    error_message = "Target group ARN must be a valid ELB target group ARN."
  }
}

# Instance Configuration
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
  validation {
    condition     = can(regex("^[a-z][0-9][a-z]?\\.", var.instance_type))
    error_message = "Instance type must be a valid EC2 instance type."
  }
}

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

variable "app_port" {
  description = "Application port number"
  type        = number
  default     = 8080
  validation {
    condition     = var.app_port > 0 && var.app_port <= 65535
    error_message = "Application port must be between 1 and 65535."
  }
}

# Auto Scaling Configuration
variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 1
  validation {
    condition     = var.min_size >= 0
    error_message = "Minimum size must be non-negative."
  }
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
  validation {
    condition     = var.max_size >= 1
    error_message = "Maximum size must be at least 1."
  }
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
  validation {
    condition     = var.desired_capacity >= 1
    error_message = "Desired capacity must be at least 1."
  }
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

# Scaling Policies
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

# CloudWatch Alarms
variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms for auto scaling"
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

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
  default     = {}
}