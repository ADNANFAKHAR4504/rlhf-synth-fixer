# main.tf - Root Module Composition for VPC Peering with Advanced Monitoring
# Note: Provider configuration is in provider.tf

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_a_cidr" {
  description = "CIDR block for VPC-A"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_a_cidr, 0))
    error_message = "vpc_a_cidr must be a valid CIDR block."
  }
}

variable "vpc_b_cidr" {
  description = "CIDR block for VPC-B"
  type        = string
  default     = "10.1.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_b_cidr, 0))
    error_message = "vpc_b_cidr must be a valid CIDR block."
  }
}

variable "allowed_ports" {
  description = "List of allowed ports for cross-VPC communication"
  type        = list(string)
  default     = ["443", "8080", "3306"]

  validation {
    condition = alltrue([
      for port in var.allowed_ports : can(tonumber(port)) && tonumber(port) >= 1 && tonumber(port) <= 65535
    ])
    error_message = "All ports must be valid numbers between 1 and 65535."
  }
}

variable "retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.retention_days)
    error_message = "retention_days must be a valid CloudWatch Logs retention value."
  }
}

variable "traffic_volume_threshold" {
  description = "Threshold for traffic volume alarm (number of log entries)"
  type        = number
  default     = 500
}

variable "rejected_connections_threshold" {
  description = "Threshold for rejected connections alarm"
  type        = number
  default     = 50
}

variable "anomaly_threshold_percent" {
  description = "Percentage above baseline to trigger anomaly alert"
  type        = number
  default     = 20

  validation {
    condition     = var.anomaly_threshold_percent > 0 && var.anomaly_threshold_percent <= 100
    error_message = "anomaly_threshold_percent must be between 1 and 100."
  }
}

variable "traffic_baseline" {
  description = "Baseline traffic in requests per hour (10k daily = ~417/hour)"
  type        = number
  default     = 417
}

variable "lambda_schedule" {
  description = "Schedule expression for Lambda execution"
  type        = string
  default     = "rate(1 hour)"
}

variable "alert_email" {
  description = "Email address for alert notifications"
  type        = string
  default     = "admin@example.com"
  sensitive   = true

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alert_email))
    error_message = "The alert_email must be a valid email address format."
  }
}

variable "create_dashboard" {
  description = "Whether to create CloudWatch dashboard"
  type        = bool
  default     = true
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "Platform Team"
}

variable "enable_synthetics" {
  description = "Enable CloudWatch Synthetics for connectivity testing"
  type        = bool
  default     = true
}

variable "enable_config_rules" {
  description = "Enable AWS Config rules for compliance monitoring"
  type        = bool
  default     = true
}

variable "enable_xray" {
  description = "Enable AWS X-Ray tracing"
  type        = bool
  default     = true
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_region" "current" {}

# ============================================================================
# RANDOM RESOURCES
# ============================================================================

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  suffix = random_string.suffix.result

  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "Terraform"
    Project     = "VPCPeering"
  }

  vpc_a_public_subnets = [
    cidrsubnet(var.vpc_a_cidr, 8, 1), # 10.0.1.0/24
    cidrsubnet(var.vpc_a_cidr, 8, 2), # 10.0.2.0/24
  ]

  vpc_a_private_subnets = [
    cidrsubnet(var.vpc_a_cidr, 8, 10), # 10.0.10.0/24
    cidrsubnet(var.vpc_a_cidr, 8, 11), # 10.0.11.0/24
  ]

  vpc_b_public_subnets = [
    cidrsubnet(var.vpc_b_cidr, 8, 1), # 10.1.1.0/24
    cidrsubnet(var.vpc_b_cidr, 8, 2), # 10.1.2.0/24
  ]

  vpc_b_private_subnets = [
    cidrsubnet(var.vpc_b_cidr, 8, 10), # 10.1.10.0/24
    cidrsubnet(var.vpc_b_cidr, 8, 11), # 10.1.11.0/24
  ]

  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}

# ============================================================================
# VPC MODULE - VPC-A
# ============================================================================

module "vpc_a" {
  source = "./modules/vpc"

  vpc_name                             = "vpc-a"
  vpc_cidr                             = var.vpc_a_cidr
  public_subnets                       = local.vpc_a_public_subnets
  private_subnets                      = local.vpc_a_private_subnets
  availability_zones                   = local.azs
  suffix                               = local.suffix
  common_tags                          = local.common_tags
  enable_flow_logs                     = false # Disabled to prevent conflict with existing resources
  flow_logs_retention_days             = var.retention_days
  flow_logs_role_arn                   = module.security.flow_logs_role_arn
  enable_dns_hostnames                 = true
  enable_dns_support                   = true
  enable_network_address_usage_metrics = true
  enable_peering                       = true
  peer_vpc_id                          = module.vpc_b.vpc_id
  peer_vpc_cidr                        = var.vpc_b_cidr
  peering_connection_id                = aws_vpc_peering_connection.a_to_b.id
}

# ============================================================================
# VPC MODULE - VPC-B
# ============================================================================

module "vpc_b" {
  source = "./modules/vpc"

  vpc_name                             = "vpc-b"
  vpc_cidr                             = var.vpc_b_cidr
  public_subnets                       = local.vpc_b_public_subnets
  private_subnets                      = local.vpc_b_private_subnets
  availability_zones                   = local.azs
  suffix                               = local.suffix
  common_tags                          = local.common_tags
  enable_flow_logs                     = false # Disabled to prevent conflict with existing resources
  flow_logs_retention_days             = var.retention_days
  flow_logs_role_arn                   = module.security.flow_logs_role_arn
  enable_dns_hostnames                 = true
  enable_dns_support                   = true
  enable_network_address_usage_metrics = true
  enable_peering                       = true
  peer_vpc_id                          = module.vpc_a.vpc_id
  peer_vpc_cidr                        = var.vpc_a_cidr
  peering_connection_id                = aws_vpc_peering_connection.a_to_b.id
}

# ============================================================================
# VPC PEERING CONNECTION
# ============================================================================

resource "aws_vpc_peering_connection" "a_to_b" {
  vpc_id      = module.vpc_a.vpc_id
  peer_vpc_id = module.vpc_b.vpc_id
  auto_accept = true

  requester {
    allow_remote_vpc_dns_resolution = true
  }

  accepter {
    allow_remote_vpc_dns_resolution = true
  }

  tags = merge(local.common_tags, {
    Name = "vpc-a-to-vpc-b-peering-${local.suffix}"
    Side = "Requester"
  })
}

# ============================================================================
# PEERING ROUTES
# ============================================================================

# VPC-A public route table to VPC-B
resource "aws_route" "vpc_a_public_to_vpc_b" {
  route_table_id            = module.vpc_a.public_route_table_id
  destination_cidr_block    = var.vpc_b_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# VPC-A private route tables to VPC-B
resource "aws_route" "vpc_a_private_to_vpc_b" {
  count                     = length(module.vpc_a.private_route_table_ids)
  route_table_id            = module.vpc_a.private_route_table_ids[count.index]
  destination_cidr_block    = var.vpc_b_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# VPC-B public route table to VPC-A
resource "aws_route" "vpc_b_public_to_vpc_a" {
  route_table_id            = module.vpc_b.public_route_table_id
  destination_cidr_block    = var.vpc_a_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# VPC-B private route tables to VPC-A
resource "aws_route" "vpc_b_private_to_vpc_a" {
  count                     = length(module.vpc_b.private_route_table_ids)
  route_table_id            = module.vpc_b.private_route_table_ids[count.index]
  destination_cidr_block    = var.vpc_a_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# ============================================================================
# SECURITY MODULE
# ============================================================================

module "security" {
  source = "./modules/security"

  vpc_a_id      = module.vpc_a.vpc_id
  vpc_b_id      = module.vpc_b.vpc_id
  vpc_a_cidr    = var.vpc_a_cidr
  vpc_b_cidr    = var.vpc_b_cidr
  allowed_ports = var.allowed_ports
  suffix        = local.suffix
  common_tags   = local.common_tags
  aws_region    = var.aws_region
  account_id    = data.aws_caller_identity.current.account_id
}

# ============================================================================
# MONITORING MODULE
# ============================================================================

module "monitoring" {
  source = "./modules/monitoring"

  vpc_a_log_group_name           = module.vpc_a.flow_log_group_name
  vpc_b_log_group_name           = module.vpc_b.flow_log_group_name
  traffic_volume_threshold       = var.traffic_volume_threshold
  rejected_connections_threshold = var.rejected_connections_threshold
  alert_email                    = var.alert_email
  create_dashboard               = var.create_dashboard
  suffix                         = local.suffix
  common_tags                    = local.common_tags
  aws_region                     = var.aws_region
  lambda_function_name           = module.lambda.function_name
}

# ============================================================================
# LAMBDA MODULE
# ============================================================================

module "lambda" {
  source = "./modules/lambda"

  function_name             = "vpc-traffic-analyzer-${local.suffix}"
  vpc_a_log_group_name      = module.vpc_a.flow_log_group_name
  vpc_b_log_group_name      = module.vpc_b.flow_log_group_name
  vpc_a_log_group_arn       = module.vpc_a.flow_log_group_arn
  vpc_b_log_group_arn       = module.vpc_b.flow_log_group_arn
  traffic_baseline          = var.traffic_baseline
  sns_topic_arn             = module.monitoring.sns_topic_arn
  allowed_ports             = var.allowed_ports
  anomaly_threshold_percent = var.anomaly_threshold_percent
  vpc_a_cidr                = var.vpc_a_cidr
  vpc_b_cidr                = var.vpc_b_cidr
  lambda_schedule           = var.lambda_schedule
  retention_days            = var.retention_days
  suffix                    = local.suffix
  common_tags               = local.common_tags
  aws_region                = var.aws_region
  account_id                = data.aws_caller_identity.current.account_id
  enable_xray               = var.enable_xray
}

# ============================================================================
# AWS SYSTEMS MANAGER PARAMETER STORE
# ============================================================================

resource "aws_ssm_parameter" "traffic_baseline" {
  name        = "/vpc-peering/traffic-baseline"
  description = "Baseline traffic in requests per hour"
  type        = "String"
  value       = tostring(var.traffic_baseline)
  tier        = "Standard"

  tags = merge(local.common_tags, {
    Name = "traffic-baseline-${local.suffix}"
  })
}

resource "aws_ssm_parameter" "anomaly_threshold" {
  name        = "/vpc-peering/anomaly-threshold"
  description = "Anomaly threshold percentage"
  type        = "String"
  value       = tostring(var.anomaly_threshold_percent)
  tier        = "Standard"

  tags = merge(local.common_tags, {
    Name = "anomaly-threshold-${local.suffix}"
  })
}

resource "aws_ssm_parameter" "allowed_ports" {
  name        = "/vpc-peering/allowed-ports"
  description = "Allowed ports for VPC peering traffic"
  type        = "StringList"
  value       = join(",", var.allowed_ports)
  tier        = "Standard"

  tags = merge(local.common_tags, {
    Name = "allowed-ports-${local.suffix}"
  })
}

resource "aws_ssm_parameter" "alert_settings" {
  name        = "/vpc-peering/alert-settings"
  description = "Alert settings for VPC peering monitoring"
  type        = "SecureString"
  value = jsonencode({
    email               = var.alert_email
    sns_topic_arn       = module.monitoring.sns_topic_arn
    traffic_threshold   = var.traffic_volume_threshold
    rejection_threshold = var.rejected_connections_threshold
  })
  tier = "Standard"

  tags = merge(local.common_tags, {
    Name = "alert-settings-${local.suffix}"
  })
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_a_id" {
  description = "ID of VPC-A"
  value       = module.vpc_a.vpc_id
}

output "vpc_b_id" {
  description = "ID of VPC-B"
  value       = module.vpc_b.vpc_id
}

output "vpc_a_cidr" {
  description = "CIDR block of VPC-A"
  value       = module.vpc_a.vpc_cidr_block
}

output "vpc_b_cidr" {
  description = "CIDR block of VPC-B"
  value       = module.vpc_b.vpc_cidr_block
}

output "peering_connection_id" {
  description = "ID of VPC peering connection"
  value       = aws_vpc_peering_connection.a_to_b.id
}

output "vpc_a_security_group_id" {
  description = "Security group ID for VPC-A"
  value       = module.security.vpc_a_security_group_id
}

output "vpc_b_security_group_id" {
  description = "Security group ID for VPC-B"
  value       = module.security.vpc_b_security_group_id
}

output "vpc_a_log_group_name" {
  description = "CloudWatch log group name for VPC-A Flow Logs"
  value       = module.vpc_a.flow_log_group_name
}

output "vpc_b_log_group_name" {
  description = "CloudWatch log group name for VPC-B Flow Logs"
  value       = module.vpc_b.flow_log_group_name
}

output "lambda_function_arn" {
  description = "ARN of traffic analyzer Lambda function"
  value       = module.lambda.function_arn
}

output "lambda_function_name" {
  description = "Name of traffic analyzer Lambda function"
  value       = module.lambda.function_name
}

output "sns_topic_arn" {
  description = "ARN of SNS alerts topic"
  value       = module.monitoring.sns_topic_arn
}

output "dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value       = module.monitoring.dashboard_url
}

output "alert_email" {
  description = "Email address receiving alerts"
  value       = var.alert_email
  sensitive   = true
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL for additional protection"
  value       = module.security.waf_web_acl_arn
}

output "parameter_store_paths" {
  description = "AWS Systems Manager Parameter Store paths"
  value = {
    traffic_baseline  = aws_ssm_parameter.traffic_baseline.name
    anomaly_threshold = aws_ssm_parameter.anomaly_threshold.name
    allowed_ports     = aws_ssm_parameter.allowed_ports.name
    alert_settings    = aws_ssm_parameter.alert_settings.name
  }
}