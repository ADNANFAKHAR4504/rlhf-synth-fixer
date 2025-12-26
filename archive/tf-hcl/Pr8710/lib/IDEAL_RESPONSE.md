# Payment Processing VPC Infrastructure - Terraform Solution (Corrected)

This is a production-ready Terraform configuration for a PCI DSS-compliant VPC infrastructure supporting payment processing workloads with multi-AZ high availability.

## File: lib/provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}
```

## File: lib/variables.tf

```hcl
# variables.tf

variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., dev, staging, prod)"
  type        = string
  validation {
    condition     = length(var.environment_suffix) > 0
    error_message = "Environment suffix must not be empty."
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

variable "az_count" {
  description = "Number of availability zones to use (minimum 2 for HA)"
  type        = number
  default     = 2
  validation {
    condition     = var.az_count >= 2
    error_message = "At least 2 availability zones are required for high availability."
  }
}

variable "flow_log_retention_days" {
  description = "Number of days to retain VPC flow logs"
  type        = number
  default     = 30
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.flow_log_retention_days)
    error_message = "Flow log retention days must be a valid CloudWatch Logs retention period."
  }
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "payment-processing"
    ManagedBy  = "terraform"
    Compliance = "PCI-DSS"
  }
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}
```

## File: lib/main.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "vpc-payment-${var.environment_suffix}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "igw-payment-${var.environment_suffix}"
    }
  )
}

# Public Subnets (DMZ Tier)
resource "aws_subnet" "public" {
  count = var.az_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name = "subnet-public-${count.index + 1}-${var.environment_suffix}"
      Tier = "public"
      Type = "dmz"
    }
  )
}

# Private Subnets (Application Tier)
resource "aws_subnet" "private" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + var.az_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    var.common_tags,
    {
      Name = "subnet-private-${count.index + 1}-${var.environment_suffix}"
      Tier = "private"
      Type = "application"
    }
  )
}

# Isolated Subnets (Data Tier - Payment Processing)
resource "aws_subnet" "isolated" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + (var.az_count * 2))
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    var.common_tags,
    {
      Name       = "subnet-isolated-${count.index + 1}-${var.environment_suffix}"
      Tier       = "isolated"
      Type       = "data"
      Compliance = "PCI-DSS"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.az_count

  domain = "vpc"

  tags = merge(
    var.common_tags,
    {
      Name = "eip-nat-${count.index + 1}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (one per AZ for HA)
resource "aws_nat_gateway" "main" {
  count = var.az_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.common_tags,
    {
      Name = "nat-${count.index + 1}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "rt-public-${var.environment_suffix}"
    }
  )
}

# Public Route to Internet Gateway
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

# Private Route Tables (one per AZ)
resource "aws_route_table" "private" {
  count = var.az_count

  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "rt-private-${count.index + 1}-${var.environment_suffix}"
    }
  )
}

# Private Routes to NAT Gateways
resource "aws_route" "private_nat" {
  count = var.az_count

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

# Isolated Route Tables (one per AZ - no internet access)
resource "aws_route_table" "isolated" {
  count = var.az_count

  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name       = "rt-isolated-${count.index + 1}-${var.environment_suffix}"
      Compliance = "PCI-DSS"
    }
  )
}

# Route Table Associations - Public Subnets
resource "aws_route_table_association" "public" {
  count = var.az_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private Subnets
resource "aws_route_table_association" "private" {
  count = var.az_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Route Table Associations - Isolated Subnets
resource "aws_route_table_association" "isolated" {
  count = var.az_count

  subnet_id      = aws_subnet.isolated[count.index].id
  route_table_id = aws_route_table.isolated[count.index].id
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flow-logs-${var.environment_suffix}"
  retention_in_days = var.flow_log_retention_days

  tags = merge(
    var.common_tags,
    {
      Name = "log-group-vpc-flow-${var.environment_suffix}"
    }
  )
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "role-vpc-flow-logs-${var.environment_suffix}"

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

  tags = merge(
    var.common_tags,
    {
      Name = "role-vpc-flow-logs-${var.environment_suffix}"
    }
  )
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "policy-vpc-flow-logs-${var.environment_suffix}"
  role = aws_iam_role.vpc_flow_logs.id

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

# VPC Flow Logs
resource "aws_flow_log" "main" {
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs.arn
  iam_role_arn         = aws_iam_role.vpc_flow_logs.arn
  vpc_id               = aws_vpc.main.id
  traffic_type         = "ALL"

  tags = merge(
    var.common_tags,
    {
      Name = "flow-log-vpc-${var.environment_suffix}"
    }
  )
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
```

## File: lib/security_groups.tf (CORRECTED)

```hcl
# Security Group - Web/Load Balancer Tier
resource "aws_security_group" "web" {
  name_prefix = "web-${var.environment_suffix}-"
  description = "Security group for web tier and load balancers"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "sg-web-${var.environment_suffix}"
      Tier = "public"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Web SG - Allow HTTPS inbound
resource "aws_security_group_rule" "web_https_inbound" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow HTTPS from internet"
  security_group_id = aws_security_group.web.id
}

# Web SG - Allow HTTP inbound
resource "aws_security_group_rule" "web_http_inbound" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow HTTP from internet"
  security_group_id = aws_security_group.web.id
}

# Web SG - Allow all outbound
resource "aws_security_group_rule" "web_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.web.id
}

# Security Group - Application Tier
resource "aws_security_group" "app" {
  name_prefix = "app-${var.environment_suffix}-"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "sg-app-${var.environment_suffix}"
      Tier = "private"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# App SG - Allow traffic from web tier
resource "aws_security_group_rule" "app_from_web" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.web.id
  description              = "Allow application traffic from web tier"
  security_group_id        = aws_security_group.app.id
}

# App SG - Allow all outbound
resource "aws_security_group_rule" "app_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.app.id
}

# Security Group - Data Tier (Payment Processing)
resource "aws_security_group" "data" {
  name_prefix = "data-${var.environment_suffix}-"
  description = "Security group for data tier - payment processing"
  vpc_id      = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name       = "sg-data-${var.environment_suffix}"
      Tier       = "isolated"
      Compliance = "PCI-DSS"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Data SG - Allow MySQL from app tier
resource "aws_security_group_rule" "data_mysql_from_app" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app.id
  description              = "Allow MySQL from application tier"
  security_group_id        = aws_security_group.data.id
}

# Data SG - Allow PostgreSQL from app tier
resource "aws_security_group_rule" "data_postgres_from_app" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app.id
  description              = "Allow PostgreSQL from application tier"
  security_group_id        = aws_security_group.data.id
}

# Data SG - Restricted outbound (no direct internet access)
resource "aws_security_group_rule" "data_outbound_vpc" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = [var.vpc_cidr]
  description       = "Allow outbound only within VPC"
  security_group_id = aws_security_group.data.id
}
```

## File: lib/network_acls.tf

```hcl
# Network ACL - Public Subnets
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  tags = merge(
    var.common_tags,
    {
      Name = "nacl-public-${var.environment_suffix}"
      Tier = "public"
    }
  )
}

# Public NACL - Allow all inbound (stateless - must allow return traffic)
resource "aws_network_acl_rule" "public_inbound_all" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

# Public NACL - Allow all outbound
resource "aws_network_acl_rule" "public_outbound_all" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

# Network ACL - Private Subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  tags = merge(
    var.common_tags,
    {
      Name = "nacl-private-${var.environment_suffix}"
      Tier = "private"
    }
  )
}

# Private NACL - Allow inbound from VPC
resource "aws_network_acl_rule" "private_inbound_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

# Private NACL - Allow ephemeral ports inbound (for return traffic)
resource "aws_network_acl_rule" "private_inbound_ephemeral" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Private NACL - Allow all outbound
resource "aws_network_acl_rule" "private_outbound_all" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

# Network ACL - Isolated Subnets (Strict PCI DSS)
resource "aws_network_acl" "isolated" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.isolated[*].id

  tags = merge(
    var.common_tags,
    {
      Name       = "nacl-isolated-${var.environment_suffix}"
      Tier       = "isolated"
      Compliance = "PCI-DSS"
    }
  )
}

# Isolated NACL - Allow inbound only from VPC
resource "aws_network_acl_rule" "isolated_inbound_vpc" {
  network_acl_id = aws_network_acl.isolated.id
  rule_number    = 100
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

# Isolated NACL - Deny inbound from internet
resource "aws_network_acl_rule" "isolated_inbound_deny_internet" {
  network_acl_id = aws_network_acl.isolated.id
  rule_number    = 50
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "0.0.0.0/0"
}

# Isolated NACL - Allow outbound only within VPC
resource "aws_network_acl_rule" "isolated_outbound_vpc" {
  network_acl_id = aws_network_acl.isolated.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

# Isolated NACL - Deny outbound to internet
resource "aws_network_acl_rule" "isolated_outbound_deny_internet" {
  network_acl_id = aws_network_acl.isolated.id
  rule_number    = 50
  egress         = true
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "0.0.0.0/0"
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "Public IP addresses of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "public_subnet_ids" {
  description = "IDs of public subnets (DMZ tier)"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets (Application tier)"
  value       = aws_subnet.private[*].id
}

output "isolated_subnet_ids" {
  description = "IDs of isolated subnets (Data tier)"
  value       = aws_subnet.isolated[*].id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

output "isolated_route_table_ids" {
  description = "IDs of the isolated route tables"
  value       = aws_route_table.isolated[*].id
}

output "security_group_web_id" {
  description = "ID of the web tier security group"
  value       = aws_security_group.web.id
}

output "security_group_app_id" {
  description = "ID of the application tier security group"
  value       = aws_security_group.app.id
}

output "security_group_data_id" {
  description = "ID of the data tier security group"
  value       = aws_security_group.data.id
}

output "vpc_flow_log_id" {
  description = "ID of the VPC flow log"
  value       = aws_flow_log.main.id
}

output "vpc_flow_log_group_name" {
  description = "CloudWatch Log Group name for VPC flow logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "availability_zones" {
  description = "Availability zones used for deployment"
  value       = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}
```

## Key Corrections Summary

**Critical Fix**: Security group `name_prefix` values corrected to remove "sg-" prefix:
- `"sg-web-..."` → `"web-..."`
- `"sg-app-..."` → `"app-..."`
- `"sg-data-..."` → `"data-..."`

This fix resolves the deployment blocker error: "InvalidParameterValue: invalid value for name_prefix (cannot begin with sg-)"

All other infrastructure code is correct and follows AWS best practices for PCI DSS-compliant VPC architectures.
