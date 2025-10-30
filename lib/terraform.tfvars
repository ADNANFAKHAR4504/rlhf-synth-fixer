# Project Configuration
project_name = "trading-platform"

# Region Configuration
aws_region = "us-east-1"
hub_region = "us-east-1"
spoke_regions = {
  "us-west-2" = "us-west-2"
  "eu-west-1" = "eu-west-1"
}

# Network Configuration
hub_vpc_cidr = "10.0.0.0/16"
spoke_vpc_cidrs = {
  "us-west-2" = "10.1.0.0/16"
  "eu-west-1" = "10.2.0.0/16"
}

# DNS Configuration
private_domain_name = "trading.internal"
enable_route53      = false # Set to true if you have a domain configured

# Tagging Standards
common_tags = {
  Environment  = "Production"
  CostCenter   = "FIN-001"
  Owner        = "network-team@company.com"
  Project      = "TradingPlatform"
  Terraform    = "true"
  Compliance   = "PCI-DSS"
  DataClass    = "Confidential"
  BackupPolicy = "Daily"
}

# Flow Logs Configuration - Full format for comprehensive logging
flow_log_format = "$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${start} $${end} $${action} $${log-status} $${vpc-id} $${subnet-id} $${instance-id} $${tcp-flags} $${type} $${pkt-srcaddr} $${pkt-dstaddr} $${region} $${az-id} $${sublocation-type} $${sublocation-id}"