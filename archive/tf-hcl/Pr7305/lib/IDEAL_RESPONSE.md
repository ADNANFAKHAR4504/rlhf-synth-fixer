## /lib/provider.tf

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

provider "aws" {
  alias  = "us_west_2"
  region = var.spoke_region_1
}

provider "aws" {
  alias  = "eu_west_1"
  region = var.spoke_region_2
}
```

## /lib/variables.tf

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "prod"
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

variable "spoke_region_1" {
  description = "First spoke region"
  type        = string
  default     = "us-west-2"
}

variable "spoke_region_2" {
  description = "Second spoke region"
  type        = string
  default     = "eu-west-1"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = []
}

variable "vpc_configs" {
  description = "Configuration for VPCs"
  type = map(object({
    cidr_block      = string
    public_subnets  = list(string)
    private_subnets = list(string)
    tgw_subnets     = list(string)
  }))
  default = {
    prod = {
      cidr_block      = "10.0.0.0/16"
      public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
      private_subnets = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
      tgw_subnets     = ["10.0.100.0/28", "10.0.100.16/28", "10.0.100.32/28"]
    }
    staging = {
      cidr_block      = "10.1.0.0/16"
      public_subnets  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
      private_subnets = ["10.1.10.0/24", "10.1.11.0/24", "10.1.12.0/24"]
      tgw_subnets     = ["10.1.100.0/28", "10.1.100.16/28", "10.1.100.32/28"]
    }
    dev = {
      cidr_block      = "10.2.0.0/16"
      public_subnets  = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
      private_subnets = ["10.2.10.0/24", "10.2.11.0/24", "10.2.12.0/24"]
      tgw_subnets     = ["10.2.100.0/28", "10.2.100.16/28", "10.2.100.32/28"]
    }
  }
}

variable "flow_logs_retention_days" {
  description = "CloudWatch Logs retention period for VPC Flow Logs"
  type        = number
  default     = 7
}

variable "blackhole_routes" {
  description = "RFC1918 ranges to blackhole"
  type        = list(string)
  default     = ["172.16.0.0/12", "192.168.0.0/16"]
}

variable "allowed_ports" {
  description = "Allowed ports for inter-VPC communication"
  type = list(object({
    port        = number
    protocol    = string
    description = string
  }))
  default = [
    { port = 443, protocol = "tcp", description = "HTTPS" },
    { port = 22, protocol = "tcp", description = "SSH" },
    { port = 3389, protocol = "tcp", description = "RDP" }
  ]
}
```

## /lib/tap_stack.tf

```hcl
locals {
  project_name = "TransitGatewayHub"
  environment  = var.environment_suffix
  region       = var.aws_region

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    ManagedBy   = "Terraform"
    Owner       = "SecurityTeam"
  }

  azs = length(var.availability_zones) > 0 ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, 3)
}

data "aws_availability_zones" "available" {
  state = "available"
}

# KMS Key for encryption
module "kms" {
  source = "./modules/kms"

  project_name = local.project_name
  environment  = local.environment
  tags         = local.common_tags
}

# Create VPCs
module "vpc_prod" {
  source = "./modules/vpc"

  vpc_name        = "${local.project_name}-prod-vpc"
  vpc_cidr        = var.vpc_configs["prod"].cidr_block
  azs             = local.azs
  public_subnets  = var.vpc_configs["prod"].public_subnets
  private_subnets = var.vpc_configs["prod"].private_subnets
  tgw_subnets     = var.vpc_configs["prod"].tgw_subnets
  enable_nat      = true
  single_nat      = true
  tags            = merge(local.common_tags, { Type = "prod" })
}

module "vpc_staging" {
  source = "./modules/vpc"

  vpc_name        = "${local.project_name}-staging-vpc"
  vpc_cidr        = var.vpc_configs["staging"].cidr_block
  azs             = local.azs
  public_subnets  = var.vpc_configs["staging"].public_subnets
  private_subnets = var.vpc_configs["staging"].private_subnets
  tgw_subnets     = var.vpc_configs["staging"].tgw_subnets
  enable_nat      = true
  single_nat      = true
  tags            = merge(local.common_tags, { Type = "staging" })
}

module "vpc_dev" {
  source = "./modules/vpc"

  vpc_name        = "${local.project_name}-dev-vpc"
  vpc_cidr        = var.vpc_configs["dev"].cidr_block
  azs             = local.azs
  public_subnets  = var.vpc_configs["dev"].public_subnets
  private_subnets = var.vpc_configs["dev"].private_subnets
  tgw_subnets     = var.vpc_configs["dev"].tgw_subnets
  enable_nat      = true
  single_nat      = true
  tags            = merge(local.common_tags, { Type = "dev" })
}

# Hub Transit Gateway
module "tgw_hub" {
  source = "./modules/tgw"

  tgw_name                 = "${local.project_name}-hub-tgw"
  amazon_side_asn          = 64512
  enable_dns_support       = true
  enable_multicast_support = false
  tags                     = merge(local.common_tags, { Region = "hub" })
}

# Spoke Transit Gateways
module "tgw_us_west_2" {
  source = "./modules/tgw"
  providers = {
    aws = aws.us_west_2
  }

  tgw_name                 = "${local.project_name}-usw2-tgw"
  amazon_side_asn          = 64513
  enable_dns_support       = true
  enable_multicast_support = false
  tags                     = merge(local.common_tags, { Region = "us-west-2" })
}

module "tgw_eu_west_1" {
  source = "./modules/tgw"
  providers = {
    aws = aws.eu_west_1
  }

  tgw_name                 = "${local.project_name}-euw1-tgw"
  amazon_side_asn          = 64514
  enable_dns_support       = true
  enable_multicast_support = false
  tags                     = merge(local.common_tags, { Region = "eu-west-1" })
}

# TGW Route Tables
resource "aws_ec2_transit_gateway_route_table" "prod" {
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  tags               = merge(local.common_tags, { Name = "${local.project_name}-prod-rt", Type = "prod" })
}

resource "aws_ec2_transit_gateway_route_table" "staging" {
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  tags               = merge(local.common_tags, { Name = "${local.project_name}-staging-rt", Type = "staging" })
}

resource "aws_ec2_transit_gateway_route_table" "dev" {
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  tags               = merge(local.common_tags, { Name = "${local.project_name}-dev-rt", Type = "dev" })
}

# VPC Attachments
resource "aws_ec2_transit_gateway_vpc_attachment" "prod" {
  subnet_ids         = module.vpc_prod.tgw_subnet_ids
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  vpc_id             = module.vpc_prod.vpc_id

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(local.common_tags, { Name = "${local.project_name}-prod-attachment" })
}

resource "aws_ec2_transit_gateway_vpc_attachment" "staging" {
  subnet_ids         = module.vpc_staging.tgw_subnet_ids
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  vpc_id             = module.vpc_staging.vpc_id

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(local.common_tags, { Name = "${local.project_name}-staging-attachment" })
}

resource "aws_ec2_transit_gateway_vpc_attachment" "dev" {
  subnet_ids         = module.vpc_dev.tgw_subnet_ids
  transit_gateway_id = module.tgw_hub.transit_gateway_id
  vpc_id             = module.vpc_dev.vpc_id

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(local.common_tags, { Name = "${local.project_name}-dev-attachment" })
}

# Route Table Associations
resource "aws_ec2_transit_gateway_route_table_association" "prod" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.prod.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}

resource "aws_ec2_transit_gateway_route_table_association" "staging" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.staging.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.staging.id
}

resource "aws_ec2_transit_gateway_route_table_association" "dev" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.dev.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

# TGW Routes - Prod Route Table (can reach staging only)
module "routes_prod" {
  source = "./modules/routes"

  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id

  routes = [
    {
      destination_cidr_block = var.vpc_configs["staging"].cidr_block
      attachment_id          = aws_ec2_transit_gateway_vpc_attachment.staging.id
    }
  ]

  blackhole_routes = var.blackhole_routes
}

# TGW Routes - Staging Route Table (can reach prod and dev)
module "routes_staging" {
  source = "./modules/routes"

  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.staging.id

  routes = [
    {
      destination_cidr_block = var.vpc_configs["prod"].cidr_block
      attachment_id          = aws_ec2_transit_gateway_vpc_attachment.prod.id
    },
    {
      destination_cidr_block = var.vpc_configs["dev"].cidr_block
      attachment_id          = aws_ec2_transit_gateway_vpc_attachment.dev.id
    }
  ]

  blackhole_routes = var.blackhole_routes
}

# TGW Routes - Dev Route Table (can reach staging only)
module "routes_dev" {
  source = "./modules/routes"

  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id

  routes = [
    {
      destination_cidr_block = var.vpc_configs["staging"].cidr_block
      attachment_id          = aws_ec2_transit_gateway_vpc_attachment.staging.id
    }
  ]

  blackhole_routes = var.blackhole_routes
}

# VPC Private Route Tables - Route to TGW
resource "aws_route" "private_to_tgw_prod" {
  count = length(module.vpc_prod.private_route_table_ids)

  route_table_id         = module.vpc_prod.private_route_table_ids[count.index]
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = module.tgw_hub.transit_gateway_id
}

resource "aws_route" "private_to_tgw_staging" {
  count = length(module.vpc_staging.private_route_table_ids)

  route_table_id         = module.vpc_staging.private_route_table_ids[count.index]
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = module.tgw_hub.transit_gateway_id
}

resource "aws_route" "private_to_tgw_dev" {
  count = length(module.vpc_dev.private_route_table_ids)

  route_table_id         = module.vpc_dev.private_route_table_ids[count.index]
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = module.tgw_hub.transit_gateway_id
}

# TGW Peering Attachments
resource "aws_ec2_transit_gateway_peering_attachment" "hub_to_usw2" {
  peer_region             = var.spoke_region_1
  peer_transit_gateway_id = module.tgw_us_west_2.transit_gateway_id
  transit_gateway_id      = module.tgw_hub.transit_gateway_id

  tags = merge(local.common_tags, { Name = "${local.project_name}-hub-to-usw2" })
}

resource "aws_ec2_transit_gateway_peering_attachment" "hub_to_euw1" {
  peer_region             = var.spoke_region_2
  peer_transit_gateway_id = module.tgw_eu_west_1.transit_gateway_id
  transit_gateway_id      = module.tgw_hub.transit_gateway_id

  tags = merge(local.common_tags, { Name = "${local.project_name}-hub-to-euw1" })
}

# Accept peering attachments
resource "aws_ec2_transit_gateway_peering_attachment_accepter" "usw2" {
  provider = aws.us_west_2

  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.hub_to_usw2.id

  tags = merge(local.common_tags, { Name = "${local.project_name}-usw2-accepter" })
}

resource "aws_ec2_transit_gateway_peering_attachment_accepter" "euw1" {
  provider = aws.eu_west_1

  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.hub_to_euw1.id

  tags = merge(local.common_tags, { Name = "${local.project_name}-euw1-accepter" })
}

# Network ACLs
module "nacl_prod" {
  source = "./modules/nacl"

  vpc_id        = module.vpc_prod.vpc_id
  vpc_cidr      = var.vpc_configs["prod"].cidr_block
  allowed_cidrs = [var.vpc_configs["staging"].cidr_block]
  allowed_ports = var.allowed_ports
  subnet_ids    = concat(module.vpc_prod.private_subnet_ids, module.vpc_prod.tgw_subnet_ids)
  tags          = merge(local.common_tags, { Name = "${local.project_name}-prod-nacl" })
}

module "nacl_staging" {
  source = "./modules/nacl"

  vpc_id        = module.vpc_staging.vpc_id
  vpc_cidr      = var.vpc_configs["staging"].cidr_block
  allowed_cidrs = [var.vpc_configs["prod"].cidr_block, var.vpc_configs["dev"].cidr_block]
  allowed_ports = var.allowed_ports
  subnet_ids    = concat(module.vpc_staging.private_subnet_ids, module.vpc_staging.tgw_subnet_ids)
  tags          = merge(local.common_tags, { Name = "${local.project_name}-staging-nacl" })
}

module "nacl_dev" {
  source = "./modules/nacl"

  vpc_id        = module.vpc_dev.vpc_id
  vpc_cidr      = var.vpc_configs["dev"].cidr_block
  allowed_cidrs = [var.vpc_configs["staging"].cidr_block]
  allowed_ports = var.allowed_ports
  subnet_ids    = concat(module.vpc_dev.private_subnet_ids, module.vpc_dev.tgw_subnet_ids)
  tags          = merge(local.common_tags, { Name = "${local.project_name}-dev-nacl" })
}

# VPC Flow Logs
module "flow_logs_prod" {
  source = "./modules/flowlogs"

  vpc_id               = module.vpc_prod.vpc_id
  vpc_name             = "prod"
  kms_key_arn          = module.kms.kms_key_arn
  retention_days       = var.flow_logs_retention_days
  traffic_type         = "ALL"
  aggregation_interval = 60
  tags                 = merge(local.common_tags, { Name = "${local.project_name}-prod-flowlogs" })
}

module "flow_logs_staging" {
  source = "./modules/flowlogs"

  vpc_id               = module.vpc_staging.vpc_id
  vpc_name             = "staging"
  kms_key_arn          = module.kms.kms_key_arn
  retention_days       = var.flow_logs_retention_days
  traffic_type         = "ALL"
  aggregation_interval = 60
  tags                 = merge(local.common_tags, { Name = "${local.project_name}-staging-flowlogs" })
}

module "flow_logs_dev" {
  source = "./modules/flowlogs"

  vpc_id               = module.vpc_dev.vpc_id
  vpc_name             = "dev"
  kms_key_arn          = module.kms.kms_key_arn
  retention_days       = var.flow_logs_retention_days
  traffic_type         = "ALL"
  aggregation_interval = 60
  tags                 = merge(local.common_tags, { Name = "${local.project_name}-dev-flowlogs" })
}

# Outputs
output "transit_gateway_ids" {
  value = {
    hub       = module.tgw_hub.transit_gateway_id
    us_west_2 = module.tgw_us_west_2.transit_gateway_id
    eu_west_1 = module.tgw_eu_west_1.transit_gateway_id
  }
}

output "tgw_route_table_ids" {
  value = {
    prod    = aws_ec2_transit_gateway_route_table.prod.id
    staging = aws_ec2_transit_gateway_route_table.staging.id
    dev     = aws_ec2_transit_gateway_route_table.dev.id
  }
}

output "vpc_ids" {
  value = {
    prod    = module.vpc_prod.vpc_id
    staging = module.vpc_staging.vpc_id
    dev     = module.vpc_dev.vpc_id
  }
}

output "subnet_ids" {
  value = {
    prod = {
      public  = module.vpc_prod.public_subnet_ids
      private = module.vpc_prod.private_subnet_ids
      tgw     = module.vpc_prod.tgw_subnet_ids
    }
    staging = {
      public  = module.vpc_staging.public_subnet_ids
      private = module.vpc_staging.private_subnet_ids
      tgw     = module.vpc_staging.tgw_subnet_ids
    }
    dev = {
      public  = module.vpc_dev.public_subnet_ids
      private = module.vpc_dev.private_subnet_ids
      tgw     = module.vpc_dev.tgw_subnet_ids
    }
  }
}

output "tgw_attachment_ids" {
  value = {
    prod             = aws_ec2_transit_gateway_vpc_attachment.prod.id
    staging          = aws_ec2_transit_gateway_vpc_attachment.staging.id
    dev              = aws_ec2_transit_gateway_vpc_attachment.dev.id
    hub_to_us_west_2 = aws_ec2_transit_gateway_peering_attachment.hub_to_usw2.id
    hub_to_eu_west_1 = aws_ec2_transit_gateway_peering_attachment.hub_to_euw1.id
  }
}
```

## /modules/kms/main.tf

```hcl
resource "aws_kms_key" "main" {
  description             = "${var.project_name}-KMS-${var.environment}"
  deletion_window_in_days = var.deletion_window_in_days
  enable_key_rotation     = var.enable_key_rotation

  tags = merge(var.tags, {
    Name = "${var.project_name}-KMS-${var.environment}"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_kms_key_policy" "main" {
  key_id = aws_kms_key.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "kms-key-policy"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.id}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}
```

## /modules/kms/variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "deletion_window_in_days" {
  description = "KMS key deletion window"
  type        = number
  default     = 30
}

variable "enable_key_rotation" {
  description = "Enable automatic key rotation"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## /modules/kms/outputs.tf

```hcl
output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "kms_key_alias_name" {
  description = "KMS key alias name"
  value       = aws_kms_alias.main.name
}
```

## /modules/vpc/main.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(var.tags, {
    Name = var.vpc_name
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnets)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-public-${var.azs[count.index]}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnets)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.azs[count.index]

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-private-${var.azs[count.index]}"
    Type = "Private"
  })
}

# TGW Attachment Subnets
resource "aws_subnet" "tgw" {
  count = length(var.tgw_subnets)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.tgw_subnets[count.index]
  availability_zone = var.azs[count.index]

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-tgw-${var.azs[count.index]}"
    Type = "TGW-Attachment"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.enable_nat ? (var.single_nat ? 1 : length(var.azs)) : 0
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.enable_nat ? (var.single_nat ? 1 : length(var.azs)) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-public-rt"
    Type = "Public"
  })
}

resource "aws_route_table" "private" {
  count  = length(var.private_subnets)
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-private-rt-${count.index + 1}"
    Type = "Private"
  })
}

# Routes
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route" "private_nat" {
  count = var.enable_nat ? length(var.private_subnets) : 0

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = var.single_nat ? aws_nat_gateway.main[0].id : aws_nat_gateway.main[count.index].id
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnets)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnets)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "tgw" {
  count = length(var.tgw_subnets)

  subnet_id      = aws_subnet.tgw[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## /modules/vpc/variables.tf

```hcl
variable "vpc_name" {
  description = "Name of the VPC"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "azs" {
  description = "Availability zones"
  type        = list(string)
}

variable "public_subnets" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
}

variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
}

variable "tgw_subnets" {
  description = "List of TGW attachment subnet CIDR blocks"
  type        = list(string)
}

variable "enable_nat" {
  description = "Enable NAT Gateway"
  type        = bool
  default     = true
}

variable "single_nat" {
  description = "Use a single NAT Gateway for all private subnets"
  type        = bool
  default     = false
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in the VPC"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## /modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "tgw_subnet_ids" {
  description = "List of TGW attachment subnet IDs"
  value       = aws_subnet.tgw[*].id
}

output "private_route_table_ids" {
  description = "List of private route table IDs"
  value       = aws_route_table.private[*].id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}
```

## /modules/tgw/main.tf

```hcl
resource "aws_ec2_transit_gateway" "main" {
  description                     = var.description
  amazon_side_asn                 = var.amazon_side_asn
  default_route_table_association = var.default_route_table_association
  default_route_table_propagation = var.default_route_table_propagation
  dns_support                     = var.enable_dns_support ? "enable" : "disable"
  vpn_ecmp_support                = var.enable_vpn_ecmp_support ? "enable" : "disable"
  multicast_support               = var.enable_multicast_support ? "enable" : "disable"

  tags = merge(var.tags, {
    Name = var.tgw_name
  })
}
```

## /modules/tgw/variables.tf

```hcl
variable "tgw_name" {
  description = "Name of the Transit Gateway"
  type        = string
}

variable "description" {
  description = "Description of the Transit Gateway"
  type        = string
  default     = ""
}

variable "amazon_side_asn" {
  description = "Amazon side ASN"
  type        = number
  default     = 64512
}

variable "enable_dns_support" {
  description = "Enable DNS support"
  type        = bool
  default     = true
}

variable "enable_vpn_ecmp_support" {
  description = "Enable VPN ECMP support"
  type        = bool
  default     = true
}

variable "enable_multicast_support" {
  description = "Enable multicast support"
  type        = bool
  default     = false
}

variable "default_route_table_association" {
  description = "Enable default route table association"
  type        = string
  default     = "disable"
}

variable "default_route_table_propagation" {
  description = "Enable default route table propagation"
  type        = string
  default     = "disable"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## /modules/tgw/outputs.tf

```hcl
output "transit_gateway_id" {
  description = "Transit Gateway ID"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_arn" {
  description = "Transit Gateway ARN"
  value       = aws_ec2_transit_gateway.main.arn
}

output "transit_gateway_association_default_route_table_id" {
  description = "Transit Gateway association default route table ID"
  value       = aws_ec2_transit_gateway.main.association_default_route_table_id
}

output "transit_gateway_propagation_default_route_table_id" {
  description = "Transit Gateway propagation default route table ID"
  value       = aws_ec2_transit_gateway.main.propagation_default_route_table_id
}
```

## /modules/routes/main.tf

```hcl
# Regular routes
resource "aws_ec2_transit_gateway_route" "routes" {
  for_each = { for idx, route in var.routes : "${route.destination_cidr_block}-${idx}" => route }

  destination_cidr_block         = each.value.destination_cidr_block
  transit_gateway_route_table_id = var.transit_gateway_route_table_id
  transit_gateway_attachment_id  = each.value.attachment_id
}

# Blackhole routes
resource "aws_ec2_transit_gateway_route" "blackhole" {
  for_each = toset(var.blackhole_routes)

  destination_cidr_block         = each.value
  transit_gateway_route_table_id = var.transit_gateway_route_table_id
  blackhole                      = true
}
```

## /modules/routes/variables.tf

```hcl
variable "transit_gateway_route_table_id" {
  description = "Transit Gateway route table ID"
  type        = string
}

variable "routes" {
  description = "List of routes to create"
  type = list(object({
    destination_cidr_block = string
    attachment_id          = string
  }))
  default = []
}

variable "blackhole_routes" {
  description = "List of CIDR blocks to blackhole"
  type        = list(string)
  default     = []
}
```

## /modules/routes/outputs.tf

```hcl
output "route_ids" {
  description = "Map of route identifiers"
  value       = { for k, v in aws_ec2_transit_gateway_route.routes : k => v.id }
}

output "blackhole_route_ids" {
  description = "Map of blackhole route identifiers"
  value       = { for k, v in aws_ec2_transit_gateway_route.blackhole : k => v.id }
}
```

## /modules/nacl/main.tf

```hcl
resource "aws_network_acl" "main" {
  vpc_id = var.vpc_id

  tags = var.tags
}

# Dynamic ingress rules for allowed ports
resource "aws_network_acl_rule" "ingress_allowed" {
  for_each = { for idx, rule in local.ingress_rules : "${rule.cidr}-${rule.port}-${idx}" => rule }

  network_acl_id = aws_network_acl.main.id
  rule_number    = each.value.rule_number
  protocol       = each.value.protocol
  rule_action    = "allow"
  cidr_block     = each.value.cidr
  from_port      = each.value.port
  to_port        = each.value.port
}

# Dynamic egress rules for allowed ports
resource "aws_network_acl_rule" "egress_allowed" {
  for_each = { for idx, rule in local.egress_rules : "${rule.cidr}-${rule.port}-${idx}" => rule }

  network_acl_id = aws_network_acl.main.id
  rule_number    = each.value.rule_number
  egress         = true
  protocol       = each.value.protocol
  rule_action    = "allow"
  cidr_block     = each.value.cidr
  from_port      = each.value.port
  to_port        = each.value.port
}

# Ingress rule for return traffic (ephemeral ports)
resource "aws_network_acl_rule" "ingress_ephemeral" {
  for_each = { for idx, cidr in var.allowed_cidrs : idx => cidr }

  network_acl_id = aws_network_acl.main.id
  rule_number    = 900 + tonumber(each.key)
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = each.value
  from_port      = 1024
  to_port        = 65535
}

# Egress rule for return traffic (ephemeral ports)
resource "aws_network_acl_rule" "egress_ephemeral" {
  network_acl_id = aws_network_acl.main.id
  rule_number    = 900
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Allow all traffic within VPC
resource "aws_network_acl_rule" "ingress_vpc" {
  network_acl_id = aws_network_acl.main.id
  rule_number    = 100
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 0
  to_port        = 0
}

resource "aws_network_acl_rule" "egress_vpc" {
  network_acl_id = aws_network_acl.main.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 0
  to_port        = 0
}

# Allow outbound HTTPS for internet access
resource "aws_network_acl_rule" "egress_https_internet" {
  network_acl_id = aws_network_acl.main.id
  rule_number    = 150
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

# Associate NACL with subnets
resource "aws_network_acl_association" "main" {
  count = length(var.subnet_ids)

  network_acl_id = aws_network_acl.main.id
  subnet_id      = var.subnet_ids[count.index]
}

locals {
  # Generate ingress rules
  ingress_rules = flatten([
    for cidx, cidr in var.allowed_cidrs : [
      for pidx, port in var.allowed_ports : {
        rule_number = 300 + (cidx * 20) + pidx
        cidr        = cidr
        port        = port.port
        protocol    = port.protocol == "tcp" ? "6" : port.protocol == "udp" ? "17" : "-1"
      }
    ]
  ])

  # Generate egress rules  
  egress_rules = flatten([
    for cidx, cidr in var.allowed_cidrs : [
      for pidx, port in var.allowed_ports : {
        rule_number = 500 + (cidx * 20) + pidx
        cidr        = cidr
        port        = port.port
        protocol    = port.protocol == "tcp" ? "6" : port.protocol == "udp" ? "17" : "-1"
      }
    ]
  ])
}
```

## /modules/nacl/variables.tf

```hcl
variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "allowed_cidrs" {
  description = "List of allowed CIDR blocks for inter-VPC communication"
  type        = list(string)
}

variable "allowed_ports" {
  description = "List of allowed ports"
  type = list(object({
    port        = number
    protocol    = string
    description = string
  }))
}

variable "subnet_ids" {
  description = "List of subnet IDs to associate with the NACL"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## /modules/nacl/outputs.tf

```hcl
output "nacl_id" {
  description = "Network ACL ID"
  value       = aws_network_acl.main.id
}

output "nacl_association_ids" {
  description = "Network ACL association IDs"
  value       = { for k, v in aws_network_acl_association.main : k => v.id }
}
```

## /modules/flowlogs/main.tf

```hcl
# Create CloudWatch Log Group
resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flowlogs/${var.vpc_name}"
  retention_in_days = var.retention_days
  kms_key_id        = var.kms_key_arn

  tags = var.tags
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  name_prefix = "${var.vpc_name}-flow-logs-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = var.tags
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "flow_logs" {
  name_prefix = "${var.vpc_name}-flow-logs-"
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
        Resource = [
          aws_cloudwatch_log_group.flow_logs.arn,
          "${aws_cloudwatch_log_group.flow_logs.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = var.kms_key_arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "logs.${data.aws_region.current.id}.amazonaws.com"
          }
        }
      }
    ]
  })
}

data "aws_region" "current" {}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn             = aws_iam_role.flow_logs.arn
  log_destination          = aws_cloudwatch_log_group.flow_logs.arn
  log_destination_type     = "cloud-watch-logs"
  traffic_type             = var.traffic_type
  vpc_id                   = var.vpc_id
  max_aggregation_interval = var.aggregation_interval

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-flow-logs"
  })
}
```

## /modules/flowlogs/variables.tf

```hcl
variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_name" {
  description = "VPC name for naming resources"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 7
}

variable "traffic_type" {
  description = "Type of traffic to capture"
  type        = string
  default     = "ALL"

  validation {
    condition     = contains(["ALL", "ACCEPT", "REJECT"], var.traffic_type)
    error_message = "Traffic type must be ALL, ACCEPT, or REJECT."
  }
}

variable "aggregation_interval" {
  description = "Maximum interval of time during which a flow of packets is captured"
  type        = number
  default     = 60

  validation {
    condition     = contains([60, 600], var.aggregation_interval)
    error_message = "Aggregation interval must be 60 or 600 seconds."
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## /modules/flowlogs/outputs.tf

```hcl
output "flow_log_id" {
  description = "VPC Flow Log ID"
  value       = aws_flow_log.main.id
}

output "log_group_name" {
  description = "CloudWatch Log Group name"
  value       = aws_cloudwatch_log_group.flow_logs.name
}

output "log_group_arn" {
  description = "CloudWatch Log Group ARN"
  value       = aws_cloudwatch_log_group.flow_logs.arn
}

output "iam_role_arn" {
  description = "IAM role ARN for Flow Logs"
  value       = aws_iam_role.flow_logs.arn
}
```