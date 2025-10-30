# AWS Hub-and-Spoke Network Architecture with Transit Gateway

## Overview

This Terraform implementation provides a production-ready, scalable, and secure hub-and-spoke network architecture for a financial services company's digital banking platform. The architecture uses AWS Transit Gateway to connect multiple VPCs while maintaining complete isolation between spoke environments, centralized internet egress, and centralized DNS resolution.

## Architecture

### Key Components

1. **Hub VPC (10.0.0.0/16)**
   - Central networking hub with Internet Gateway and NAT Gateways
   - Route53 Resolver endpoints for centralized DNS
   - Public subnets for NAT Gateways
   - Private subnets for Route53 Resolver and shared services
   - Transit Gateway attachment subnets

2. **Production Spoke VPC (10.1.0.0/16)**
   - Isolated production environment
   - No direct internet access (routes through hub)
   - Large private subnets for workloads
   - Small public subnets for potential ALBs

3. **Development Spoke VPC (10.2.0.0/16)**
   - Isolated development environment
   - No direct internet access (routes through hub)
   - Large private subnets for workloads
   - Small public subnets for bastion hosts

4. **AWS Transit Gateway**
   - Central routing hub connecting all VPCs
   - Two route tables: Hub and Spoke
   - Blackhole routes for spoke isolation
   - DNS support enabled

5. **Supporting Services**
   - NAT Gateways: 3 (one per AZ in hub VPC)
   - Route53 Resolver: Inbound and outbound endpoints
   - VPC Endpoints: Systems Manager (SSM, SSM Messages, EC2 Messages) in all VPCs
   - VPC Flow Logs: All traffic logged to S3 with lifecycle policies
   - DHCP Options: Custom domain names per VPC

### Traffic Flows

**Internet Access from Spoke:**
```
Spoke EC2 → Transit Gateway → Hub VPC → NAT Gateway → Internet Gateway → Internet
```

**DNS Resolution from Spoke:**
```
Spoke EC2 → Transit Gateway → Hub VPC → Route53 Resolver → DNS Response
```

**Spoke-to-Spoke (Blocked):**
```
Production VPC → Transit Gateway → Blackhole Route → Development VPC (BLOCKED)
```

### Security Features

1. **Complete Spoke Isolation**: Transit Gateway blackhole routes prevent direct spoke-to-spoke communication
2. **Centralized Internet Egress**: All spoke internet traffic flows through hub NAT Gateways
3. **Private Workloads**: All application workloads run in private subnets
4. **VPC Flow Logs**: Comprehensive network traffic logging for audit and compliance
5. **Systems Manager Access**: Secure instance management without bastion hosts or internet access

## Complete Terraform Source Code

### File: lib/versions.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.5.0"
    }
  }

  backend "s3" {}
}
```

### File: lib/provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      ManagedBy  = "Terraform"
      Project    = var.project
      CostCenter = var.cost_center
    }
  }
}
```

### File: lib/variables.tf

```hcl
variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming (e.g., pr4798, synth123). Reads from ENVIRONMENT_SUFFIX env variable if not provided."
  type        = string
  default     = ""

  validation {
    condition     = var.environment_suffix == "" || can(regex("^[a-z0-9-]+$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "hub_vpc_cidr" {
  description = "CIDR block for hub VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.hub_vpc_cidr, 0))
    error_message = "Hub VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "production_vpc_cidr" {
  description = "CIDR block for production VPC"
  type        = string
  default     = "10.1.0.0/16"

  validation {
    condition     = can(cidrhost(var.production_vpc_cidr, 0))
    error_message = "Production VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "development_vpc_cidr" {
  description = "CIDR block for development VPC"
  type        = string
  default     = "10.2.0.0/16"

  validation {
    condition     = can(cidrhost(var.development_vpc_cidr, 0))
    error_message = "Development VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zone_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 3

  validation {
    condition     = var.availability_zone_count >= 2 && var.availability_zone_count <= 6
    error_message = "Availability zone count must be between 2 and 6."
  }
}

variable "transit_gateway_asn" {
  description = "Amazon side ASN for Transit Gateway"
  type        = number
  default     = 64512

  validation {
    condition     = var.transit_gateway_asn >= 64512 && var.transit_gateway_asn <= 65534
    error_message = "Transit Gateway ASN must be between 64512 and 65534 (private ASN range)."
  }
}

variable "cost_center" {
  description = "Cost center for tagging"
  type        = string
  default     = "infrastructure"
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "digital-banking"
}

variable "flow_logs_retention_days" {
  description = "Number of days to retain flow logs"
  type        = number
  default     = 365

  validation {
    condition     = var.flow_logs_retention_days >= 1 && var.flow_logs_retention_days <= 3650
    error_message = "Flow logs retention must be between 1 and 3650 days."
  }
}

variable "flow_logs_glacier_transition_days" {
  description = "Number of days before transitioning flow logs to Glacier"
  type        = number
  default     = 30

  validation {
    condition     = var.flow_logs_glacier_transition_days >= 1
    error_message = "Glacier transition days must be at least 1."
  }
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateways in hub VPC"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "enable_vpc_endpoints" {
  description = "Enable Systems Manager VPC endpoints"
  type        = bool
  default     = true
}

variable "enable_route53_resolver" {
  description = "Enable Route53 Resolver endpoints"
  type        = bool
  default     = true
}

variable "enable_ram_sharing" {
  description = "Enable RAM resource sharing for Route53 Resolver (requires AWS Organizations)"
  type        = bool
  default     = false
}
```

### File: lib/data.tf

```hcl
# Fetch available AZs dynamically
data "aws_availability_zones" "available" {
  state = "available"

  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get current AWS partition
data "aws_partition" "current" {}

# Get current AWS region
data "aws_region" "current" {}
```

### File: lib/locals.tf

```hcl
# Random suffix for unique resource naming (fallback when environment_suffix not provided)
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

locals {
  # Select the required number of AZs
  selected_azs = slice(data.aws_availability_zones.available.names, 0, var.availability_zone_count)

  # Use environment_suffix if provided (from ENVIRONMENT_SUFFIX env var), otherwise use random suffix
  name_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.suffix.result

  # Common tags applied to all resources
  common_tags = {
    Environment = "shared"
    Project     = var.project
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
  }

  # Environment-specific tags
  hub_tags = merge(local.common_tags, {
    Environment = "hub"
    Purpose     = "networking"
  })

  production_tags = merge(local.common_tags, {
    Environment = "production"
    Purpose     = "workloads"
  })

  development_tags = merge(local.common_tags, {
    Environment = "development"
    Purpose     = "workloads"
  })
}
```

### File: lib/vpc-hub.tf

```hcl
# Create hub VPC
module "vpc_hub" {
  source = "./modules/vpc"

  vpc_cidr           = var.hub_vpc_cidr
  environment        = "hub"
  region             = var.region
  purpose            = "network"
  name_suffix        = local.name_suffix
  availability_zones = local.selected_azs

  create_igw                    = true
  create_public_subnets         = true
  create_tgw_attachment_subnets = true

  tags = local.hub_tags
}
```

### File: lib/vpc-spokes.tf

```hcl
# Create production spoke VPC
module "vpc_production" {
  source = "./modules/spoke-vpc"

  vpc_cidr           = var.production_vpc_cidr
  environment        = "production"
  region             = var.region
  purpose            = "workloads"
  name_suffix        = local.name_suffix
  availability_zones = local.selected_azs

  tags = local.production_tags
}

# Create development spoke VPC
module "vpc_development" {
  source = "./modules/spoke-vpc"

  vpc_cidr           = var.development_vpc_cidr
  environment        = "development"
  region             = var.region
  purpose            = "workloads"
  name_suffix        = local.name_suffix
  availability_zones = local.selected_azs

  tags = local.development_tags
}
```

### File: lib/transit-gateway.tf

```hcl
# Create Transit Gateway
module "transit_gateway" {
  source = "./modules/transit-gateway"

  name_prefix     = "shared-${var.region}"
  name_suffix     = local.name_suffix
  amazon_side_asn = var.transit_gateway_asn

  vpc_attachments = {
    hub = {
      vpc_id     = module.vpc_hub.vpc_id
      subnet_ids = module.vpc_hub.tgw_attachment_subnet_ids
      cidr_block = var.hub_vpc_cidr
    }
    production = {
      vpc_id     = module.vpc_production.vpc_id
      subnet_ids = module.vpc_production.tgw_attachment_subnet_ids
      cidr_block = var.production_vpc_cidr
    }
    development = {
      vpc_id     = module.vpc_development.vpc_id
      subnet_ids = module.vpc_development.tgw_attachment_subnet_ids
      cidr_block = var.development_vpc_cidr
    }
  }

  tags = merge(local.common_tags, {
    Environment = "shared"
    Purpose     = "connectivity"
  })

  depends_on = [
    module.vpc_hub,
    module.vpc_production,
    module.vpc_development
  ]
}

# Add routes in VPC route tables to Transit Gateway
# Hub VPC routes to spokes
resource "aws_route" "hub_to_production" {
  count = length(module.vpc_hub.private_route_table_ids)

  route_table_id         = module.vpc_hub.private_route_table_ids[count.index]
  destination_cidr_block = var.production_vpc_cidr
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}

resource "aws_route" "hub_to_development" {
  count = length(module.vpc_hub.private_route_table_ids)

  route_table_id         = module.vpc_hub.private_route_table_ids[count.index]
  destination_cidr_block = var.development_vpc_cidr
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}

# Spoke VPC routes to Transit Gateway (default route)
resource "aws_route" "production_default" {
  route_table_id         = module.vpc_production.private_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}

resource "aws_route" "production_public_default" {
  route_table_id         = module.vpc_production.public_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}

resource "aws_route" "development_default" {
  route_table_id         = module.vpc_development.private_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}

resource "aws_route" "development_public_default" {
  route_table_id         = module.vpc_development.public_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}
```

### File: lib/nat-gateways.tf

```hcl
# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? var.availability_zone_count : 0

  domain = "vpc"

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-eip-nat-az${count.index + 1}-${local.name_suffix}"
  })

  depends_on = [module.vpc_hub]
}

# NAT Gateways
resource "aws_nat_gateway" "hub" {
  count = var.enable_nat_gateway ? var.availability_zone_count : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = module.vpc_hub.public_subnet_ids[count.index]

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-nat-az${count.index + 1}-${local.name_suffix}"
  })

  depends_on = [aws_eip.nat]
}

# Routes from hub private subnets to NAT Gateways
resource "aws_route" "hub_private_nat" {
  count = var.enable_nat_gateway ? length(module.vpc_hub.private_route_table_ids) : 0

  route_table_id         = module.vpc_hub.private_route_table_ids[count.index]
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.hub[count.index].id

  depends_on = [aws_nat_gateway.hub]
}
```

### File: lib/route53-resolver.tf

```hcl
# Security group for Route53 resolver endpoints
resource "aws_security_group" "resolver" {
  count = var.enable_route53_resolver ? 1 : 0

  name_prefix = "hub-${var.region}-sg-resolver-"
  description = "Security group for Route53 resolver endpoints"
  vpc_id      = module.vpc_hub.vpc_id

  ingress {
    description = "DNS UDP from VPCs"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  ingress {
    description = "DNS TCP from VPCs"
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-sg-resolver-${local.name_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Route53 Resolver inbound endpoint
resource "aws_route53_resolver_endpoint" "inbound" {
  count = var.enable_route53_resolver ? 1 : 0

  name               = "hub-${var.region}-resolver-inbound-${local.name_suffix}"
  direction          = "INBOUND"
  security_group_ids = [aws_security_group.resolver[0].id]

  dynamic "ip_address" {
    for_each = module.vpc_hub.private_subnet_ids

    content {
      subnet_id = ip_address.value
    }
  }

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-resolver-inbound-${local.name_suffix}"
  })

  depends_on = [aws_security_group.resolver]
}

# Route53 Resolver outbound endpoint
resource "aws_route53_resolver_endpoint" "outbound" {
  count = var.enable_route53_resolver ? 1 : 0

  name               = "hub-${var.region}-resolver-outbound-${local.name_suffix}"
  direction          = "OUTBOUND"
  security_group_ids = [aws_security_group.resolver[0].id]

  dynamic "ip_address" {
    for_each = module.vpc_hub.private_subnet_ids

    content {
      subnet_id = ip_address.value
    }
  }

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-resolver-outbound-${local.name_suffix}"
  })

  depends_on = [aws_security_group.resolver]
}

# Share resolver rules with spoke VPCs using AWS RAM (optional - requires AWS Organizations)
resource "aws_ram_resource_share" "resolver_rules" {
  count = var.enable_route53_resolver && var.enable_ram_sharing ? 1 : 0

  name                      = "shared-${var.region}-ram-resolver-rules-${local.name_suffix}"
  allow_external_principals = false

  tags = merge(local.common_tags, {
    Name = "shared-${var.region}-ram-resolver-rules-${local.name_suffix}"
  })
}

# Associate VPCs with RAM share (optional - requires AWS Organizations)
resource "aws_ram_principal_association" "resolver_rules" {
  count = var.enable_route53_resolver && var.enable_ram_sharing ? 1 : 0

  principal          = data.aws_caller_identity.current.account_id
  resource_share_arn = aws_ram_resource_share.resolver_rules[0].arn
}
```

### File: lib/dhcp-options.tf

```hcl
# DHCP options for hub VPC
resource "aws_vpc_dhcp_options" "hub" {
  domain_name         = "hub.company.internal"
  domain_name_servers = ["AmazonProvidedDNS"]

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-dhcp-options-${local.name_suffix}"
  })
}

resource "aws_vpc_dhcp_options_association" "hub" {
  vpc_id          = module.vpc_hub.vpc_id
  dhcp_options_id = aws_vpc_dhcp_options.hub.id
}

# DHCP options for production VPC
resource "aws_vpc_dhcp_options" "production" {
  domain_name         = "prod.company.internal"
  domain_name_servers = ["AmazonProvidedDNS"]

  tags = merge(local.production_tags, {
    Name = "production-${var.region}-dhcp-options-${local.name_suffix}"
  })
}

resource "aws_vpc_dhcp_options_association" "production" {
  vpc_id          = module.vpc_production.vpc_id
  dhcp_options_id = aws_vpc_dhcp_options.production.id
}

# DHCP options for development VPC
resource "aws_vpc_dhcp_options" "development" {
  domain_name         = "dev.company.internal"
  domain_name_servers = ["AmazonProvidedDNS"]

  tags = merge(local.development_tags, {
    Name = "development-${var.region}-dhcp-options-${local.name_suffix}"
  })
}

resource "aws_vpc_dhcp_options_association" "development" {
  vpc_id          = module.vpc_development.vpc_id
  dhcp_options_id = aws_vpc_dhcp_options.development.id
}
```

### File: lib/vpc-endpoints.tf

```hcl
# VPC endpoints for hub
module "vpc_endpoints_hub" {
  count = var.enable_vpc_endpoints ? 1 : 0

  source = "./modules/vpc-endpoints"

  name_prefix = "hub-${var.region}"
  name_suffix = local.name_suffix
  vpc_id      = module.vpc_hub.vpc_id
  vpc_cidr    = module.vpc_hub.vpc_cidr
  subnet_ids  = module.vpc_hub.private_subnet_ids
  region      = var.region

  tags = local.hub_tags
}

# VPC endpoints for production
module "vpc_endpoints_production" {
  count = var.enable_vpc_endpoints ? 1 : 0

  source = "./modules/vpc-endpoints"

  name_prefix = "production-${var.region}"
  name_suffix = local.name_suffix
  vpc_id      = module.vpc_production.vpc_id
  vpc_cidr    = module.vpc_production.vpc_cidr
  subnet_ids  = module.vpc_production.private_subnet_ids
  region      = var.region

  tags = local.production_tags
}

# VPC endpoints for development
module "vpc_endpoints_development" {
  count = var.enable_vpc_endpoints ? 1 : 0

  source = "./modules/vpc-endpoints"

  name_prefix = "development-${var.region}"
  name_suffix = local.name_suffix
  vpc_id      = module.vpc_development.vpc_id
  vpc_cidr    = module.vpc_development.vpc_cidr
  subnet_ids  = module.vpc_development.private_subnet_ids
  region      = var.region

  tags = local.development_tags
}
```

### File: lib/flow-logs.tf

```hcl
# VPC Flow Logs
module "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  source = "./modules/flow-logs"

  bucket_name = "shared-${var.region}-s3-flowlogs-${local.name_suffix}"
  name_suffix = local.name_suffix

  vpc_configs = {
    hub = {
      vpc_id      = module.vpc_hub.vpc_id
      name_prefix = "hub-${var.region}"
    }
    production = {
      vpc_id      = module.vpc_production.vpc_id
      name_prefix = "production-${var.region}"
    }
    development = {
      vpc_id      = module.vpc_development.vpc_id
      name_prefix = "development-${var.region}"
    }
  }

  transition_days = var.flow_logs_glacier_transition_days
  expiration_days = var.flow_logs_retention_days

  tags = merge(local.common_tags, {
    Environment = "shared"
    Purpose     = "logging"
  })
}
```

### File: lib/outputs.tf

```hcl
# VPC outputs
output "vpc_ids" {
  description = "IDs of all VPCs"
  value = {
    hub         = module.vpc_hub.vpc_id
    production  = module.vpc_production.vpc_id
    development = module.vpc_development.vpc_id
  }
}

output "vpc_cidrs" {
  description = "CIDR blocks of all VPCs"
  value = {
    hub         = module.vpc_hub.vpc_cidr
    production  = module.vpc_production.vpc_cidr
    development = module.vpc_development.vpc_cidr
  }
}

# Subnet outputs
output "subnet_ids" {
  description = "IDs of all subnets"
  value = {
    hub = {
      public  = module.vpc_hub.public_subnet_ids
      private = module.vpc_hub.private_subnet_ids
      tgw     = module.vpc_hub.tgw_attachment_subnet_ids
    }
    production = {
      public  = module.vpc_production.public_subnet_ids
      private = module.vpc_production.private_subnet_ids
      tgw     = module.vpc_production.tgw_attachment_subnet_ids
    }
    development = {
      public  = module.vpc_development.public_subnet_ids
      private = module.vpc_development.private_subnet_ids
      tgw     = module.vpc_development.tgw_attachment_subnet_ids
    }
  }
}

# Transit Gateway outputs
output "transit_gateway_id" {
  description = "ID of the Transit Gateway"
  value       = module.transit_gateway.transit_gateway_id
}

output "transit_gateway_arn" {
  description = "ARN of the Transit Gateway"
  value       = module.transit_gateway.transit_gateway_arn
}

output "transit_gateway_route_table_ids" {
  description = "IDs of Transit Gateway route tables"
  value = {
    hub   = module.transit_gateway.hub_route_table_id
    spoke = module.transit_gateway.spoke_route_table_id
  }
}

# NAT Gateway outputs
output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = var.enable_nat_gateway ? { for idx, gw in aws_nat_gateway.hub : idx => gw.id } : {}
}

output "nat_gateway_public_ips" {
  description = "Public IPs of NAT Gateways"
  value       = var.enable_nat_gateway ? { for idx, eip in aws_eip.nat : idx => eip.public_ip } : {}
}

# Route53 Resolver outputs
output "resolver_inbound_endpoint_ips" {
  description = "IP addresses of the inbound resolver endpoint"
  value       = var.enable_route53_resolver ? [for ip in aws_route53_resolver_endpoint.inbound[0].ip_address : ip.ip] : []
}

output "resolver_endpoint_ids" {
  description = "IDs of Route53 Resolver endpoints"
  value = var.enable_route53_resolver ? {
    inbound  = aws_route53_resolver_endpoint.inbound[0].id
    outbound = aws_route53_resolver_endpoint.outbound[0].id
  } : {}
}

# Systems Manager endpoints outputs
output "ssm_endpoint_dns_names" {
  description = "DNS names of Systems Manager VPC endpoints"
  value = var.enable_vpc_endpoints ? {
    hub = {
      ssm          = try(module.vpc_endpoints_hub[0].ssm_endpoint_dns, "")
      ssm_messages = try(module.vpc_endpoints_hub[0].ssm_messages_endpoint_dns, "")
      ec2_messages = try(module.vpc_endpoints_hub[0].ec2_messages_endpoint_dns, "")
    }
    production = {
      ssm          = try(module.vpc_endpoints_production[0].ssm_endpoint_dns, "")
      ssm_messages = try(module.vpc_endpoints_production[0].ssm_messages_endpoint_dns, "")
      ec2_messages = try(module.vpc_endpoints_production[0].ec2_messages_endpoint_dns, "")
    }
    development = {
      ssm          = try(module.vpc_endpoints_development[0].ssm_endpoint_dns, "")
      ssm_messages = try(module.vpc_endpoints_development[0].ssm_messages_endpoint_dns, "")
      ec2_messages = try(module.vpc_endpoints_development[0].ec2_messages_endpoint_dns, "")
    }
  } : {}
}

# Flow logs outputs
output "flow_logs_s3_bucket" {
  description = "Name of the S3 bucket for VPC Flow Logs"
  value       = var.enable_flow_logs ? module.flow_logs[0].s3_bucket_id : null
}

output "flow_log_ids" {
  description = "IDs of VPC Flow Logs"
  value       = var.enable_flow_logs ? module.flow_logs[0].flow_log_ids : {}
}

# Environment suffix output
output "environment_suffix" {
  description = "The environment suffix used for resource naming"
  value       = local.name_suffix
}

# Selected availability zones output
output "availability_zones" {
  description = "List of availability zones used"
  value       = local.selected_azs
}
```

### File: lib/modules/vpc/main.tf

```hcl
# Create VPC
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-vpc-${var.purpose}-${var.name_suffix}"
  })
}

# Create Internet Gateway (optional)
resource "aws_internet_gateway" "this" {
  count = var.create_igw ? 1 : 0

  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-igw-${var.purpose}-${var.name_suffix}"
  })
}

# Create public subnets
resource "aws_subnet" "public" {
  count = var.create_public_subnets ? length(var.availability_zones) : 0

  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 1)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-public-az${count.index + 1}-${var.name_suffix}"
    Type = "public"
  })
}

# Create private subnets
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 11)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-private-az${count.index + 1}-${var.name_suffix}"
    Type = "private"
  })
}

# Create Transit Gateway attachment subnets
resource "aws_subnet" "tgw_attachment" {
  count = var.create_tgw_attachment_subnets ? length(var.availability_zones) : 0

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 21)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-tgw-attachment-az${count.index + 1}-${var.name_suffix}"
    Type = "tgw-attachment"
  })
}

# Create public route table
resource "aws_route_table" "public" {
  count = var.create_public_subnets ? 1 : 0

  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-rt-public-${var.name_suffix}"
    Type = "public"
  })
}

# Create private route tables (one per AZ for NAT Gateway redundancy)
resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-rt-private-az${count.index + 1}-${var.name_suffix}"
    Type = "private"
  })
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = var.create_public_subnets ? length(var.availability_zones) : 0

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# Associate private subnets with private route tables
resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Associate TGW attachment subnets with private route tables
resource "aws_route_table_association" "tgw_attachment" {
  count = var.create_tgw_attachment_subnets ? length(var.availability_zones) : 0

  subnet_id      = aws_subnet.tgw_attachment[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Create default route to IGW for public route table
resource "aws_route" "public_igw" {
  count = var.create_igw && var.create_public_subnets ? 1 : 0

  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this[0].id
}
```

### File: lib/modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.this.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "tgw_attachment_subnet_ids" {
  description = "IDs of Transit Gateway attachment subnets"
  value       = aws_subnet.tgw_attachment[*].id
}

output "public_route_table_id" {
  description = "ID of public route table"
  value       = var.create_public_subnets ? aws_route_table.public[0].id : null
}

output "private_route_table_ids" {
  description = "IDs of private route tables"
  value       = aws_route_table.private[*].id
}

output "igw_id" {
  description = "ID of Internet Gateway"
  value       = var.create_igw ? aws_internet_gateway.this[0].id : null
}
```

### File: lib/modules/vpc/variables.tf

```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "purpose" {
  description = "Purpose of the VPC"
  type        = string
}

variable "name_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "create_igw" {
  description = "Whether to create Internet Gateway"
  type        = bool
  default     = false
}

variable "create_public_subnets" {
  description = "Whether to create public subnets"
  type        = bool
  default     = true
}

variable "create_tgw_attachment_subnets" {
  description = "Whether to create Transit Gateway attachment subnets"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

### File: lib/modules/spoke-vpc/main.tf

```hcl
# Create VPC
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-vpc-${var.purpose}-${var.name_suffix}"
  })
}

# Create public subnets (smaller for ALBs/bastion hosts)
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 10, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-public-az${count.index + 1}-${var.name_suffix}"
    Type = "public"
  })
}

# Create private subnets (larger for workloads)
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 6, count.index + 1)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-private-az${count.index + 1}-${var.name_suffix}"
    Type = "private"
  })
}

# Create Transit Gateway attachment subnets
resource "aws_subnet" "tgw_attachment" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 10, count.index + 240)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-subnet-tgw-attachment-az${count.index + 1}-${var.name_suffix}"
    Type = "tgw-attachment"
  })
}

# Create public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-rt-public-${var.name_suffix}"
    Type = "public"
  })
}

# Create private route table (single table for spokes)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.region}-rt-private-${var.name_suffix}"
    Type = "private"
  })
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with private route table
resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Associate TGW attachment subnets with private route table
resource "aws_route_table_association" "tgw_attachment" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.tgw_attachment[count.index].id
  route_table_id = aws_route_table.private.id
}
```

### File: lib/modules/spoke-vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.this.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "tgw_attachment_subnet_ids" {
  description = "IDs of Transit Gateway attachment subnets"
  value       = aws_subnet.tgw_attachment[*].id
}

output "public_route_table_id" {
  description = "ID of public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "ID of private route table"
  value       = aws_route_table.private.id
}
```

### File: lib/modules/spoke-vpc/variables.tf

```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "purpose" {
  description = "Purpose of the VPC"
  type        = string
}

variable "name_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

### File: lib/modules/transit-gateway/main.tf

```hcl
# Create Transit Gateway
resource "aws_ec2_transit_gateway" "this" {
  description                     = "Transit Gateway for hub-and-spoke architecture"
  amazon_side_asn                 = var.amazon_side_asn
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support                = "enable"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-tgw-hubspoke-${var.name_suffix}"
  })
}

# Create hub route table
resource "aws_ec2_transit_gateway_route_table" "hub" {
  transit_gateway_id = aws_ec2_transit_gateway.this.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-tgw-rt-hub-${var.name_suffix}"
    Type = "hub"
  })
}

# Create spoke route table
resource "aws_ec2_transit_gateway_route_table" "spoke" {
  transit_gateway_id = aws_ec2_transit_gateway.this.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-tgw-rt-spoke-${var.name_suffix}"
    Type = "spoke"
  })
}

# Create VPC attachments
resource "aws_ec2_transit_gateway_vpc_attachment" "attachments" {
  for_each = var.vpc_attachments

  subnet_ids                                      = each.value.subnet_ids
  transit_gateway_id                              = aws_ec2_transit_gateway.this.id
  vpc_id                                          = each.value.vpc_id
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false
  dns_support                                     = "enable"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-tgw-attach-${each.key}-${var.name_suffix}"
  })
}

# Associate hub attachment with hub route table
resource "aws_ec2_transit_gateway_route_table_association" "hub" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.attachments["hub"].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

# Associate spoke attachments with spoke route table
resource "aws_ec2_transit_gateway_route_table_association" "spoke" {
  for_each = { for k, v in var.vpc_attachments : k => v if k != "hub" }

  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.attachments[each.key].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spoke.id
}

# Create routes in hub route table (to reach spokes)
resource "aws_ec2_transit_gateway_route" "hub_to_spoke" {
  for_each = { for k, v in var.vpc_attachments : k => v if k != "hub" }

  destination_cidr_block         = each.value.cidr_block
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.attachments[each.key].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

# Create routes in spoke route table
# Default route to hub for internet access
resource "aws_ec2_transit_gateway_route" "spoke_default" {
  destination_cidr_block         = "0.0.0.0/0"
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.attachments["hub"].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spoke.id
}

# Route to hub VPC
resource "aws_ec2_transit_gateway_route" "spoke_to_hub" {
  destination_cidr_block         = var.vpc_attachments["hub"].cidr_block
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.attachments["hub"].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spoke.id
}

# Blackhole routes for spoke isolation (CRITICAL for security)
resource "aws_ec2_transit_gateway_route" "spoke_isolation" {
  for_each = { for k, v in var.vpc_attachments : k => v if k != "hub" }

  destination_cidr_block         = each.value.cidr_block
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spoke.id
}
```

### File: lib/modules/transit-gateway/outputs.tf

```hcl
output "transit_gateway_id" {
  description = "ID of the Transit Gateway"
  value       = aws_ec2_transit_gateway.this.id
}

output "transit_gateway_arn" {
  description = "ARN of the Transit Gateway"
  value       = aws_ec2_transit_gateway.this.arn
}

output "hub_route_table_id" {
  description = "ID of the hub route table"
  value       = aws_ec2_transit_gateway_route_table.hub.id
}

output "spoke_route_table_id" {
  description = "ID of the spoke route table"
  value       = aws_ec2_transit_gateway_route_table.spoke.id
}

output "vpc_attachment_ids" {
  description = "Map of VPC attachment IDs"
  value       = { for k, v in aws_ec2_transit_gateway_vpc_attachment.attachments : k => v.id }
}
```

### File: lib/modules/transit-gateway/variables.tf

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "name_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "amazon_side_asn" {
  description = "Amazon side ASN for Transit Gateway"
  type        = number
  default     = 64512
}

variable "vpc_attachments" {
  description = "Map of VPC attachments"
  type = map(object({
    vpc_id     = string
    subnet_ids = list(string)
    cidr_block = string
  }))
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

### File: lib/modules/vpc-endpoints/main.tf

```hcl
# Create security group for VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.name_prefix}-sg-vpc-endpoints-"
  description = "Security group for VPC endpoints"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-sg-vpc-endpoints-${var.name_suffix}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Create SSM endpoint
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpce-ssm-${var.name_suffix}"
  })
}

# Create SSM Messages endpoint
resource "aws_vpc_endpoint" "ssm_messages" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpce-ssm-messages-${var.name_suffix}"
  })
}

# Create EC2 Messages endpoint
resource "aws_vpc_endpoint" "ec2_messages" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpce-ec2-messages-${var.name_suffix}"
  })
}
```

### File: lib/modules/vpc-endpoints/outputs.tf

```hcl
output "security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.id
}

output "ssm_endpoint_id" {
  description = "ID of SSM endpoint"
  value       = aws_vpc_endpoint.ssm.id
}

output "ssm_endpoint_dns" {
  description = "DNS name of SSM endpoint"
  value       = try(aws_vpc_endpoint.ssm.dns_entry[0].dns_name, "")
}

output "ssm_messages_endpoint_id" {
  description = "ID of SSM Messages endpoint"
  value       = aws_vpc_endpoint.ssm_messages.id
}

output "ssm_messages_endpoint_dns" {
  description = "DNS name of SSM Messages endpoint"
  value       = try(aws_vpc_endpoint.ssm_messages.dns_entry[0].dns_name, "")
}

output "ec2_messages_endpoint_id" {
  description = "ID of EC2 Messages endpoint"
  value       = aws_vpc_endpoint.ec2_messages.id
}

output "ec2_messages_endpoint_dns" {
  description = "DNS name of EC2 Messages endpoint"
  value       = try(aws_vpc_endpoint.ec2_messages.dns_entry[0].dns_name, "")
}
```

### File: lib/modules/vpc-endpoints/variables.tf

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "name_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for endpoints"
  type        = list(string)
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

### File: lib/modules/flow-logs/main.tf

```hcl
# Create S3 bucket for flow logs
resource "aws_s3_bucket" "flow_logs" {
  bucket = var.bucket_name

  tags = merge(var.tags, {
    Name = var.bucket_name
  })
}

# Enable versioning
resource "aws_s3_bucket_versioning" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy
resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    id     = "transition-and-expire"
    status = "Enabled"

    filter {}

    transition {
      days          = var.transition_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.expiration_days
    }
  }
}

# IAM policy document for flow logs
data "aws_iam_policy_document" "flow_logs" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.flow_logs.arn]
  }

  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.flow_logs.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

# Apply bucket policy
resource "aws_s3_bucket_policy" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id
  policy = data.aws_iam_policy_document.flow_logs.json
}

# Create flow logs
resource "aws_flow_log" "this" {
  for_each = var.vpc_configs

  log_destination_type = "s3"
  log_destination      = "${aws_s3_bucket.flow_logs.arn}/${each.key}/"
  traffic_type         = "ALL"
  vpc_id               = each.value.vpc_id

  max_aggregation_interval = 600

  tags = merge(var.tags, {
    Name = "${each.value.name_prefix}-flow-log-${var.name_suffix}"
    VPC  = each.key
  })

  depends_on = [aws_s3_bucket_policy.flow_logs]
}
```

### File: lib/modules/flow-logs/outputs.tf

```hcl
output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.flow_logs.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.flow_logs.arn
}

output "flow_log_ids" {
  description = "Map of Flow Log IDs"
  value       = { for k, v in aws_flow_log.this : k => v.id }
}
```

### File: lib/modules/flow-logs/variables.tf

```hcl
variable "bucket_name" {
  description = "Name of S3 bucket for flow logs"
  type        = string
}

variable "name_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "vpc_configs" {
  description = "Map of VPC configurations"
  type = map(object({
    vpc_id      = string
    name_prefix = string
  }))
}

variable "transition_days" {
  description = "Days before transitioning to Glacier"
  type        = number
  default     = 30
}

variable "expiration_days" {
  description = "Days before expiring logs"
  type        = number
  default     = 365
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

## Implementation Details

### Module Structure

The implementation uses a modular approach with five reusable modules:

1. **vpc module**: General-purpose VPC creation for the hub VPC
   - Creates VPC with configurable CIDR
   - Creates public, private, and TGW attachment subnets across multiple AZs
   - Optionally creates Internet Gateway
   - Creates route tables with proper associations

2. **spoke-vpc module**: Specialized module for spoke VPCs
   - No Internet Gateway or NAT Gateways
   - Small public subnets for ALBs/bastions
   - Large private subnets for workloads
   - Small TGW attachment subnets
   - Single route table for simplicity

3. **transit-gateway module**: Transit Gateway and routing management
   - Creates Transit Gateway with DNS support
   - Creates separate hub and spoke route tables
   - Manages VPC attachments
   - Implements blackhole routes for spoke isolation
   - Routes default traffic to hub

4. **vpc-endpoints module**: Systems Manager VPC endpoints
   - Creates security group allowing HTTPS from VPC CIDR
   - Creates SSM, SSM Messages, and EC2 Messages endpoints
   - Enables private DNS
   - Reusable across all VPCs

5. **flow-logs module**: VPC Flow Logs to S3
   - Creates S3 bucket with encryption and versioning
   - Implements lifecycle policy (30-day Glacier transition, 365-day expiration)
   - Blocks public access
   - Creates flow logs for multiple VPCs with organized prefixes

### Unique Resource Naming

All resources implement the environment_suffix pattern for multi-environment deployments:

```hcl
# Random suffix fallback
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Use provided suffix or random
locals {
  name_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.suffix.result
}

# Applied to resource names
Name = "hub-us-east-1-vpc-network-${local.name_suffix}"
```

This allows:
- GitHub Actions to pass `ENVIRONMENT_SUFFIX` for PR environments (pr4798)
- CLI deployments with custom suffixes (synth123)
- Automatic random suffix for production deployments

### Transit Gateway Routing

**Hub Route Table:**
- Associated with hub VPC attachment
- Routes to each spoke CIDR (10.1.0.0/16, 10.2.0.0/16)
- Allows hub to reach all spokes

**Spoke Route Table:**
- Associated with production and development VPC attachments
- Default route (0.0.0.0/0) to hub attachment (for internet access)
- Route to hub CIDR (10.0.0.0/16) to reach hub services
- Blackhole routes for other spoke CIDRs (10.1.0.0/16, 10.2.0.0/16)
- **Critical**: Blackhole routes prevent direct spoke-to-spoke communication

### VPC Route Tables

**Hub VPC:**
- Public route table: Default route to Internet Gateway
- Private route tables (per AZ): 
  - Default route to NAT Gateway in same AZ
  - Routes to spoke CIDRs via Transit Gateway

**Spoke VPCs:**
- Public route table: Default route to Transit Gateway
- Private route table: Default route to Transit Gateway
- All traffic flows through hub VPC

### Cost Optimization

1. **Shared NAT Gateways**: Single set of NAT Gateways in hub VPC saves ~$270/month compared to per-VPC NAT Gateways
2. **VPC Flow Logs to S3**: Cheaper than CloudWatch Logs, with lifecycle management
3. **Conditional Resources**: All major components can be disabled via variables for testing

### Scalability

Adding a new spoke VPC is straightforward:

1. Add variable for new CIDR
2. Create new spoke VPC module instance
3. Add to Transit Gateway vpc_attachments
4. Add VPC endpoints module instance
5. Add to Flow Logs vpc_configs
6. Add DHCP options

Example:
```hcl
# In variables.tf
variable "staging_vpc_cidr" {
  default = "10.3.0.0/16"
}

# In vpc-spokes.tf
module "vpc_staging" {
  source = "./modules/spoke-vpc"
  vpc_cidr = var.staging_vpc_cidr
  # ... other parameters
}

# In transit-gateway.tf
staging = {
  vpc_id = module.vpc_staging.vpc_id
  subnet_ids = module.vpc_staging.tgw_attachment_subnet_ids
  cidr_block = var.staging_vpc_cidr
}
```

## Testing

### Unit Tests

Unit tests validate:
- Variable definitions and validation rules
- Data source configurations
- Module structure and parameters
- Resource naming conventions
- Tag application
- Output definitions

### Integration Tests

Integration tests verify:
- VPC creation across all environments
- Transit Gateway connectivity
- Spoke isolation (blackhole routes)
- NAT Gateway internet access
- Route53 Resolver endpoints
- VPC endpoints availability
- Flow logs configuration
- End-to-end network connectivity

## Deployment

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0 installed
3. S3 backend configured (optional)

### Steps

```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment
terraform plan -out=tfplan

# Apply configuration
terraform apply tfplan
```

### Variable Configuration

Create `terraform.tfvars`:
```hcl
region = "us-east-1"
hub_vpc_cidr = "10.0.0.0/16"
production_vpc_cidr = "10.1.0.0/16"
development_vpc_cidr = "10.2.0.0/16"
availability_zone_count = 3
cost_center = "infrastructure"
project = "digital-banking"
```

### Environment-Specific Deployments

```bash
# For PR environments
export ENVIRONMENT_SUFFIX=pr4798
terraform apply -var="environment_suffix=${ENVIRONMENT_SUFFIX}"

# For synthetic testing
export ENVIRONMENT_SUFFIX=synth123
terraform apply -var="environment_suffix=${ENVIRONMENT_SUFFIX}"

# For production (uses random suffix)
terraform apply
```

## Outputs

The configuration provides comprehensive outputs:

- **VPC IDs and CIDRs**: All VPC identifiers and CIDR blocks
- **Subnet IDs**: Public, private, and TGW attachment subnets for all VPCs
- **Transit Gateway**: TGW ID, ARN, and route table IDs
- **NAT Gateways**: NAT Gateway IDs and public IPs
- **Route53 Resolver**: Resolver endpoint IDs and IP addresses
- **VPC Endpoints**: Systems Manager endpoint DNS names
- **Flow Logs**: S3 bucket name and flow log IDs
- **Environment Suffix**: Suffix used for resource naming
- **Availability Zones**: List of AZs used in deployment

## Security Considerations

1. **Network Isolation**: Complete spoke isolation via Transit Gateway blackhole routes
2. **Private Subnets**: All workloads run in private subnets without direct internet access
3. **Centralized Egress**: All internet traffic flows through hub for potential inspection
4. **Encryption**: S3 bucket encryption enabled for flow logs
5. **VPC Flow Logs**: Comprehensive network traffic logging for audit
6. **No Bastion Hosts**: Systems Manager provides secure access
7. **Security Groups**: Restrictive security groups for VPC endpoints and Route53 Resolver

## Monitoring and Compliance

1. **VPC Flow Logs**: All network traffic logged to S3
2. **Lifecycle Management**: Automated transition to Glacier after 30 days
3. **Retention Policy**: 365-day retention for compliance
4. **Organized Logging**: Separate S3 prefixes per VPC
5. **Tagging Strategy**: Comprehensive tags for cost allocation and management

## Future Enhancements

1. **AWS Network Firewall**: Add in hub VPC for traffic inspection
2. **Direct Connect**: Connect on-premises network to Transit Gateway
3. **Multi-Region**: Replicate architecture in additional regions
4. **VPN Gateway**: Add Client VPN endpoint in hub VPC
5. **Centralized Egress VPC**: Dedicated VPC with inspection appliances
6. **Transit Gateway Peering**: Connect to other Transit Gateways
7. **AWS WAF**: Protect public-facing applications

## Architecture Diagram

```
                              ┌─────────────────┐
                              │    Internet     │
                              └────────┬────────┘
                                       │
                              ┌────────┴────────┐
                              │   IGW (Hub VPC) │
                              └────────┬────────┘
                                       │
                              ┌────────┴────────┐
                              │  NAT Gateways   │
                              │   (3 x AZs)     │
                              └────────┬────────┘
                                       │
┌─────────────────────────────────────┼──────────────────────────────────────┐
│                           Hub VPC   │  (10.0.0.0/16)                       │
│  ┌──────────┐  ┌──────────┐  ┌─────┴───────┐  ┌────────────────────────┐ │
│  │  Public  │  │ Private  │  │  TGW Attach │  │  Route53 Resolver      │ │
│  │ Subnets  │  │ Subnets  │  │   Subnets   │  │  (Inbound/Outbound)    │ │
│  └──────────┘  └──────────┘  └─────┬───────┘  └────────────────────────┘ │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                              ┌────────┴────────┐
                              │ Transit Gateway │
                              │                 │
                              │  Hub Route TBL  │
                              │ Spoke Route TBL │
                              └───┬─────────┬───┘
                                  │         │
                    ┌─────────────┴───┐ ┌──┴──────────────┐
                    │ Production VPC  │ │ Development VPC │
                    │  (10.1.0.0/16)  │ │  (10.2.0.0/16)  │
                    │                 │ │                 │
                    │  ✗ BLACKHOLE ✗  │ │  ✗ BLACKHOLE ✗  │
                    │   ROUTE BLOCKS  │ │   ROUTE BLOCKS  │
                    │     DIRECT      │ │     DIRECT      │
                    │  COMMUNICATION  │ │  COMMUNICATION  │
                    └─────────────────┘ └─────────────────┘
```

## Naming Conventions

All resources follow the pattern: `{environment}-{region}-{service}-{purpose}-{suffix}`

Examples:
- Hub VPC: `hub-us-east-1-vpc-network-abc123ef`
- Production VPC: `production-us-east-1-vpc-workloads-abc123ef`
- Transit Gateway: `shared-us-east-1-tgw-hubspoke-abc123ef`
- NAT Gateway: `hub-us-east-1-nat-az1-abc123ef`
- Flow Logs Bucket: `shared-us-east-1-s3-flowlogs-abc123ef`

## Tagging Strategy

All resources are tagged with:
- **Environment**: hub/production/development/shared
- **Project**: digital-banking
- **CostCenter**: infrastructure (configurable)
- **ManagedBy**: Terraform
- **Purpose**: networking/connectivity/dns/logging/management/workloads

## Cost Estimate

| Component | Monthly Cost (us-east-1) |
|-----------|--------------------------|
| Transit Gateway (base) | $36.00 |
| TGW Attachments (3) | $15.00 |
| NAT Gateways (3) | $135.00 |
| Route53 Resolver Endpoints (2) | $180.00 |
| VPC Endpoints - SSM (9 total) | $64.80 |
| VPC Flow Logs Storage | Variable |
| **Total Base** | **~$430.80/month** |

*Note: Data transfer charges not included. Actual costs vary by usage.*

## Troubleshooting

### Spoke Cannot Reach Internet
- Verify default route (0.0.0.0/0) in spoke route table points to Transit Gateway
- Check Transit Gateway spoke route table has default route to hub attachment
- Verify NAT Gateway status in hub VPC
- Check security group rules

### DNS Resolution Fails
- Verify Route53 Resolver endpoints are active
- Check resolver security group allows port 53 UDP/TCP from 10.0.0.0/8
- Ensure VPC DNS settings are enabled

### Spoke Can Reach Another Spoke (Should Not)
- Verify blackhole routes exist in Transit Gateway spoke route table
- Check Transit Gateway route table associations
- Ensure spoke VPCs are associated with spoke route table, not hub

### Systems Manager Connection Fails
- Verify all three VPC endpoints (SSM, SSM Messages, EC2 Messages) are created
- Check endpoint security groups allow HTTPS (443) from VPC CIDR
- Verify IAM instance profile has SSM permissions
- Check SSM agent is installed and running on instance

## Conclusion

This implementation provides a production-ready, scalable, and secure hub-and-spoke network architecture for financial services digital banking workloads. The modular design enables easy expansion while maintaining strict security boundaries and centralized management.

Key benefits:
- Complete spoke isolation for security
- Cost savings through shared NAT Gateways
- Centralized DNS and network management
- Scalable design for future growth
- Comprehensive monitoring and logging
- No bastion hosts required
- Multi-AZ high availability

