# Gap Analysis and Complete Resolution

## Identified Gaps

1. **Incomplete EC2 Module**: The `user_data.sh` script was cut off and missing variables.tf and outputs.tf
2. **Missing Root Configuration**: No root-level main.tf, variables.tf, outputs.tf, or terraform.tf
3. **Missing Environment Configurations**: No staging/production environment-specific configurations
4. **Missing Deployment Scripts**: No automation scripts for deployment and rollback

## Complete Resolution

### 1. Complete EC2 Module

**modules/ec2/user_data.sh** (Complete version)
```bash
#!/bin/bash

# User Data Script for Web Servers
set -e

# Variables from Terraform
ENVIRONMENT="${environment}"
PROJECT_NAME="${project_name}"
APP_PORT="${app_port}"
SECRETS_ARN="${secrets_arn}"

# Update system
yum update -y

# Install required packages
yum install -y \
    amazon-cloudwatch-agent \
    aws-cli \
    docker \
    git \
    htop \
    jq \
    nginx \
    python3 \
    ${additional_packages}

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
${cloudwatch_config}
EOF

# Start and enable services
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
systemctl enable docker
systemctl start docker
systemctl enable nginx
systemctl start nginx

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Create application directory
mkdir -p /opt/app
chown ec2-user:ec2-user /opt/app

# Configure nginx
cat > /etc/nginx/conf.d/app.conf << EOF
upstream app {
    server localhost:$APP_PORT;
}

server {
    listen 80;
    server_name _;

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Remove default nginx configuration
rm -f /etc/nginx/conf.d/default.conf

# Test nginx configuration and restart
nginx -t && systemctl restart nginx

# Retrieve secrets if configured
if [ ! -z "$SECRETS_ARN" ]; then
    echo "Retrieving secrets from AWS Secrets Manager..."
    aws secretsmanager get-secret-value \
        --secret-id "$SECRETS_ARN" \
        --region $(curl -s http://169.254.169.254/latest/meta-data/placement/region) \
        --query SecretString \
        --output text > /opt/app/.env
    
    chown ec2-user:ec2-user /opt/app/.env
    chmod 600 /opt/app/.env
fi

# Create a simple health check application
cat > /opt/app/health_server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
from datetime import datetime

class HealthHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            health_data = {
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'environment': os.environ.get('ENVIRONMENT', 'unknown'),
                'project': os.environ.get('PROJECT_NAME', 'unknown'),
                'instance_id': self.get_instance_id()
            }
            
            self.wfile.write(json.dumps(health_data).encode())
        else:
            super().do_GET()
    
    def get_instance_id(self):
        try:
            import urllib.request
            response = urllib.request.urlopen('http://169.254.169.254/latest/meta-data/instance-id')
            return response.read().decode()
        except:
            return 'unknown'

if __name__ == "__main__":
    PORT = int(os.environ.get('APP_PORT', 8080))
    with socketserver.TCPServer(("", PORT), HealthHandler) as httpd:
        print(f"Health server running on port {PORT}")
        httpd.serve_forever()
EOF

# Make health server executable
chmod +x /opt/app/health_server.py

# Create systemd service for health server
cat > /etc/systemd/system/health-server.service << EOF
[Unit]
Description=Health Check Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/app
Environment=ENVIRONMENT=$ENVIRONMENT
Environment=PROJECT_NAME=$PROJECT_NAME
Environment=APP_PORT=$APP_PORT
ExecStart=/usr/bin/python3 /opt/app/health_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start and enable health server
systemctl daemon-reload
systemctl enable health-server
systemctl start health-server

# Signal completion
/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region} || true

echo "User data script completed successfully"
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

variable "cloudwatch_config" {
  description = "CloudWatch agent configuration"
  type        = string
  default     = jsonencode({
    metrics = {
      namespace = "CWAgent"
      metrics_collected = {
        cpu = {
          measurement = ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"]
          metrics_collection_interval = 60
        }
        disk = {
          measurement = ["used_percent"]
          metrics_collection_interval = 60
          resources = ["*"]
        }
        mem = {
          measurement = ["mem_used_percent"]
          metrics_collection_interval = 60
        }
      }
    }
    logs = {
      logs_collected = {
        files = {
          collect_list = [
            {
              file_path = "/var/log/messages"
              log_group_name = "/aws/ec2/system"
              log_stream_name = "{instance_id}"
            }
          ]
        }
      }
    }
  })
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

### 2. Root Level Configuration

**main.tf** (Root level)
```hcl
# Root Main Configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# Local values
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
    Repository  = var.repository_url
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

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment                = var.environment
  project_name              = var.project_name
  vpc_cidr                  = var.vpc_cidr
  public_subnet_cidrs       = var.public_subnet_cidrs
  private_subnet_cidrs      = var.private_subnet_cidrs
  enable_nat_gateway        = local.current_config.enable_nat_gateway
  enable_flow_logs          = local.current_config.enable_flow_logs
  flow_logs_retention_days  = var.flow_logs_retention_days
  common_tags               = local.common_tags
}

# Security Module
module "security" {
  source = "./modules/security"

  environment         = var.environment
  project_name        = var.project_name
  vpc_id             = module.vpc.vpc_id
  app_port           = var.app_port
  db_port            = var.db_port
  enable_ssh_access  = var.enable_ssh_access
  ssh_allowed_cidrs  = var.ssh_allowed_cidrs
  kms_deletion_window = var.kms_deletion_window
  common_tags        = local.common_tags

  depends_on = [module.vpc]
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  environment                = var.environment
  project_name              = var.project_name
  vpc_id                    = module.vpc.vpc_id
  public_subnet_ids         = module.vpc.public_subnet_ids
  alb_security_group_id     = module.security.alb_security_group_id
  target_port               = var.app_port
  target_protocol           = var.target_protocol
  ssl_certificate_arn       = var.ssl_certificate_arn
  ssl_policy                = var.ssl_policy
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

  depends_on = [module.vpc, module.security]
}

# EC2 Auto Scaling Module
module "ec2" {
  source = "./modules/ec2"

  environment                = var.environment
  project_name              = var.project_name
  private_subnet_ids        = module.vpc.private_subnet_ids
  web_security_group_id     = module.security.web_security_group_id
  iam_instance_profile_name = module.security.ec2_instance_profile_name
  target_group_arn          = module.alb.target_group_arn
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
  cloudwatch_config         = var.cloudwatch_config
  additional_packages       = var.additional_packages
  log_retention_days        = var.log_retention_days
  enable_notifications      = var.enable_notifications
  notification_emails       = var.notification_emails
  common_tags               = local.common_tags

  depends_on = [module.vpc, module.security, module.alb]
}

# Optional: RDS Database (commented out - can be enabled if needed)
# module "rds" {
#   source = "./modules/rds"
#   
#   environment              = var.environment
#   project_name            = var.project_name
#   vpc_id                  = module.vpc.vpc_id
#   private_subnet_ids      = module.vpc.private_subnet_ids
#   database_security_group_id = module.security.database_security_group_id
#   db_instance_class       = local.current_config.db_instance_class
#   common_tags            = local.common_tags
#   
#   depends_on = [module.vpc, module.security]
# }
```

**variables.tf** (Root level)
```hcl
# Root Variables Configuration

# General Configuration
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be a valid region format (e.g., us-west-2)."
  }
}

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

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = ""
}

variable "cost_center" {
  description = "Cost center for resource billing"
  type        = string
  default     = ""
}

variable "repository_url" {
  description = "Repository URL for the infrastructure code"
  type        = string
  default     = ""
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