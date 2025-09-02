## Root level configuration

**main.tf**
```hcl
# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Module
module "vpc_module" {
    source = "./modules/vpc_module"
    
    environment = var.environment
    project_name = var.project_name
    vpc_cidr = var.vpc_cidr
    public_subnet_cidrs = var.public_subnet_cidrs
    private_subnet_cidrs = var.private_subnet_cidrs
    enable_nat_gateway = local.current_config.enable_nat_gateway
    enable_flow_logs = local.current_config.enable_flow_logs
    flow_logs_retention_days = var.flow_logs_retention_days
    common_tags = local.common_tags
}

# Security Module
module "security_module" {
    source = "./modules/security_module"

    environment         = var.environment
    project_name        = var.project_name
    vpc_id             = module.vpc_module.vpc_id
    app_port           = var.app_port
    db_port            = var.db_port
    enable_ssh_access  = var.enable_ssh_access
    ssh_allowed_cidrs  = var.ssh_allowed_cidrs
    kms_deletion_window = var.kms_deletion_window
    common_tags        = local.common_tags

    depends_on = [module.vpc_module]
}

# Application Load Balancer Module
module "alb_module" {
    source = "./modules/alb_module"

    environment                = var.environment
    project_name              = var.project_name
    vpc_id                    = module.vpc_module.vpc_id
    public_subnet_ids         = module.vpc_module.public_subnet_ids
    alb_security_group_id     = module.security_module.alb_security_group_id
    target_port               = var.app_port
    target_protocol           = var.target_protocol
    enable_deletion_protection = local.current_config.enable_deletion_protection
    idle_timeout              = var.alb_idle_timeout
    enable_access_logs        = var.enable_alb_access_logs
    access_logs_bucket        = var.alb_access_logs_bucket
    access_logs_prefix        = var.alb_access_logs_prefix
    health_check_path         = var.health_check_path
    health_check_healthy_threshold = var.health_check_healthy_threshold
    health_check_interval     = var.health_check_interval
    health_check_matcher      = var.health_check_matcher
    health_check_timeout      = var.health_check_timeout
    health_check_unhealthy_threshold = var.health_check_unhealthy_threshold
    enable_stickiness         = var.enable_alb_stickiness
    stickiness_duration       = var.alb_stickiness_duration
    enable_cloudwatch_alarms  = var.enable_cloudwatch_alarms
    response_time_threshold   = var.alb_response_time_threshold
    unhealthy_hosts_threshold = var.alb_unhealthy_hosts_threshold
    alarm_actions            = var.alarm_actions
    enable_waf               = var.enable_waf
    waf_web_acl_arn         = var.waf_web_acl_arn
    common_tags             = local.common_tags

    depends_on = [
        module.vpc_module,
        module.security_module
    ]
}

# EC2 Auto Scaling Module
module "ec2_module" {
    source = "./modules/ec2_module"

    environment                = var.environment
    project_name              = var.project_name
    private_subnet_ids        = module.vpc_module.private_subnet_ids
    web_security_group_id     = module.security_module.web_security_group_id
    iam_instance_profile_name = module.security_module.ec2_instance_profile_name
    target_group_arn          = module.alb_module.target_group_arn
    instance_type             = local.current_config.instance_type
    ami_id                    = var.ami_id
    key_pair_name             = var.key_pair_name
    app_port                  = var.app_port
    min_size                  = local.current_config.min_size
    max_size                  = local.current_config.max_size
    desired_capacity          = local.current_config.desired_capacity
    health_check_type         = var.health_check_type
    health_check_grace_period = var.health_check_grace_period
    instance_refresh_min_healthy_percentage = var.instance_refresh_min_healthy_percentage
    instance_warmup           = var.instance_warmup
    termination_policies      = var.termination_policies
    protect_from_scale_in     = var.protect_from_scale_in
    scale_up_adjustment       = var.scale_up_adjustment
    scale_up_cooldown         = var.scale_up_cooldown
    scale_down_adjustment     = var.scale_down_adjustment
    scale_down_cooldown       = var.scale_down_cooldown
    enable_cloudwatch_alarms  = var.enable_cloudwatch_alarms
    cpu_high_threshold        = var.cpu_high_threshold
    cpu_high_evaluation_periods = var.cpu_high_evaluation_periods
    cpu_high_period           = var.cpu_high_period
    cpu_low_threshold         = var.cpu_low_threshold
    cpu_low_evaluation_periods = var.cpu_low_evaluation_periods
    cpu_low_period            = var.cpu_low_period
    alarm_actions             = var.alarm_actions
    ebs_optimized             = var.ebs_optimized
    detailed_monitoring       = var.detailed_monitoring
    block_device_mappings     = var.block_device_mappings
    secrets_manager_secret_name = var.secrets_manager_secret_name
    additional_packages       = var.additional_packages
    log_retention_days        = var.log_retention_days
    enable_notifications      = var.enable_notifications
    notification_emails       = var.notification_emails
    common_tags               = local.common_tags

    depends_on = [module.vpc_module, module.security_module, module.alb_module]
}


# Root Outputs Configuration

# VPC Outputs
output "vpc_id" {
    description = "ID of the VPC"
    value       = module.vpc_module.vpc_id
}

output "vpc_cidr_block" {
    description = "CIDR block of the VPC"
    value       = module.vpc_module.vpc_cidr_block
}

output "public_subnet_ids" {
    description = "IDs of the public subnets"
    value       = module.vpc_module.public_subnet_ids
}

output "private_subnet_ids" {
    description = "IDs of the private subnets"
    value       = module.vpc_module.private_subnet_ids
}

output "availability_zones" {
    description = "List of availability zones used"
    value       = module.vpc_module.availability_zones
}

# Security Outputs
output "alb_security_group_id" {
    description = "ID of the ALB security group"
    value       = module.security_module.alb_security_group_id
}

output "web_security_group_id" {
    description = "ID of the web security group"
    value       = module.security_module.web_security_group_id
}

output "database_security_group_id" {
    description = "ID of the database security group"
    value       = module.security_module.database_security_group_id
}

output "ec2_iam_role_arn" {
    description = "ARN of the EC2 IAM role"
    value       = module.security_module.ec2_iam_role_arn
}

output "kms_key_id" {
    description = "ID of the KMS key"
    value       = module.security_module.kms_key_id
}

# ALB Outputs
output "alb_dns_name" {
    description = "DNS name of the load balancer"
    value       = module.alb_module.alb_dns_name
}

output "alb_zone_id" {
    description = "Canonical hosted zone ID of the load balancer"
    value       = module.alb_module.alb_zone_id
}

output "alb_arn" {
    description = "ARN of the load balancer"
    value       = module.alb_module.alb_arn
}

output "target_group_arn" {
    description = "ARN of the target group"
    value       = module.alb_module.target_group_arn
}

# EC2 Outputs
output "autoscaling_group_name" {
    description = "Name of the Auto Scaling Group"
    value       = module.ec2_module.autoscaling_group_name
}

output "autoscaling_group_arn" {
    description = "ARN of the Auto Scaling Group"
    value       = module.ec2_module.autoscaling_group_arn
}

output "launch_template_id" {
    description = "ID of the launch template"
    value       = module.ec2_module.launch_template_id
}

output "cloudwatch_log_group_name" {
    description = "Name of the CloudWatch log group"
    value       = module.ec2_module.cloudwatch_log_group_name
}

# Application URL
output "application_url" {
    description = "URL to access the application"
    #   value       = var.ssl_certificate_arn != "" ? "https://${module.alb_module.alb_dns_name}" : "http://${module.alb_module.alb_dns_name}"
    value = module.alb_module.alb_dns_name
}

# Environment Information
output "environment" {
    description = "Environment name"
    value       = var.environment
}

output "project_name" {
    description = "Project name"
    value       = var.project_name
}

output "aws_region" {
    description = "AWS region"
    value       = var.aws_region
}
```

**variables.tf**
```hcl
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
```

## Module Implementation

### 1. VPC Module

**modules/vpc/main.tf**
```hcl
# VPC Module - Network Infrastructure

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Main VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-vpc"
    Type = "vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-igw"
    Type = "internet-gateway"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-public-subnet-${count.index + 1}"
    Type = "public-subnet"
    AZ   = data.aws_availability_zones.available.names[count.index]
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-private-subnet-${count.index + 1}"
    Type = "private-subnet"
    AZ   = data.aws_availability_zones.available.names[count.index]
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? length(var.public_subnet_cidrs) : 0

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-eip-nat-${count.index + 1}"
    Type = "elastic-ip"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? length(var.public_subnet_cidrs) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.main]

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-nat-gateway-${count.index + 1}"
    Type = "nat-gateway"
  })
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-public-rt"
    Type = "route-table"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = var.enable_nat_gateway ? length(var.private_subnet_cidrs) : 1

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = var.enable_nat_gateway ? aws_nat_gateway.main[count.index].id : null
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-private-rt-${count.index + 1}"
    Type = "route-table"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = var.enable_nat_gateway ? aws_route_table.private[count.index].id : aws_route_table.private[0].id
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  count = var.enable_flow_logs ? 1 : 0

  iam_role_arn    = aws_iam_role.flow_log[0].arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-vpc-flow-logs"
    Type = "flow-logs"
  })
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  count = var.enable_flow_logs ? 1 : 0

  name              = "/aws/vpc/${var.environment}-${var.project_name}-flow-logs"
  retention_in_days = var.flow_logs_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-vpc-flow-logs-group"
    Type = "log-group"
  })
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0

  name = "${var.environment}-${var.project_name}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0

  name = "${var.environment}-${var.project_name}-vpc-flow-logs-policy"
  role = aws_iam_role.flow_log[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}
```

**modules/vpc/variables.tf**
```hcl
# VPC Module Variables
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

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
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

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
  default     = {}
}
```

**modules/vpc/outputs.tf**
```hcl
# VPC Module Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_cidrs" {
  description = "CIDR blocks of the public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of the private subnets"
  value       = aws_subnet.private[*].cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = var.enable_nat_gateway ? aws_nat_gateway.main[*].id : []
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}
```

### 2. Security Groups Module

**modules/security-groups/main.tf**
```hcl
# Security Module - Security Groups and IAM

# Application Load Balancer Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.environment}-${var.project_name}-alb-"
  vpc_id      = var.vpc_id
  description = "Security group for Application Load Balancer"

  # HTTP access from anywhere
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access from anywhere
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb-sg"
    Type = "security-group"
    Component = "alb"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Web Server Security Group
resource "aws_security_group" "web" {
  name_prefix = "${var.environment}-${var.project_name}-web-"
  vpc_id      = var.vpc_id
  description = "Security group for web servers"
  
  # Custom application port from ALB
  ingress {
    description     = "HTTP from ALB"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # HTTPS access from ALB
  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # SSH access from bastion (if enabled)
  dynamic "ingress" {
    for_each = var.enable_ssh_access ? [1] : []
    content {
      description     = "SSH from bastion"
      from_port       = 22
      to_port         = 22
      protocol        = "tcp"
      security_groups = var.enable_ssh_access ? [aws_security_group.bastion[0].id] : []
    }
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-web-sg"
    Type = "security-group"
    Component = "web"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Database Security Group
resource "aws_security_group" "database" {
  name_prefix = "${var.environment}-${var.project_name}-db-"
  vpc_id      = var.vpc_id
  description = "Security group for database servers"

  # Database access from web servers
  ingress {
    description     = "Database access from web servers"
    from_port       = var.db_port
    to_port         = var.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  # Database access from bastion (if enabled)
  dynamic "ingress" {
    for_each = var.enable_ssh_access ? [1] : []
    content {
      description     = "Database access from bastion"
      from_port       = var.db_port
      to_port         = var.db_port
      protocol        = "tcp"
      security_groups = var.enable_ssh_access ? [aws_security_group.bastion[0].id] : []
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-db-sg"
    Type = "security-group"
    Component = "database"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Bastion Host Security Group (Optional)
resource "aws_security_group" "bastion" {
  count = var.enable_ssh_access ? 1 : 0

  name_prefix = "${var.environment}-${var.project_name}-bastion-"
  vpc_id      = var.vpc_id
  description = "Security group for bastion host"

  # SSH access from allowed IPs
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-bastion-sg"
    Type = "security-group"
    Component = "bastion"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-ec2-role"
    Type = "iam-role"
    Component = "ec2"
  })
}

# IAM Policy for EC2 instances
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.environment}-${var.project_name}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:secretsmanager:*:*:secret:${var.environment}/${var.project_name}/*",
          "arn:aws:ssm:*:*:parameter/${var.environment}/${var.project_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach AWS managed policies
resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent_server_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-ec2-profile"
    Type = "iam-instance-profile"
    Component = "ec2"
  })
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.environment} ${var.project_name}"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-kms-key"
    Type = "kms-key"
  })
}

# KMS Key Alias
resource "aws_kms_alias" "main" {
  name          = "alias/${var.environment}-${var.project_name}"
  target_key_id = aws_kms_key.main.key_id
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
```

**modules/security-groups/variables.tf**
```hcl
# Security Module Variables
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

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
  validation {
    condition     = can(regex("^vpc-", var.vpc_id))
    error_message = "VPC ID must be a valid VPC identifier."
  }
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

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
  default     = {}
}
```

**modules/security-groups/outputs.tf**
```hcl
# Security Module Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "bastion_security_group_id" {
  description = "ID of the bastion security group"
  value       = var.enable_ssh_access ? aws_security_group.bastion[0].id : null
}

output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_iam_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "kms_alias_name" {
  description = "Name of the KMS key alias"
  value       = aws_kms_alias.main.name
}
```

### 3. Application Load Balancer Module

**modules/alb/main.tf**
```hcl
# ALB Module - Application Load Balancer

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.enable_deletion_protection
  enable_http2              = true
  idle_timeout              = var.idle_timeout

  # Access logs configuration
  dynamic "access_logs" {
    for_each = var.enable_access_logs ? [1] : []
    content {
      bucket  = var.access_logs_bucket
      prefix  = var.access_logs_prefix
      enabled = true
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb"
    Type = "application-load-balancer"
    Component = "alb"
  })
}

# Target Group for web servers
resource "aws_lb_target_group" "web" {
  name     = "${var.environment}-${var.project_name}-web-tg-tf"
  port     = var.target_port
  protocol = var.target_protocol
  vpc_id   = var.vpc_id

  # Health check configuration
  health_check {
    enabled             = true
    healthy_threshold   = var.health_check_healthy_threshold
    interval            = var.health_check_interval
    matcher             = var.health_check_matcher
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = var.target_protocol
    timeout             = var.health_check_timeout
    unhealthy_threshold = var.health_check_unhealthy_threshold
  }

  # Stickiness configuration
  dynamic "stickiness" {
    for_each = var.enable_stickiness ? [1] : []
    content {
      type            = "lb_cookie"
      cookie_duration = var.stickiness_duration
      enabled         = true
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-web-tg"
    Type = "target-group"
    Component = "alb"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
      type             = "forward"
      target_group_arn = aws_lb_target_group.web.arn
    }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-http-listener"
    Type = "alb-listener"
    Component = "alb"
  })
}


# CloudWatch Alarms for ALB
resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.response_time_threshold
  alarm_description   = "This metric monitors ALB target response time"
  alarm_actions       = var.alarm_actions

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb-response-time-alarm"
    Type = "cloudwatch-alarm"
    Component = "alb"
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-alb-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.unhealthy_hosts_threshold
  alarm_description   = "This metric monitors unhealthy ALB targets"
  alarm_actions       = var.alarm_actions

  dimensions = {
    TargetGroup  = aws_lb_target_group.web.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb-unhealthy-hosts-alarm"
    Type = "cloudwatch-alarm"
    Component = "alb"
  })
}

# WAF Web ACL Association (if WAF is enabled)
resource "aws_wafv2_web_acl_association" "alb" {
  count = var.enable_waf ? 1 : 0

  resource_arn = aws_lb.main.arn
  web_acl_arn  = var.waf_web_acl_arn
}
```

**modules/alb/variables.tf**
```hcl
# ALB Module Variables
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

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
  validation {
    condition     = can(regex("^vpc-", var.vpc_id))
    error_message = "VPC ID must be a valid VPC identifier."
  }
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
  validation {
    condition     = length(var.public_subnet_ids) >= 2
    error_message = "At least 2 public subnets are required for ALB high availability."
  }
}

variable "alb_security_group_id" {
  description = "Security group ID for ALB"
  type        = string
  validation {
    condition     = can(regex("^sg-", var.alb_security_group_id))
    error_message = "Security group ID must be a valid security group identifier."
  }
}

variable "target_port" {
  description = "Port on which targets receive traffic"
  type        = number
  default     = 80
  validation {
    condition     = var.target_port > 0 && var.target_port <= 65535
    error_message = "Target port must be between 1 and 65535."
  }
}

variable "target_protocol" {
  description = "Protocol to use for routing traffic to targets"
  type        = string
  default     = "HTTP"
  validation {
    condition     = contains(["HTTP", "HTTPS"], var.target_protocol)
    error_message = "Target protocol must be either HTTP or HTTPS."
  }
}


variable "enable_deletion_protection" {
  description = "Enable deletion protection for ALB"
  type        = bool
  default     = false
}

variable "idle_timeout" {
  description = "Time in seconds that connections are allowed to be idle"
  type        = number
  default     = 60
  validation {
    condition     = var.idle_timeout >= 1 && var.idle_timeout <= 4000
    error_message = "Idle timeout must be between 1 and 4000 seconds."
  }
}

variable "enable_access_logs" {
  description = "Enable ALB access logs"
  type        = bool
  default     = false
}

variable "access_logs_bucket" {
  description = "S3 bucket for ALB access logs"
  type        = string
  default     = ""
}

variable "access_logs_prefix" {
  description = "S3 prefix for ALB access logs"
  type        = string
  default     = "alb-logs"
}

# Health Check Variables
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
  default     = 10
  validation {
    condition     = var.health_check_timeout >= 2 && var.health_check_timeout <= 120
    error_message = "Health check timeout must be between 2 and 120 seconds."
  }
}

variable "health_check_unhealthy_threshold" {
  description = "Number of consecutive health check failures required"
  type        = number
  default     = 3
  validation {
    condition     = var.health_check_unhealthy_threshold >= 2 && var.health_check_unhealthy_threshold <= 10
    error_message = "Health check unhealthy threshold must be between 2 and 10."
  }
}

# Stickiness Variables
variable "enable_stickiness" {
  description = "Enable load balancer cookie stickiness"
  type        = bool
  default     = false
}

variable "stickiness_duration" {
  description = "Time period for which requests from a client should be routed to the same target"
  type        = number
  default     = 86400
  validation {
    condition     = var.stickiness_duration >= 1 && var.stickiness_duration <= 604800
    error_message = "Stickiness duration must be between 1 second and 7 days (604800 seconds)."
  }
}

# CloudWatch Alarms Variables
variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms for ALB"
  type        = bool
  default     = true
}

variable "response_time_threshold" {
  description = "Response time threshold for CloudWatch alarm (in seconds)"
  type        = number
  default     = 1.0
}

variable "unhealthy_hosts_threshold" {
  description = "Unhealthy hosts threshold for CloudWatch alarm"
  type        = number
  default     = 0
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarm triggers"
  type        = list(string)
  default     = []
}

# WAF Variables
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

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
  default     = {}
}
```

**modules/alb/outputs.tf**
```hcl
# ALB Module Outputs
output "alb_id" {
  description = "ID of the load balancer"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "ARN suffix for use with CloudWatch Metrics"
  value       = aws_lb.main.arn_suffix
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Canonical hosted zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_id" {
  description = "ID of the target group"
  value       = aws_lb_target_group.web.id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.web.arn
}

output "target_group_arn_suffix" {
  description = "ARN suffix for use with CloudWatch Metrics"
  value       = aws_lb_target_group.web.arn_suffix
}

output "http_listener_arn" {
  description = "ARN of the HTTP listener"
  value       = aws_lb_listener.http.arn
}

output "alb_security_group_id" {
  description = "Security group ID attached to the ALB"
  value       = var.alb_security_group_id
}
```

### 4. EC2 Module

**modules/ec2/main.tf**
```hcl
# EC2 Module - Auto Scaling Group and Launch Template

# Data sources
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_secretsmanager_secret" "app_secrets" {
  count = var.secrets_manager_secret_name != "" ? 1 : 0
  name  = var.secrets_manager_secret_name
}

data "aws_secretsmanager_secret_version" "app_secrets" {
  count     = var.secrets_manager_secret_name != "" ? 1 : 0
  secret_id = data.aws_secretsmanager_secret.app_secrets[0].id
}

# User data script for EC2 instances
locals {
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment         = var.environment
    project_name        = var.project_name
    app_port           = var.app_port
    secrets_arn        = var.secrets_manager_secret_name != "" ? data.aws_secretsmanager_secret.app_secrets[0].arn : ""
    additional_packages = var.additional_packages
  }))
}

# Launch Template
resource "aws_launch_template" "web" {
  name_prefix   = "${var.environment}-${var.project_name}-web-"
  description   = "Launch template for ${var.environment} ${var.project_name} web servers"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  # key_name      = var.key_pair_name

  vpc_security_group_ids = [var.web_security_group_id]

  iam_instance_profile {
    name = var.iam_instance_profile_name
  }

  user_data = local.user_data

  # EBS optimization
  # ebs_optimized = var.ebs_optimized

  # Monitoring
  monitoring {
    enabled = var.detailed_monitoring
  }

  # Instance metadata options
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                = "required"
    http_put_response_hop_limit = 2
    instance_metadata_tags      = "enabled"
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "${var.environment}-${var.project_name}-web-instance"
      Type = "ec2-instance"
      Component = "web"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.common_tags, {
      Name = "${var.environment}-${var.project_name}-web-volume"
      Type = "ebs-volume"
      Component = "web"
    })
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-web-launch-template"
    Type = "launch-template"
    Component = "web"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                = "${var.environment}-${var.project_name}-web-asg-hcltftftf"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [var.target_group_arn]
  health_check_type   = var.health_check_type
  health_check_grace_period = var.health_check_grace_period

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  # Instance refresh configuration
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = var.instance_refresh_min_healthy_percentage
      instance_warmup       = var.instance_warmup
    }
    triggers = ["tag"]
  }

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  # Termination policies
  termination_policies = var.termination_policies

  # Enable instance protection
  protect_from_scale_in = var.protect_from_scale_in

  # Tags
  dynamic "tag" {
    for_each = merge(var.common_tags, {
      Name = "${var.environment}-${var.project_name}-web-asg"
      Type = "auto-scaling-group"
      Component = "web"
    })
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes       = [desired_capacity]
  }

  depends_on = [aws_launch_template.web]
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.environment}-${var.project_name}-scale-up"
  scaling_adjustment     = var.scale_up_adjustment
  adjustment_type        = "ChangeInCapacity"
  cooldown              = var.scale_up_cooldown
  autoscaling_group_name = aws_autoscaling_group.web.name
  policy_type           = "SimpleScaling"
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.environment}-${var.project_name}-scale-down"
  scaling_adjustment     = var.scale_down_adjustment
  adjustment_type        = "ChangeInCapacity"
  cooldown              = var.scale_down_cooldown
  autoscaling_group_name = aws_autoscaling_group.web.name
  policy_type           = "SimpleScaling"
}

# CloudWatch Alarms for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.cpu_high_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = var.cpu_high_period
  statistic           = "Average"
  threshold           = var.cpu_high_threshold
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = concat([aws_autoscaling_policy.scale_up.arn], var.alarm_actions)

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-cpu-high-alarm"
    Type = "cloudwatch-alarm"
    Component = "web"
  })
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.environment}-${var.project_name}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = var.cpu_low_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = var.cpu_low_period
  statistic           = "Average"
  threshold           = var.cpu_low_threshold
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-cpu-low-alarm"
    Type = "cloudwatch-alarm"
    Component = "web"
  })
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/ec2/${var.environment}-${var.project_name}"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-app-logs"
    Type = "log-group"
    Component = "web"
  })
}

# SNS Topic for notifications (optional)
resource "aws_sns_topic" "notifications" {
  count = var.enable_notifications ? 1 : 0

  name = "${var.environment}-${var.project_name}-notifications"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-notifications"
    Type = "sns-topic"
    Component = "web"
  })
}

# SNS Topic Subscription (optional)
resource "aws_sns_topic_subscription" "email_notifications" {
  count = var.enable_notifications && length(var.notification_emails) > 0 ? length(var.notification_emails) : 0

  topic_arn = aws_sns_topic.notifications[0].arn
  protocol  = "email"
  endpoint  = var.notification_emails[count.index]
}
```

**modules/ec2/variables.tf**
```hcl
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
```

**modules/ec2/outputs.tf**
```hcl
# EC2 Module Outputs
output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.web.id
}

output "launch_template_arn" {
  description = "ARN of the launch template"
  value       = aws_launch_template.web.arn
}

output "launch_template_latest_version" {
  description = "Latest version of the launch template"
  value       = aws_launch_template.web.latest_version
}

output "autoscaling_group_id" {
  description = "ID of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.id
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.name
}

output "autoscaling_group_min_size" {
  description = "Minimum size of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.min_size
}

output "autoscaling_group_max_size" {
  description = "Maximum size of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.max_size
}

output "autoscaling_group_desired_capacity" {
  description = "Desired capacity of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.desired_capacity
}

output "scale_up_policy_arn" {
  description = "ARN of the scale up policy"
  value       = aws_autoscaling_policy.scale_up.arn
}

output "scale_down_policy_arn" {
  description = "ARN of the scale down policy"
  value       = aws_autoscaling_policy.scale_down.arn
}

output "cpu_high_alarm_arn" {
  description = "ARN of the CPU high alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.cpu_high[0].arn : null
}

output "cpu_low_alarm_arn" {
  description = "ARN of the CPU low alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.cpu_low[0].arn : null
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = var.enable_notifications ? aws_sns_topic.notifications[0].arn : null
}
```