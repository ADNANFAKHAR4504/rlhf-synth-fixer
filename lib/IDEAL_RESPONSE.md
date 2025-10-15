# VPC Peering with Network Monitoring - Complete Implementation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Complete Source Code](#complete-source-code)
  - [provider.tf](#providertf)
  - [tap_stack.tf](#tap_stacktf)
  - [lambda/traffic_analyzer.py](#lambdatraffic_analyzerpy)
- [Deployment Instructions](#deployment-instructions)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [CloudWatch Logs Insights Queries](#cloudwatch-logs-insights-queries)
- [Variable Reference](#variable-reference)
- [Outputs Reference](#outputs-reference)
- [Cost Estimation](#cost-estimation)
- [Security Considerations](#security-considerations)
- [Maintenance and Operations](#maintenance-and-operations)

---

## Overview

This infrastructure solution implements a secure VPC peering connection between two VPCs (VPC-A and VPC-B) with comprehensive network monitoring and automated anomaly detection. The system leverages AWS VPC Flow Logs, CloudWatch, Lambda, and SNS to provide real-time traffic analysis and alerting capabilities.

### Key Features

- **Dual VPC Architecture**: Two fully isolated VPCs with public and private subnets across multiple availability zones
- **VPC Peering**: Secure peering connection with bi-directional routing
- **Network Monitoring**: VPC Flow Logs capturing all network traffic in both VPCs
- **Security Groups**: Granular security controls limiting cross-VPC communication to specific ports (443, 8080, 3306)
- **Automated Analysis**: Lambda function performing hourly traffic analysis using CloudWatch Logs Insights
- **Anomaly Detection**: Intelligent detection of traffic spikes, unexpected ports, external traffic, and high rejection rates
- **Real-time Alerts**: SNS notifications for detected anomalies and threshold breaches
- **CloudWatch Dashboard**: Visual monitoring dashboard with traffic metrics and rejected connections
- **Custom Metrics**: Enhanced CloudWatch metrics for traffic volume, unique sources, rejected connections, and external traffic

### Use Cases

- Multi-tier application architectures requiring isolated VPCs
- Secure database access from application VPCs
- Development and production environment segregation
- Compliance requirements for network traffic auditing
- Security monitoring and threat detection

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AWS Account (us-east-1)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────┐       ┌──────────────────────────────┐   │
│  │   VPC-A (10.0.0.0/16)        │       │   VPC-B (10.1.0.0/16)        │   │
│  │                              │       │                              │   │
│  │  ┌─────────────────────┐    │       │    ┌─────────────────────┐  │   │
│  │  │  Public Subnets     │    │       │    │  Public Subnets     │  │   │
│  │  │  - 10.0.1.0/24      │◄───┼───────┼───►│  - 10.1.1.0/24      │  │   │
│  │  │  - 10.0.2.0/24      │    │ Peer  │    │  - 10.1.2.0/24      │  │   │
│  │  │  - Internet Gateway │    │       │    │  - Internet Gateway │  │   │
│  │  │  - NAT Gateways     │    │       │    │  - NAT Gateways     │  │   │
│  │  └─────────────────────┘    │       │    └─────────────────────┘  │   │
│  │                              │       │                              │   │
│  │  ┌─────────────────────┐    │       │    ┌─────────────────────┐  │   │
│  │  │  Private Subnets    │    │       │    │  Private Subnets    │  │   │
│  │  │  - 10.0.10.0/24     │◄───┼───────┼───►│  - 10.1.10.0/24     │  │   │
│  │  │  - 10.0.11.0/24     │    │       │    │  - 10.1.11.0/24     │  │   │
│  │  └─────────────────────┘    │       │    └─────────────────────┘  │   │
│  │                              │       │                              │   │
│  │  ┌─────────────────────┐    │       │    ┌─────────────────────┐  │   │
│  │  │  Security Group     │    │       │    │  Security Group     │  │   │
│  │  │  Ingress: 443, 8080 │    │       │    │  Ingress: 443, 3306 │  │   │
│  │  │  from VPC-B         │    │       │    │  from VPC-A         │  │   │
│  │  └─────────────────────┘    │       │    └─────────────────────┘  │   │
│  │                              │       │                              │   │
│  └──────────────────────────────┘       └──────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      VPC Flow Logs                                   │   │
│  │  ┌──────────────────┐              ┌──────────────────┐            │   │
│  │  │  VPC-A Flow Logs │              │  VPC-B Flow Logs │            │   │
│  │  │  CloudWatch      │              │  CloudWatch      │            │   │
│  │  └────────┬─────────┘              └────────┬─────────┘            │   │
│  └───────────┼──────────────────────────────────┼──────────────────────┘   │
│              │                                   │                           │
│              └───────────────┬───────────────────┘                           │
│                              │                                               │
│  ┌───────────────────────────▼─────────────────────────────────────────┐   │
│  │                   CloudWatch Logs Insights                           │   │
│  │  - Traffic Volume Analysis                                           │   │
│  │  - Source IP Breakdown                                               │   │
│  │  - Port Usage Analysis                                               │   │
│  │  - Rejected Connections Tracking                                     │   │
│  │  - External Traffic Detection                                        │   │
│  └───────────────────────────┬─────────────────────────────────────────┘   │
│                              │                                               │
│  ┌───────────────────────────▼─────────────────────────────────────────┐   │
│  │                 Lambda Traffic Analyzer                              │   │
│  │  - Runs hourly (EventBridge trigger)                                │   │
│  │  - Analyzes last hour of traffic                                    │   │
│  │  - Detects anomalies (spikes, unexpected ports, external traffic)   │   │
│  │  - Publishes custom CloudWatch metrics                              │   │
│  │  - Sends SNS alerts for anomalies                                   │   │
│  └───────────────────────────┬─────────────────────────────────────────┘   │
│                              │                                               │
│              ┌───────────────┴───────────────┐                              │
│              │                               │                              │
│  ┌───────────▼─────────────┐    ┌──────────▼─────────────┐                │
│  │  CloudWatch Metrics     │    │  SNS Topic             │                │
│  │  - TotalRequests        │    │  - Email Alerts        │                │
│  │  - UniqueSourceIPs      │    │  - Anomaly Reports     │                │
│  │  - RejectedConnections  │    │                        │                │
│  │  - ExternalTraffic      │    │                        │                │
│  │  - TotalBytes           │    │                        │                │
│  └─────────────────────────┘    └────────────────────────┘                │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   CloudWatch Dashboard                               │   │
│  │  - VPC Traffic Volume Chart                                         │   │
│  │  - Rejected Connections Chart                                       │   │
│  │  - Lambda Execution Metrics                                         │   │
│  │  - Recent Rejected Connections Log Widget                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Traffic Flow

1. **Peering Connection Established**: VPC-A and VPC-B are connected via VPC Peering
2. **Routing Configured**: Both VPCs have routes pointing to the peer VPC CIDR
3. **Security Groups Applied**: Only specific ports are allowed (443, 8080 from VPC-B to VPC-A; 443, 3306 from VPC-A to VPC-B)
4. **Flow Logs Captured**: All traffic (accepted and rejected) is logged to CloudWatch
5. **Hourly Analysis**: Lambda function queries logs every hour using CloudWatch Logs Insights
6. **Anomaly Detection**: Lambda compares current traffic against baseline and checks for unexpected patterns
7. **Metrics Published**: Custom metrics are pushed to CloudWatch for visualization
8. **Alerts Sent**: If anomalies detected, SNS notifications are triggered

---

## File Structure

```
iac-test-automations/
├── lib/
│   ├── provider.tf              # Terraform and provider configuration
│   ├── tap_stack.tf             # Main infrastructure stack (1137 lines)
│   ├── lambda/
│   │   └── traffic_analyzer.py  # Lambda function for traffic analysis
│   └── IDEAL_RESPONSE.md        # This documentation file
├── test/
│   ├── unit/                    # Unit tests
│   └── integration/             # Integration tests
└── metadata.json                # Project metadata
```

---

## Complete Source Code

### provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

---

### tap_stack.tf

```hcl
# tap_stack.tf - VPC Peering with Network Monitoring

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
  sensitive   = true
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

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================================
# RANDOM RESOURCES
# ============================================================================

resource "random_id" "suffix" {
  byte_length = 4
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  suffix = random_id.suffix.hex

  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "Terraform"
    Project     = "VPCPeering"
  }

  vpc_a_public_subnets = [
    cidrsubnet(var.vpc_a_cidr, 8, 1),  # 10.0.1.0/24
    cidrsubnet(var.vpc_a_cidr, 8, 2),  # 10.0.2.0/24
  ]

  vpc_a_private_subnets = [
    cidrsubnet(var.vpc_a_cidr, 8, 10), # 10.0.10.0/24
    cidrsubnet(var.vpc_a_cidr, 8, 11), # 10.0.11.0/24
  ]

  vpc_b_public_subnets = [
    cidrsubnet(var.vpc_b_cidr, 8, 1),  # 10.1.1.0/24
    cidrsubnet(var.vpc_b_cidr, 8, 2),  # 10.1.2.0/24
  ]

  vpc_b_private_subnets = [
    cidrsubnet(var.vpc_b_cidr, 8, 10), # 10.1.10.0/24
    cidrsubnet(var.vpc_b_cidr, 8, 11), # 10.1.11.0/24
  ]

  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}

# ============================================================================
# VPC-A RESOURCES
# ============================================================================

resource "aws_vpc" "vpc_a" {
  cidr_block           = var.vpc_a_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "vpc-a-${local.suffix}"
    VPC  = "VPC-A"
  })
}

resource "aws_subnet" "vpc_a_public" {
  count             = length(local.vpc_a_public_subnets)
  vpc_id            = aws_vpc.vpc_a.id
  cidr_block        = local.vpc_a_public_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "vpc-a-public-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-A"
    Type = "Public"
  })
}

resource "aws_subnet" "vpc_a_private" {
  count             = length(local.vpc_a_private_subnets)
  vpc_id            = aws_vpc.vpc_a.id
  cidr_block        = local.vpc_a_private_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "vpc-a-private-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-A"
    Type = "Private"
  })
}

resource "aws_internet_gateway" "vpc_a" {
  vpc_id = aws_vpc.vpc_a.id

  tags = merge(local.common_tags, {
    Name = "vpc-a-igw-${local.suffix}"
    VPC  = "VPC-A"
  })
}

resource "aws_eip" "vpc_a_nat" {
  count  = length(local.azs)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "vpc-a-nat-eip-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-A"
  })

  depends_on = [aws_internet_gateway.vpc_a]
}

resource "aws_nat_gateway" "vpc_a" {
  count         = length(local.azs)
  allocation_id = aws_eip.vpc_a_nat[count.index].id
  subnet_id     = aws_subnet.vpc_a_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "vpc-a-nat-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-A"
  })

  depends_on = [aws_internet_gateway.vpc_a]
}

resource "aws_route_table" "vpc_a_public" {
  vpc_id = aws_vpc.vpc_a.id

  tags = merge(local.common_tags, {
    Name = "vpc-a-public-rt-${local.suffix}"
    VPC  = "VPC-A"
    Type = "Public"
  })
}

resource "aws_route" "vpc_a_public_internet" {
  route_table_id         = aws_route_table.vpc_a_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.vpc_a.id
}

resource "aws_route_table_association" "vpc_a_public" {
  count          = length(aws_subnet.vpc_a_public)
  subnet_id      = aws_subnet.vpc_a_public[count.index].id
  route_table_id = aws_route_table.vpc_a_public.id
}

resource "aws_route_table" "vpc_a_private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.vpc_a.id

  tags = merge(local.common_tags, {
    Name = "vpc-a-private-rt-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-A"
    Type = "Private"
  })
}

resource "aws_route" "vpc_a_private_nat" {
  count                  = length(aws_route_table.vpc_a_private)
  route_table_id         = aws_route_table.vpc_a_private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.vpc_a[count.index].id
}

resource "aws_route_table_association" "vpc_a_private" {
  count          = length(aws_subnet.vpc_a_private)
  subnet_id      = aws_subnet.vpc_a_private[count.index].id
  route_table_id = aws_route_table.vpc_a_private[count.index].id
}

# ============================================================================
# VPC-B RESOURCES
# ============================================================================

resource "aws_vpc" "vpc_b" {
  cidr_block           = var.vpc_b_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "vpc-b-${local.suffix}"
    VPC  = "VPC-B"
  })
}

resource "aws_subnet" "vpc_b_public" {
  count             = length(local.vpc_b_public_subnets)
  vpc_id            = aws_vpc.vpc_b.id
  cidr_block        = local.vpc_b_public_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "vpc-b-public-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-B"
    Type = "Public"
  })
}

resource "aws_subnet" "vpc_b_private" {
  count             = length(local.vpc_b_private_subnets)
  vpc_id            = aws_vpc.vpc_b.id
  cidr_block        = local.vpc_b_private_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "vpc-b-private-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-B"
    Type = "Private"
  })
}

resource "aws_internet_gateway" "vpc_b" {
  vpc_id = aws_vpc.vpc_b.id

  tags = merge(local.common_tags, {
    Name = "vpc-b-igw-${local.suffix}"
    VPC  = "VPC-B"
  })
}

resource "aws_eip" "vpc_b_nat" {
  count  = length(local.azs)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "vpc-b-nat-eip-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-B"
  })

  depends_on = [aws_internet_gateway.vpc_b]
}

resource "aws_nat_gateway" "vpc_b" {
  count         = length(local.azs)
  allocation_id = aws_eip.vpc_b_nat[count.index].id
  subnet_id     = aws_subnet.vpc_b_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "vpc-b-nat-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-B"
  })

  depends_on = [aws_internet_gateway.vpc_b]
}

resource "aws_route_table" "vpc_b_public" {
  vpc_id = aws_vpc.vpc_b.id

  tags = merge(local.common_tags, {
    Name = "vpc-b-public-rt-${local.suffix}"
    VPC  = "VPC-B"
    Type = "Public"
  })
}

resource "aws_route" "vpc_b_public_internet" {
  route_table_id         = aws_route_table.vpc_b_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.vpc_b.id
}

resource "aws_route_table_association" "vpc_b_public" {
  count          = length(aws_subnet.vpc_b_public)
  subnet_id      = aws_subnet.vpc_b_public[count.index].id
  route_table_id = aws_route_table.vpc_b_public.id
}

resource "aws_route_table" "vpc_b_private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.vpc_b.id

  tags = merge(local.common_tags, {
    Name = "vpc-b-private-rt-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-B"
    Type = "Private"
  })
}

resource "aws_route" "vpc_b_private_nat" {
  count                  = length(aws_route_table.vpc_b_private)
  route_table_id         = aws_route_table.vpc_b_private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.vpc_b[count.index].id
}

resource "aws_route_table_association" "vpc_b_private" {
  count          = length(aws_subnet.vpc_b_private)
  subnet_id      = aws_subnet.vpc_b_private[count.index].id
  route_table_id = aws_route_table.vpc_b_private[count.index].id
}

# ============================================================================
# VPC PEERING CONNECTION
# ============================================================================

resource "aws_vpc_peering_connection" "a_to_b" {
  vpc_id      = aws_vpc.vpc_a.id
  peer_vpc_id = aws_vpc.vpc_b.id
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
  route_table_id            = aws_route_table.vpc_a_public.id
  destination_cidr_block    = var.vpc_b_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# VPC-A private route tables to VPC-B
resource "aws_route" "vpc_a_private_to_vpc_b" {
  count                     = length(aws_route_table.vpc_a_private)
  route_table_id            = aws_route_table.vpc_a_private[count.index].id
  destination_cidr_block    = var.vpc_b_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# VPC-B public route table to VPC-A
resource "aws_route" "vpc_b_public_to_vpc_a" {
  route_table_id            = aws_route_table.vpc_b_public.id
  destination_cidr_block    = var.vpc_a_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# VPC-B private route tables to VPC-A
resource "aws_route" "vpc_b_private_to_vpc_a" {
  count                     = length(aws_route_table.vpc_b_private)
  route_table_id            = aws_route_table.vpc_b_private[count.index].id
  destination_cidr_block    = var.vpc_a_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

resource "aws_security_group" "vpc_a" {
  name_prefix = "vpc-a-peering-sg-${local.suffix}"
  description = "Security group for VPC-A allowing traffic from VPC-B"
  vpc_id      = aws_vpc.vpc_a.id

  tags = merge(local.common_tags, {
    Name        = "vpc-a-peering-sg-${local.suffix}"
    VPC         = "VPC-A"
    Description = "Allows traffic from VPC-B on ports 443 and 8080"
  })
}

resource "aws_vpc_security_group_ingress_rule" "vpc_a_from_vpc_b" {
  for_each = toset(["443", "8080"])

  security_group_id = aws_security_group.vpc_a.id
  cidr_ipv4         = var.vpc_b_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"

  tags = merge(local.common_tags, {
    Name = "vpc-a-ingress-${each.value}-${local.suffix}"
  })
}

resource "aws_vpc_security_group_egress_rule" "vpc_a_to_vpc_b" {
  for_each = toset(["443", "8080"])

  security_group_id = aws_security_group.vpc_a.id
  cidr_ipv4         = var.vpc_b_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"

  tags = merge(local.common_tags, {
    Name = "vpc-a-egress-${each.value}-${local.suffix}"
  })
}

resource "aws_security_group" "vpc_b" {
  name_prefix = "vpc-b-peering-sg-${local.suffix}"
  description = "Security group for VPC-B allowing traffic from VPC-A"
  vpc_id      = aws_vpc.vpc_b.id

  tags = merge(local.common_tags, {
    Name        = "vpc-b-peering-sg-${local.suffix}"
    VPC         = "VPC-B"
    Description = "Allows traffic from VPC-A on ports 443 and 3306"
  })
}

resource "aws_vpc_security_group_ingress_rule" "vpc_b_from_vpc_a" {
  for_each = toset(["443", "3306"])

  security_group_id = aws_security_group.vpc_b.id
  cidr_ipv4         = var.vpc_a_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"

  tags = merge(local.common_tags, {
    Name = "vpc-b-ingress-${each.value}-${local.suffix}"
  })
}

resource "aws_vpc_security_group_egress_rule" "vpc_b_to_vpc_a" {
  for_each = toset(["443", "3306"])

  security_group_id = aws_security_group.vpc_b.id
  cidr_ipv4         = var.vpc_a_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"

  tags = merge(local.common_tags, {
    Name = "vpc-b-egress-${each.value}-${local.suffix}"
  })
}

# ============================================================================
# IAM ROLE FOR VPC FLOW LOGS
# ============================================================================

resource "aws_iam_role" "flow_logs" {
  name_prefix = "vpc-flow-logs-role-${local.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "vpc-flow-logs-role-${local.suffix}"
  })
}

resource "aws_iam_role_policy" "flow_logs" {
  name_prefix = "vpc-flow-logs-policy-${local.suffix}"
  role        = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH LOG GROUPS
# ============================================================================

resource "aws_cloudwatch_log_group" "vpc_a_flow_logs" {
  name              = "/aws/vpc/flowlogs/vpc-a-${local.suffix}"
  retention_in_days = var.retention_days

  tags = merge(local.common_tags, {
    Name = "vpc-a-flow-logs-${local.suffix}"
    VPC  = "VPC-A"
  })
}

resource "aws_cloudwatch_log_group" "vpc_b_flow_logs" {
  name              = "/aws/vpc/flowlogs/vpc-b-${local.suffix}"
  retention_in_days = var.retention_days

  tags = merge(local.common_tags, {
    Name = "vpc-b-flow-logs-${local.suffix}"
    VPC  = "VPC-B"
  })
}

# ============================================================================
# VPC FLOW LOGS
# ============================================================================

resource "aws_flow_log" "vpc_a" {
  vpc_id               = aws_vpc.vpc_a.id
  traffic_type         = "ALL"
  iam_role_arn         = aws_iam_role.flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_a_flow_logs.arn

  tags = merge(local.common_tags, {
    Name = "vpc-a-flow-log-${local.suffix}"
    VPC  = "VPC-A"
  })
}

resource "aws_flow_log" "vpc_b" {
  vpc_id               = aws_vpc.vpc_b.id
  traffic_type         = "ALL"
  iam_role_arn         = aws_iam_role.flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_b_flow_logs.arn

  tags = merge(local.common_tags, {
    Name = "vpc-b-flow-log-${local.suffix}"
    VPC  = "VPC-B"
  })
}

# ============================================================================
# CLOUDWATCH METRIC FILTERS
# ============================================================================

resource "aws_cloudwatch_log_metric_filter" "vpc_a_traffic_volume" {
  name           = "vpc-a-traffic-volume-${local.suffix}"
  log_group_name = aws_cloudwatch_log_group.vpc_a_flow_logs.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action, flowlogstatus]"

  metric_transformation {
    name      = "TrafficVolume"
    namespace = "Company/VPCPeering/VPC-A"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_a_rejected_connections" {
  name           = "vpc-a-rejected-connections-${local.suffix}"
  log_group_name = aws_cloudwatch_log_group.vpc_a_flow_logs.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=REJECT, flowlogstatus]"

  metric_transformation {
    name      = "RejectedConnections"
    namespace = "Company/VPCPeering/VPC-A"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_b_traffic_volume" {
  name           = "vpc-b-traffic-volume-${local.suffix}"
  log_group_name = aws_cloudwatch_log_group.vpc_b_flow_logs.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action, flowlogstatus]"

  metric_transformation {
    name      = "TrafficVolume"
    namespace = "Company/VPCPeering/VPC-B"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_b_rejected_connections" {
  name           = "vpc-b-rejected-connections-${local.suffix}"
  log_group_name = aws_cloudwatch_log_group.vpc_b_flow_logs.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=REJECT, flowlogstatus]"

  metric_transformation {
    name      = "RejectedConnections"
    namespace = "Company/VPCPeering/VPC-B"
    value     = "1"
    unit      = "Count"
  }
}

# ============================================================================
# SNS TOPIC FOR ALERTS
# ============================================================================

resource "aws_sns_topic" "alerts" {
  name_prefix = "vpc-peering-alerts-${local.suffix}"

  tags = merge(local.common_tags, {
    Name = "vpc-peering-alerts-${local.suffix}"
  })
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "vpc_a_traffic_volume" {
  alarm_name          = "vpc-a-high-traffic-volume-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "TrafficVolume"
  namespace           = "Company/VPCPeering/VPC-A"
  period              = 300
  statistic           = "Sum"
  threshold           = var.traffic_volume_threshold
  alarm_description   = "Alert when VPC-A traffic volume exceeds threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "vpc-a-traffic-volume-alarm-${local.suffix}"
    VPC  = "VPC-A"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_a_traffic_volume]
}

resource "aws_cloudwatch_metric_alarm" "vpc_a_rejected_connections" {
  alarm_name          = "vpc-a-high-rejected-connections-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RejectedConnections"
  namespace           = "Company/VPCPeering/VPC-A"
  period              = 300
  statistic           = "Sum"
  threshold           = var.rejected_connections_threshold
  alarm_description   = "Alert when VPC-A rejected connections exceed threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "vpc-a-rejected-connections-alarm-${local.suffix}"
    VPC  = "VPC-A"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_a_rejected_connections]
}

resource "aws_cloudwatch_metric_alarm" "vpc_b_traffic_volume" {
  alarm_name          = "vpc-b-high-traffic-volume-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "TrafficVolume"
  namespace           = "Company/VPCPeering/VPC-B"
  period              = 300
  statistic           = "Sum"
  threshold           = var.traffic_volume_threshold
  alarm_description   = "Alert when VPC-B traffic volume exceeds threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "vpc-b-traffic-volume-alarm-${local.suffix}"
    VPC  = "VPC-B"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_b_traffic_volume]
}

resource "aws_cloudwatch_metric_alarm" "vpc_b_rejected_connections" {
  alarm_name          = "vpc-b-high-rejected-connections-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RejectedConnections"
  namespace           = "Company/VPCPeering/VPC-B"
  period              = 300
  statistic           = "Sum"
  threshold           = var.rejected_connections_threshold
  alarm_description   = "Alert when VPC-B rejected connections exceed threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "vpc-b-rejected-connections-alarm-${local.suffix}"
    VPC  = "VPC-B"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_b_rejected_connections]
}

# ============================================================================
# IAM ROLE FOR LAMBDA
# ============================================================================

resource "aws_iam_role" "lambda_traffic_analyzer" {
  name_prefix = "lambda-traffic-analyzer-${local.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "lambda-traffic-analyzer-role-${local.suffix}"
  })
}

resource "aws_iam_role_policy" "lambda_traffic_analyzer" {
  name_prefix = "lambda-traffic-analyzer-policy-${local.suffix}"
  role        = aws_iam_role.lambda_traffic_analyzer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:StartQuery",
          "logs:GetQueryResults",
          "logs:DescribeLogGroups"
        ]
        Resource = [
          aws_cloudwatch_log_group.vpc_a_flow_logs.arn,
          aws_cloudwatch_log_group.vpc_b_flow_logs.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "Company/VPCPeering"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# ============================================================================
# LAMBDA FUNCTION
# ============================================================================

data "archive_file" "lambda_traffic_analyzer" {
  type        = "zip"
  source_file = "${path.module}/lambda/traffic_analyzer.py"
  output_path = "${path.module}/.terraform/lambda/traffic_analyzer.zip"
}

resource "aws_lambda_function" "traffic_analyzer" {
  filename         = data.archive_file.lambda_traffic_analyzer.output_path
  function_name    = "vpc-traffic-analyzer-${local.suffix}"
  role             = aws_iam_role.lambda_traffic_analyzer.arn
  handler          = "traffic_analyzer.lambda_handler"
  source_code_hash = data.archive_file.lambda_traffic_analyzer.output_base64sha256
  runtime          = "python3.12"
  timeout          = 300
  memory_size      = 256

  environment {
    variables = {
      VPC_A_LOG_GROUP      = aws_cloudwatch_log_group.vpc_a_flow_logs.name
      VPC_B_LOG_GROUP      = aws_cloudwatch_log_group.vpc_b_flow_logs.name
      TRAFFIC_BASELINE     = tostring(var.traffic_baseline)
      SNS_TOPIC_ARN        = aws_sns_topic.alerts.arn
      ALLOWED_PORTS        = join(",", var.allowed_ports)
      ANOMALY_THRESHOLD    = tostring(var.anomaly_threshold_percent)
      VPC_A_CIDR           = var.vpc_a_cidr
      VPC_B_CIDR           = var.vpc_b_cidr
    }
  }

  tags = merge(local.common_tags, {
    Name = "vpc-traffic-analyzer-${local.suffix}"
  })
}

resource "aws_cloudwatch_log_group" "lambda_traffic_analyzer" {
  name              = "/aws/lambda/vpc-traffic-analyzer-${local.suffix}"
  retention_in_days = var.retention_days

  tags = merge(local.common_tags, {
    Name = "lambda-traffic-analyzer-logs-${local.suffix}"
  })
}

# ============================================================================
# EVENTBRIDGE RULE FOR LAMBDA
# ============================================================================

resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  name_prefix         = "vpc-traffic-analyzer-schedule-${local.suffix}"
  description         = "Trigger Lambda traffic analyzer on schedule"
  schedule_expression = var.lambda_schedule

  tags = merge(local.common_tags, {
    Name = "lambda-schedule-${local.suffix}"
  })
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.lambda_schedule.name
  target_id = "LambdaTarget"
  arn       = aws_lambda_function.traffic_analyzer.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.traffic_analyzer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_schedule.arn
}

# ============================================================================
# CLOUDWATCH DASHBOARD (OPTIONAL)
# ============================================================================

resource "aws_cloudwatch_dashboard" "vpc_peering" {
  count          = var.create_dashboard ? 1 : 0
  dashboard_name = "vpc-peering-monitoring-${local.suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["Company/VPCPeering/VPC-A", "TrafficVolume", { stat = "Sum", label = "VPC-A Traffic" }],
            ["Company/VPCPeering/VPC-B", "TrafficVolume", { stat = "Sum", label = "VPC-B Traffic" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "VPC Traffic Volume"
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["Company/VPCPeering/VPC-A", "RejectedConnections", { stat = "Sum", label = "VPC-A Rejected" }],
            ["Company/VPCPeering/VPC-B", "RejectedConnections", { stat = "Sum", label = "VPC-B Rejected" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Rejected Connections"
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Lambda Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Lambda Errors" }],
            [".", "Duration", { stat = "Average", label = "Lambda Duration (avg)" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Lambda Execution Metrics"
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.vpc_a_flow_logs.name}' | fields @timestamp, srcaddr, dstaddr, srcport, dstport, action | filter action = 'REJECT' | sort @timestamp desc | limit 20"
          region  = var.aws_region
          title   = "Recent Rejected Connections (VPC-A)"
        }
      }
    ]
  })
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_a_id" {
  description = "ID of VPC-A"
  value       = aws_vpc.vpc_a.id
}

output "vpc_b_id" {
  description = "ID of VPC-B"
  value       = aws_vpc.vpc_b.id
}

output "vpc_a_cidr" {
  description = "CIDR block of VPC-A"
  value       = aws_vpc.vpc_a.cidr_block
}

output "vpc_b_cidr" {
  description = "CIDR block of VPC-B"
  value       = aws_vpc.vpc_b.cidr_block
}

output "peering_connection_id" {
  description = "ID of VPC peering connection"
  value       = aws_vpc_peering_connection.a_to_b.id
}

output "vpc_a_security_group_id" {
  description = "Security group ID for VPC-A"
  value       = aws_security_group.vpc_a.id
}

output "vpc_b_security_group_id" {
  description = "Security group ID for VPC-B"
  value       = aws_security_group.vpc_b.id
}

output "vpc_a_log_group_name" {
  description = "CloudWatch log group name for VPC-A Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_a_flow_logs.name
}

output "vpc_b_log_group_name" {
  description = "CloudWatch log group name for VPC-B Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_b_flow_logs.name
}

output "lambda_function_arn" {
  description = "ARN of traffic analyzer Lambda function"
  value       = aws_lambda_function.traffic_analyzer.arn
}

output "lambda_function_name" {
  description = "Name of traffic analyzer Lambda function"
  value       = aws_lambda_function.traffic_analyzer.function_name
}

output "sns_topic_arn" {
  description = "ARN of SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value = var.create_dashboard ? "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.vpc_peering[0].dashboard_name}" : "Dashboard not created"
}

output "alert_email" {
  description = "Email address receiving alerts"
  value       = var.alert_email
  sensitive   = true
}
```

---

### lambda/traffic_analyzer.py

```python
"""
VPC Traffic Analyzer Lambda Function

Analyzes VPC Flow Logs hourly to detect anomalies and publish metrics.
Queries CloudWatch Logs Insights API for the last hour of traffic data.
"""

import json
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
from collections import defaultdict
import boto3
from botocore.exceptions import ClientError

# Initialize AWS clients
logs_client = boto3.client('logs')
cloudwatch_client = boto3.client('cloudwatch')
sns_client = boto3.client('sns')

# Environment variables
VPC_A_LOG_GROUP = os.environ['VPC_A_LOG_GROUP']
VPC_B_LOG_GROUP = os.environ['VPC_B_LOG_GROUP']
TRAFFIC_BASELINE = int(os.environ.get('TRAFFIC_BASELINE', 417))
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ALLOWED_PORTS = set(os.environ.get('ALLOWED_PORTS', '443,8080,3306').split(','))
ANOMALY_THRESHOLD_PERCENT = int(os.environ.get('ANOMALY_THRESHOLD', 20))
VPC_A_CIDR = os.environ['VPC_A_CIDR']
VPC_B_CIDR = os.environ['VPC_B_CIDR']

# Constants
NAMESPACE = 'Company/VPCPeering'
QUERY_TIMEOUT = 60  # seconds
POLL_INTERVAL = 2  # seconds


def lambda_handler(event, context):
    """
    Main Lambda handler function.

    Args:
        event: Lambda event object
        context: Lambda context object

    Returns:
        dict: Response with status code and results
    """
    try:
        print(f"Starting VPC traffic analysis at {datetime.utcnow().isoformat()}")

        # Calculate time range (last hour)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=1)

        # Analyze both VPCs
        vpc_a_results = analyze_vpc_traffic(VPC_A_LOG_GROUP, 'VPC-A', start_time, end_time)
        vpc_b_results = analyze_vpc_traffic(VPC_B_LOG_GROUP, 'VPC-B', start_time, end_time)

        # Detect anomalies
        anomalies = detect_anomalies(vpc_a_results, vpc_b_results)

        # Publish custom metrics
        publish_metrics(vpc_a_results, 'VPC-A')
        publish_metrics(vpc_b_results, 'VPC-B')

        # Send SNS alert if anomalies detected
        if anomalies:
            send_anomaly_alert(anomalies, vpc_a_results, vpc_b_results)

        results = {
            'VPC-A': vpc_a_results,
            'VPC-B': vpc_b_results,
            'anomalies': anomalies,
            'timestamp': end_time.isoformat()
        }

        print(f"Analysis complete. Found {len(anomalies)} anomalies.")

        return {
            'statusCode': 200,
            'body': json.dumps(results, default=str)
        }

    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def analyze_vpc_traffic(log_group: str, vpc_name: str, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
    """
    Analyze traffic for a specific VPC using CloudWatch Logs Insights.

    Args:
        log_group: CloudWatch log group name
        vpc_name: Name of the VPC (for logging)
        start_time: Start time for query
        end_time: End time for query

    Returns:
        dict: Analysis results containing traffic metrics
    """
    print(f"Analyzing traffic for {vpc_name}")

    # CloudWatch Logs Insights query
    query = """
    fields @timestamp, srcaddr, dstaddr, srcport, dstport, protocol, action, bytes
    | stats count() as request_count,
            count_distinct(srcaddr) as unique_sources,
            count_distinct(dstaddr) as unique_destinations,
            sum(bytes) as total_bytes
    """

    try:
        # Start query
        query_id = start_logs_query(log_group, query, start_time, end_time)

        # Wait for query to complete
        results = wait_for_query_completion(query_id)

        # Parse results
        metrics = parse_query_results(results)

        # Get detailed breakdown
        source_ip_counts = get_source_ip_breakdown(log_group, start_time, end_time)
        rejected_count = get_rejected_connections_count(log_group, start_time, end_time)
        port_breakdown = get_port_breakdown(log_group, start_time, end_time)
        external_traffic = get_external_traffic_count(log_group, start_time, end_time)

        return {
            'total_requests': metrics.get('request_count', 0),
            'unique_sources': metrics.get('unique_sources', 0),
            'unique_destinations': metrics.get('unique_destinations', 0),
            'total_bytes': metrics.get('total_bytes', 0),
            'rejected_connections': rejected_count,
            'top_source_ips': source_ip_counts[:10],  # Top 10
            'port_breakdown': port_breakdown,
            'external_traffic_count': external_traffic,
            'vpc_name': vpc_name,
            'log_group': log_group
        }

    except Exception as e:
        print(f"Error analyzing {vpc_name}: {str(e)}")
        return {
            'total_requests': 0,
            'error': str(e),
            'vpc_name': vpc_name
        }


def start_logs_query(log_group: str, query: str, start_time: datetime, end_time: datetime) -> str:
    """
    Start a CloudWatch Logs Insights query.

    Args:
        log_group: CloudWatch log group name
        query: Query string
        start_time: Start time
        end_time: End time

    Returns:
        str: Query ID
    """
    response = logs_client.start_query(
        logGroupName=log_group,
        startTime=int(start_time.timestamp()),
        endTime=int(end_time.timestamp()),
        queryString=query
    )
    return response['queryId']


def wait_for_query_completion(query_id: str) -> List[Dict]:
    """
    Wait for a CloudWatch Logs Insights query to complete.

    Args:
        query_id: Query ID

    Returns:
        list: Query results
    """
    elapsed_time = 0

    while elapsed_time < QUERY_TIMEOUT:
        response = logs_client.get_query_results(queryId=query_id)
        status = response['status']

        if status == 'Complete':
            return response['results']
        elif status == 'Failed':
            raise Exception(f"Query failed: {query_id}")
        elif status == 'Cancelled':
            raise Exception(f"Query cancelled: {query_id}")

        time.sleep(POLL_INTERVAL)
        elapsed_time += POLL_INTERVAL

    raise Exception(f"Query timeout after {QUERY_TIMEOUT} seconds")


def parse_query_results(results: List[Dict]) -> Dict[str, Any]:
    """
    Parse CloudWatch Logs Insights query results.

    Args:
        results: Raw query results

    Returns:
        dict: Parsed metrics
    """
    if not results:
        return {}

    metrics = {}
    for field in results[0]:
        field_name = field['field']
        field_value = field['value']

        # Convert to appropriate type
        if field_name in ['request_count', 'unique_sources', 'unique_destinations']:
            metrics[field_name] = int(float(field_value))
        elif field_name == 'total_bytes':
            metrics[field_name] = int(float(field_value))
        else:
            metrics[field_name] = field_value

    return metrics


def get_source_ip_breakdown(log_group: str, start_time: datetime, end_time: datetime) -> List[Tuple[str, int]]:
    """
    Get traffic breakdown by source IP address.

    Args:
        log_group: CloudWatch log group name
        start_time: Start time
        end_time: End time

    Returns:
        list: List of (source_ip, count) tuples sorted by count descending
    """
    query = """
    fields srcaddr
    | stats count() as request_count by srcaddr
    | sort request_count desc
    | limit 20
    """

    try:
        query_id = start_logs_query(log_group, query, start_time, end_time)
        results = wait_for_query_completion(query_id)

        breakdown = []
        for result in results:
            srcaddr = None
            count = 0

            for field in result:
                if field['field'] == 'srcaddr':
                    srcaddr = field['value']
                elif field['field'] == 'request_count':
                    count = int(float(field['value']))

            if srcaddr:
                breakdown.append((srcaddr, count))

        return breakdown

    except Exception as e:
        print(f"Error getting source IP breakdown: {str(e)}")
        return []


def get_rejected_connections_count(log_group: str, start_time: datetime, end_time: datetime) -> int:
    """
    Get count of rejected connections.

    Args:
        log_group: CloudWatch log group name
        start_time: Start time
        end_time: End time

    Returns:
        int: Number of rejected connections
    """
    query = """
    fields @timestamp
    | filter action = "REJECT"
    | stats count() as rejected_count
    """

    try:
        query_id = start_logs_query(log_group, query, start_time, end_time)
        results = wait_for_query_completion(query_id)

        if results and len(results) > 0:
            for field in results[0]:
                if field['field'] == 'rejected_count':
                    return int(float(field['value']))

        return 0

    except Exception as e:
        print(f"Error getting rejected connections: {str(e)}")
        return 0


def get_port_breakdown(log_group: str, start_time: datetime, end_time: datetime) -> Dict[str, int]:
    """
    Get traffic breakdown by destination port.

    Args:
        log_group: CloudWatch log group name
        start_time: Start time
        end_time: End time

    Returns:
        dict: Port to count mapping
    """
    query = """
    fields dstport
    | stats count() as request_count by dstport
    | sort request_count desc
    | limit 20
    """

    try:
        query_id = start_logs_query(log_group, query, start_time, end_time)
        results = wait_for_query_completion(query_id)

        breakdown = {}
        for result in results:
            port = None
            count = 0

            for field in result:
                if field['field'] == 'dstport':
                    port = field['value']
                elif field['field'] == 'request_count':
                    count = int(float(field['value']))

            if port:
                breakdown[port] = count

        return breakdown

    except Exception as e:
        print(f"Error getting port breakdown: {str(e)}")
        return {}


def get_external_traffic_count(log_group: str, start_time: datetime, end_time: datetime) -> int:
    """
    Get count of traffic from outside the peered VPC CIDR ranges.

    Args:
        log_group: CloudWatch log group name
        start_time: Start time
        end_time: End time

    Returns:
        int: Number of external traffic entries
    """
    # Note: This is a simplified check. In production, you'd want more sophisticated IP range checking.
    query = f"""
    fields srcaddr
    | filter srcaddr not like /^10\\.0\\./
    | filter srcaddr not like /^10\\.1\\./
    | stats count() as external_count
    """

    try:
        query_id = start_logs_query(log_group, query, start_time, end_time)
        results = wait_for_query_completion(query_id)

        if results and len(results) > 0:
            for field in results[0]:
                if field['field'] == 'external_count':
                    return int(float(field['value']))

        return 0

    except Exception as e:
        print(f"Error getting external traffic count: {str(e)}")
        return 0


def detect_anomalies(vpc_a_results: Dict, vpc_b_results: Dict) -> List[Dict[str, Any]]:
    """
    Detect anomalies in VPC traffic.

    Args:
        vpc_a_results: VPC-A analysis results
        vpc_b_results: VPC-B analysis results

    Returns:
        list: List of detected anomalies
    """
    anomalies = []

    # Check traffic volume spikes (VPC-A)
    vpc_a_traffic = vpc_a_results.get('total_requests', 0)
    threshold = TRAFFIC_BASELINE * (1 + ANOMALY_THRESHOLD_PERCENT / 100)

    if vpc_a_traffic > threshold:
        anomalies.append({
            'type': 'traffic_spike',
            'vpc': 'VPC-A',
            'description': f'Traffic volume ({vpc_a_traffic}) exceeds baseline ({TRAFFIC_BASELINE}) by more than {ANOMALY_THRESHOLD_PERCENT}%',
            'severity': 'high',
            'current_value': vpc_a_traffic,
            'threshold': threshold
        })

    # Check traffic volume spikes (VPC-B)
    vpc_b_traffic = vpc_b_results.get('total_requests', 0)

    if vpc_b_traffic > threshold:
        anomalies.append({
            'type': 'traffic_spike',
            'vpc': 'VPC-B',
            'description': f'Traffic volume ({vpc_b_traffic}) exceeds baseline ({TRAFFIC_BASELINE}) by more than {ANOMALY_THRESHOLD_PERCENT}%',
            'severity': 'high',
            'current_value': vpc_b_traffic,
            'threshold': threshold
        })

    # Check for unexpected ports (VPC-A)
    for port, count in vpc_a_results.get('port_breakdown', {}).items():
        if port not in ALLOWED_PORTS and count > 10:  # More than 10 requests to unexpected port
            anomalies.append({
                'type': 'unexpected_port',
                'vpc': 'VPC-A',
                'description': f'Unexpected port {port} has {count} requests',
                'severity': 'medium',
                'port': port,
                'count': count
            })

    # Check for unexpected ports (VPC-B)
    for port, count in vpc_b_results.get('port_breakdown', {}).items():
        if port not in ALLOWED_PORTS and count > 10:
            anomalies.append({
                'type': 'unexpected_port',
                'vpc': 'VPC-B',
                'description': f'Unexpected port {port} has {count} requests',
                'severity': 'medium',
                'port': port,
                'count': count
            })

    # Check for external traffic
    vpc_a_external = vpc_a_results.get('external_traffic_count', 0)
    if vpc_a_external > 50:  # Threshold for external traffic
        anomalies.append({
            'type': 'external_traffic',
            'vpc': 'VPC-A',
            'description': f'Detected {vpc_a_external} connections from external IPs',
            'severity': 'high',
            'count': vpc_a_external
        })

    vpc_b_external = vpc_b_results.get('external_traffic_count', 0)
    if vpc_b_external > 50:
        anomalies.append({
            'type': 'external_traffic',
            'vpc': 'VPC-B',
            'description': f'Detected {vpc_b_external} connections from external IPs',
            'severity': 'high',
            'count': vpc_b_external
        })

    # Check rejected connections
    vpc_a_rejected = vpc_a_results.get('rejected_connections', 0)
    if vpc_a_rejected > 100:  # High number of rejections
        anomalies.append({
            'type': 'high_rejections',
            'vpc': 'VPC-A',
            'description': f'High number of rejected connections: {vpc_a_rejected}',
            'severity': 'medium',
            'count': vpc_a_rejected
        })

    vpc_b_rejected = vpc_b_results.get('rejected_connections', 0)
    if vpc_b_rejected > 100:
        anomalies.append({
            'type': 'high_rejections',
            'vpc': 'VPC-B',
            'description': f'High number of rejected connections: {vpc_b_rejected}',
            'severity': 'medium',
            'count': vpc_b_rejected
        })

    return anomalies


def publish_metrics(results: Dict, vpc_name: str):
    """
    Publish custom metrics to CloudWatch.

    Args:
        results: Analysis results
        vpc_name: Name of VPC
    """
    try:
        metrics = [
            {
                'MetricName': 'TotalRequests',
                'Value': results.get('total_requests', 0),
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'VPC', 'Value': vpc_name}
                ]
            },
            {
                'MetricName': 'UniqueSourceIPs',
                'Value': results.get('unique_sources', 0),
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'VPC', 'Value': vpc_name}
                ]
            },
            {
                'MetricName': 'RejectedConnections',
                'Value': results.get('rejected_connections', 0),
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'VPC', 'Value': vpc_name}
                ]
            },
            {
                'MetricName': 'ExternalTraffic',
                'Value': results.get('external_traffic_count', 0),
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'VPC', 'Value': vpc_name}
                ]
            },
            {
                'MetricName': 'TotalBytes',
                'Value': results.get('total_bytes', 0),
                'Unit': 'Bytes',
                'Dimensions': [
                    {'Name': 'VPC', 'Value': vpc_name}
                ]
            }
        ]

        cloudwatch_client.put_metric_data(
            Namespace=NAMESPACE,
            MetricData=metrics
        )

        print(f"Published {len(metrics)} metrics for {vpc_name}")

    except Exception as e:
        print(f"Error publishing metrics for {vpc_name}: {str(e)}")


def send_anomaly_alert(anomalies: List[Dict], vpc_a_results: Dict, vpc_b_results: Dict):
    """
    Send SNS alert for detected anomalies.

    Args:
        anomalies: List of detected anomalies
        vpc_a_results: VPC-A analysis results
        vpc_b_results: VPC-B analysis results
    """
    try:
        # Build alert message
        subject = f"VPC Peering Anomaly Alert - {len(anomalies)} anomalies detected"

        message_parts = [
            "VPC Peering Traffic Analysis Alert",
            "=" * 50,
            f"\nTimestamp: {datetime.utcnow().isoformat()}Z",
            f"\nDetected {len(anomalies)} anomalies:\n"
        ]

        # Group anomalies by severity
        high_severity = [a for a in anomalies if a.get('severity') == 'high']
        medium_severity = [a for a in anomalies if a.get('severity') == 'medium']

        if high_severity:
            message_parts.append("\nHIGH SEVERITY ANOMALIES:")
            for anomaly in high_severity:
                message_parts.append(f"  - [{anomaly['vpc']}] {anomaly['description']}")

        if medium_severity:
            message_parts.append("\nMEDIUM SEVERITY ANOMALIES:")
            for anomaly in medium_severity:
                message_parts.append(f"  - [{anomaly['vpc']}] {anomaly['description']}")

        # Add traffic summary
        message_parts.extend([
            "\n" + "=" * 50,
            "\nTRAFFIC SUMMARY:",
            f"\nVPC-A:",
            f"  Total Requests: {vpc_a_results.get('total_requests', 0)}",
            f"  Rejected Connections: {vpc_a_results.get('rejected_connections', 0)}",
            f"  External Traffic: {vpc_a_results.get('external_traffic_count', 0)}",
            f"\nVPC-B:",
            f"  Total Requests: {vpc_b_results.get('total_requests', 0)}",
            f"  Rejected Connections: {vpc_b_results.get('rejected_connections', 0)}",
            f"  External Traffic: {vpc_b_results.get('external_traffic_count', 0)}",
        ])

        # Add top source IPs
        if vpc_a_results.get('top_source_ips'):
            message_parts.append("\nVPC-A Top Source IPs:")
            for ip, count in vpc_a_results['top_source_ips'][:5]:
                message_parts.append(f"  {ip}: {count} requests")

        if vpc_b_results.get('top_source_ips'):
            message_parts.append("\nVPC-B Top Source IPs:")
            for ip, count in vpc_b_results['top_source_ips'][:5]:
                message_parts.append(f"  {ip}: {count} requests")

        message_parts.append("\n" + "=" * 50)
        message_parts.append("\nThis is an automated alert from VPC Traffic Analyzer Lambda")

        message = "\n".join(message_parts)

        # Publish to SNS
        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )

        print(f"Sent anomaly alert to SNS. MessageId: {response['MessageId']}")

    except Exception as e:
        print(f"Error sending SNS alert: {str(e)}")
```

---

## Deployment Instructions

### Prerequisites

1. **Terraform Installation**: Terraform >= 1.4.0
2. **AWS CLI**: Configured with appropriate credentials
3. **AWS Permissions**: IAM user/role with permissions for VPC, CloudWatch, Lambda, SNS, and IAM
4. **Python**: Python 3.12 (for Lambda function)
5. **S3 Backend**: S3 bucket for Terraform state storage

### Step 1: Prepare Backend Configuration

Create a `backend-config.tfvars` file:

```hcl
bucket         = "your-terraform-state-bucket"
key            = "vpc-peering/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-state-lock"
```

### Step 2: Prepare Variable Values

Create a `terraform.tfvars` file:

```hcl
aws_region                      = "us-east-1"
vpc_a_cidr                      = "10.0.0.0/16"
vpc_b_cidr                      = "10.1.0.0/16"
allowed_ports                   = ["443", "8080", "3306"]
retention_days                  = 30
traffic_volume_threshold        = 500
rejected_connections_threshold  = 50
anomaly_threshold_percent       = 20
traffic_baseline                = 417
lambda_schedule                 = "rate(1 hour)"
alert_email                     = "alerts@example.com"
create_dashboard                = true
environment                     = "dev"
owner                           = "Platform Team"
```

### Step 3: Initialize Terraform

```bash
cd /path/to/iac-test-automations/lib
terraform init -backend-config=backend-config.tfvars
```

### Step 4: Validate Configuration

```bash
terraform validate
terraform fmt -check
```

### Step 5: Plan Deployment

```bash
terraform plan -var-file=terraform.tfvars -out=tfplan
```

Review the plan output carefully. Expected resources: ~80+ resources

### Step 6: Apply Configuration

```bash
terraform apply tfplan
```

Expected duration: 5-10 minutes (NAT Gateways take the longest)

### Step 7: Confirm SNS Subscription

After deployment, check your email for an SNS subscription confirmation and click the confirmation link.

### Step 8: Verify Deployment

```bash
# Check VPC creation
aws ec2 describe-vpcs --filters "Name=tag:Project,Values=VPCPeering"

# Check peering connection
aws ec2 describe-vpc-peering-connections

# Check Lambda function
aws lambda get-function --function-name $(terraform output -raw lambda_function_name)

# Check CloudWatch dashboard
terraform output dashboard_url
```

### Step 9: Test Lambda Function

```bash
aws lambda invoke \
  --function-name $(terraform output -raw lambda_function_name) \
  --log-type Tail \
  --query 'LogResult' \
  --output text \
  response.json | base64 -d

cat response.json
```

---

## Testing

### Unit Tests

Unit tests validate individual Terraform resources and Lambda function logic without requiring actual AWS resources.

### Integration Tests

Integration tests validate end-to-end functionality after deployment. These tests interact with actual deployed AWS resources.

Run integration tests:

```bash
cd /path/to/iac-test-automations
pytest test/integration/ -v --tb=short
```

---

## Troubleshooting

### Issue 1: Terraform Init Fails

**Symptom**: `Error: Failed to get existing workspaces`

**Solution**:
```bash
# Verify S3 bucket exists and is accessible
aws s3 ls s3://your-terraform-state-bucket/

# Check IAM permissions for S3 and DynamoDB
aws sts get-caller-identity

# Verify backend configuration
cat backend-config.tfvars
```

### Issue 2: VPC CIDR Overlap

**Symptom**: `Error creating VPC Peering Connection: InvalidVpcPeeringConnectionID.Malformed`

**Solution**:
```bash
# Ensure VPC CIDRs do not overlap
# VPC-A: 10.0.0.0/16
# VPC-B: 10.1.0.0/16

# Update terraform.tfvars if needed
vim terraform.tfvars
terraform plan -var-file=terraform.tfvars
```

### Issue 3: Lambda Function Timeout

**Symptom**: Lambda execution exceeds 300 seconds

**Solution**:
```bash
# Check CloudWatch Logs Insights query complexity
aws logs get-query-results --query-id <query-id>

# Increase Lambda timeout in tap_stack.tf
# timeout = 600  # Increase to 10 minutes
```

### Issue 4: No Flow Logs Data

**Symptom**: Flow logs log group exists but has no data

**Solution**:
```bash
# Flow Logs take 5-10 minutes to start generating data
# Check Flow Logs status
aws ec2 describe-flow-logs --filter "Name=resource-id,Values=vpc-xxx"

# Wait and check logs
aws logs tail /aws/vpc/flowlogs/vpc-a-12345678 --follow
```

### Issue 5: SNS Email Not Received

**Symptom**: Alerts not arriving via email

**Solution**:
```bash
# Check SNS subscription status
aws sns list-subscriptions-by-topic --topic-arn <topic-arn>

# Confirm subscription (check email spam folder)
# Manually send test notification
aws sns publish --topic-arn <topic-arn> --message "Test alert"
```

---

## CloudWatch Logs Insights Queries

### Query 1: Top Source IPs by Request Count

```
fields @timestamp, srcaddr, dstaddr, srcport, dstport, action
| stats count() as request_count by srcaddr
| sort request_count desc
| limit 20
```

### Query 2: Rejected Connections by Destination Port

```
fields @timestamp, srcaddr, dstaddr, dstport, action
| filter action = "REJECT"
| stats count() as rejected_count by dstport
| sort rejected_count desc
```

### Query 3: Traffic Volume Over Time

```
fields @timestamp
| stats count() as log_count by bin(5m)
| sort @timestamp asc
```

### Query 4: Cross-VPC Traffic Analysis

```
fields @timestamp, srcaddr, dstaddr, srcport, dstport, bytes, action
| filter (srcaddr like /^10\.0\./ and dstaddr like /^10\.1\./)
   or (srcaddr like /^10\.1\./ and dstaddr like /^10\.0\./)
| stats sum(bytes) as total_bytes, count() as request_count by srcaddr, dstaddr
| sort total_bytes desc
```

### Query 5: External Traffic Detection

```
fields @timestamp, srcaddr, dstaddr, srcport, dstport, action
| filter srcaddr not like /^10\.0\./ and srcaddr not like /^10\.1\./
| stats count() as external_count by srcaddr, dstaddr
| sort external_count desc
| limit 50
```

### Query 6: High Bandwidth Consumers

```
fields @timestamp, srcaddr, dstaddr, bytes
| stats sum(bytes) as total_bytes by srcaddr
| sort total_bytes desc
| limit 20
```

### Query 7: Connection Success Rate

```
fields @timestamp, action
| stats count() as total,
        sum(case when action = "ACCEPT" then 1 else 0 end) as accepted,
        sum(case when action = "REJECT" then 1 else 0 end) as rejected
| extend success_rate = (accepted / total) * 100
```

### Query 8: Anomalous Port Activity

```
fields @timestamp, srcaddr, dstaddr, dstport, action
| filter dstport not in ["443", "8080", "3306"]
| stats count() as request_count by dstport, srcaddr
| sort request_count desc
```

---

## Variable Reference

| Variable Name | Type | Default | Description | Required |
|--------------|------|---------|-------------|----------|
| `aws_region` | string | `"us-east-1"` | AWS region for resources | No |
| `vpc_a_cidr` | string | `"10.0.0.0/16"` | CIDR block for VPC-A | No |
| `vpc_b_cidr` | string | `"10.1.0.0/16"` | CIDR block for VPC-B | No |
| `allowed_ports` | list(string) | `["443", "8080", "3306"]` | List of allowed ports for cross-VPC communication | No |
| `retention_days` | number | `30` | CloudWatch Logs retention period in days | No |
| `traffic_volume_threshold` | number | `500` | Threshold for traffic volume alarm | No |
| `rejected_connections_threshold` | number | `50` | Threshold for rejected connections alarm | No |
| `anomaly_threshold_percent` | number | `20` | Percentage above baseline to trigger anomaly alert | No |
| `traffic_baseline` | number | `417` | Baseline traffic in requests per hour | No |
| `lambda_schedule` | string | `"rate(1 hour)"` | Schedule expression for Lambda execution | No |
| `alert_email` | string | N/A | Email address for alert notifications | Yes |
| `create_dashboard` | bool | `true` | Whether to create CloudWatch dashboard | No |
| `environment` | string | `"dev"` | Environment name | No |
| `owner` | string | `"Platform Team"` | Owner tag for resources | No |

---

## Outputs Reference

| Output Name | Description | Sensitive |
|------------|-------------|-----------|
| `vpc_a_id` | ID of VPC-A | No |
| `vpc_b_id` | ID of VPC-B | No |
| `vpc_a_cidr` | CIDR block of VPC-A | No |
| `vpc_b_cidr` | CIDR block of VPC-B | No |
| `peering_connection_id` | ID of VPC peering connection | No |
| `vpc_a_security_group_id` | Security group ID for VPC-A | No |
| `vpc_b_security_group_id` | Security group ID for VPC-B | No |
| `vpc_a_log_group_name` | CloudWatch log group name for VPC-A Flow Logs | No |
| `vpc_b_log_group_name` | CloudWatch log group name for VPC-B Flow Logs | No |
| `lambda_function_arn` | ARN of traffic analyzer Lambda function | No |
| `lambda_function_name` | Name of traffic analyzer Lambda function | No |
| `sns_topic_arn` | ARN of SNS alerts topic | No |
| `dashboard_url` | URL to CloudWatch dashboard | No |
| `alert_email` | Email address receiving alerts | Yes |

---

## Cost Estimation

### Monthly Cost Breakdown (us-east-1, Development Environment)

| Resource | Quantity | Unit Cost | Monthly Cost |
|----------|----------|-----------|--------------|
| VPC (2x) | 2 | Free | $0.00 |
| NAT Gateways (4x) | 4 | $0.045/hour | $129.60 |
| Elastic IPs (4x) | 4 | $0.005/hour | $14.40 |
| CloudWatch Logs Storage | ~5GB | $0.50/GB | $2.50 |
| CloudWatch Logs Ingestion | ~10GB | $0.50/GB | $5.00 |
| Lambda Invocations | 720/month | Free | $0.00 |
| Lambda Duration | ~720 GB-seconds | $0.0000166667/GB-second | $0.01 |
| CloudWatch Dashboard | 1 | $3.00/dashboard | $3.00 |
| SNS Email Notifications | ~10/month | Free | $0.00 |
| VPC Peering Data Transfer | ~100GB | $0.01/GB | $1.00 |
| **TOTAL** | | | **~$155.51/month** |

### Cost Optimization Recommendations

1. **NAT Gateway Costs**: Use single NAT Gateway per VPC (saves ~$65/month)
2. **CloudWatch Logs**: Reduce retention period or filter logs (saves ~$5/month)
3. **Lambda**: Reduce execution frequency (minimal savings)
4. **Development**: Destroy resources when not in use

---

## Security Considerations

### Network Security

1. **VPC Isolation**: Each VPC is completely isolated except for peering connection
2. **Security Group Rules**: Ingress rules limited to specific ports (443, 8080, 3306)
3. **CIDR-based Filtering**: Only peer VPC CIDR allowed

### IAM Security

1. **Least Privilege**: VPC Flow Logs role only has CloudWatch Logs write permissions
2. **Lambda Role**: Only required permissions (logs read, CloudWatch metrics write, SNS publish)
3. **Resource-Based Policies**: SNS topic policy allows only CloudWatch and Lambda to publish

### Data Security

1. **Encryption at Rest**: CloudWatch Logs encrypted using AWS managed keys
2. **Encryption in Transit**: All AWS service communication uses HTTPS
3. **Sensitive Data**: `alert_email` marked as sensitive in Terraform

---

## Maintenance and Operations

### Daily Operations

1. Monitor CloudWatch dashboard for traffic patterns
2. Review SNS email alerts for anomalies
3. Check Lambda function execution success rate

### Weekly Operations

1. Review Flow Logs using CloudWatch Logs Insights queries
2. Check for unusual source IPs or ports
3. Review Lambda performance metrics

### Monthly Operations

1. Review AWS costs in Cost Explorer
2. Update Lambda function if needed
3. Review and adjust thresholds based on actual traffic patterns

### Emergency Procedures

#### High Traffic Volume Alert

1. Check CloudWatch dashboard for traffic spike source
2. Run Logs Insights query to identify source IPs
3. If malicious, add security group rule to block
4. Notify stakeholders

#### Lambda Function Failure

1. Check Lambda CloudWatch Logs for error details
2. Verify IAM permissions are intact
3. Test Lambda manually via AWS Console
4. If persistent, redeploy Lambda function

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Maintained By**: Platform Team
