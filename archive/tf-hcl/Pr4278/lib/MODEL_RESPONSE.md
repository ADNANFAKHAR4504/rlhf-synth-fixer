### Reasoning Trace

---

This is a comprehensive request for a multi-account VPC peering infrastructure with Terraform. Let me break down what needs to be created:

1. **versions.tf** - Terraform and provider versions
2. **providers.tf** - Primary and aliased providers for multi-account
3. **variables.tf** - All configuration variables
4. **iam-roles/main.tf** - Cross-account IAM roles module
5. **vpcs.tf** - 10 VPCs with subnets, IGW, NAT, route tables
6. **peering.tf** - VPC peering connections
7. **routes.tf** - Route table updates for peering
8. **security-groups.tf** - Security groups with dynamic rules
9. **flow-logs.tf** - VPC Flow Logs and Kinesis Firehose
10. **cloudtrail.tf** - CloudTrail with S3 and KMS
11. **monitoring.tf** - CloudWatch monitoring and alerts
12. **eventbridge.tf** - EventBridge rules and cross-account setup
13. **lambda-compliance.tf** - Lambda function for compliance
14. **lambda/compliance_check.py** - Python compliance code
15. **outputs.tf** - All outputs
16. **README.md** - Documentation

Key requirements:

- 10 VPCs with CIDR blocks 10.0.0.0/16 to 10.9.0.0/16
- Public subnets: x.0.1.0/24 and x.0.2.0/24
- Private subnets: x.0.10.0/24 and x.0.11.0/24
- Multi-account with cross-account roles
- Three topology options: full-mesh, hub-spoke, custom
- Security groups with specific rules
- VPC Flow Logs to CloudWatch and S3
- CloudTrail auditing
- CloudWatch monitoring and alarms

I'll implement real-time monitoring and compliance mechanisms across multiple accounts. The solution will leverage EventBridge for instant alerting, create a Lambda function to perform continuous compliance checks, and establish a robust tagging strategy to ensure consistent resource management and tracking.

The EventBridge configuration will capture critical infrastructure events, enabling immediate notification and response. The Lambda compliance checker will automatically validate network configurations, security settings, and adherence to predefined policies. A comprehensive tagging approach will support resource identification, cost allocation, and governance across the complex multi-account environment.

### Answer

---

```hcl
# versions.tf
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}
```

```hcl
# providers.tf
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "VPCPeering"
    }
  }
}

# Create aliased providers for each peer account
provider "aws" {
  for_each = toset(var.peer_account_ids)
  alias    = "peer_${each.value}"
  region   = var.aws_region

  assume_role {
    role_arn = "arn:aws:iam::${each.value}:role/${var.cross_account_role_name}"
  }

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "VPCPeering"
    }
  }
}
```

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "primary_account_id" {
  description = "Primary AWS account ID"
  type        = string
}

variable "peer_account_ids" {
  description = "List of peer AWS account IDs"
  type        = list(string)
  default     = []
}

variable "cross_account_role_name" {
  description = "IAM role name for cross-account access"
  type        = string
  default     = "TerraformPeeringRole"
}

variable "vpc_account_mapping" {
  description = "Map of VPC index to AWS account ID"
  type        = map(string)
  default     = {}
}

variable "peering_topology" {
  description = "Peering topology: full-mesh, hub-spoke, or custom"
  type        = string
  default     = "full-mesh"

  validation {
    condition     = contains(["full-mesh", "hub-spoke", "custom"], var.peering_topology)
    error_message = "Peering topology must be one of: full-mesh, hub-spoke, custom"
  }
}

variable "custom_peering_connections" {
  description = "Custom peering connections when topology is 'custom'"
  type = list(object({
    requester_vpc_index = number
    accepter_vpc_index  = number
  }))
  default = []
}

variable "database_access_mapping" {
  description = "Map of VPC indices that should have database access to other VPCs"
  type        = map(list(number))
  default = {
    0 = [1, 2, 3]
    4 = [5, 6]
    7 = [8, 9]
  }
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  type        = string
  default     = null
}

variable "flow_logs_retention_days" {
  description = "CloudWatch Logs retention period for VPC Flow Logs"
  type        = number
  default     = 30
}

variable "enable_s3_log_streaming" {
  description = "Enable streaming VPC Flow Logs to S3"
  type        = bool
  default     = true
}

variable "enable_compliance_lambda" {
  description = "Enable compliance checking Lambda function"
  type        = bool
  default     = true
}

variable "compliance_check_schedule" {
  description = "Schedule expression for compliance checks"
  type        = string
  default     = "rate(1 hour)"
}

variable "cloudtrail_retention_days" {
  description = "S3 lifecycle retention for CloudTrail logs"
  type        = number
  default     = 365
}

variable "cloudtrail_glacier_transition_days" {
  description = "Days before transitioning CloudTrail logs to Glacier"
  type        = number
  default     = 90
}

variable "enable_organization_trail" {
  description = "Enable organization-wide CloudTrail (requires Organizations)"
  type        = bool
  default     = false
}

variable "owner_tag" {
  description = "Owner tag for resources"
  type        = string
  default     = "Infrastructure Team"
}

variable "vpc_cidr_base" {
  description = "Base CIDR for VPCs (first two octets)"
  type        = string
  default     = "10"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = null
}
```

```hcl
# iam-roles/main.tf
variable "primary_account_id" {
  description = "Primary AWS account ID that will assume roles"
  type        = string
}

variable "role_name" {
  description = "Name of the cross-account role"
  type        = string
  default     = "TerraformPeeringRole"
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "cross_account_peering" {
  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.primary_account_id}:root"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Purpose = "Cross-account VPC peering"
  }
}

resource "aws_iam_role_policy" "vpc_peering_permissions" {
  name = "VPCPeeringPermissions"
  role = aws_iam_role.cross_account_peering.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:AcceptVpcPeeringConnection",
          "ec2:DescribeVpcPeeringConnections",
          "ec2:CreateRoute",
          "ec2:DeleteRoute",
          "ec2:DescribeRouteTables",
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeFlowLogs",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "events:PutEvents",
          "events:PutTargets",
          "events:PutRule",
          "events:DeleteRule",
          "events:RemoveTargets"
        ]
        Resource = "*"
      }
    ]
  })
}

output "role_arn" {
  value = aws_iam_role.cross_account_peering.arn
}

output "role_name" {
  value = aws_iam_role.cross_account_peering.name
}
```

```hcl
# vpcs.tf
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = var.availability_zones != null ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, 2)

  vpc_configs = {
    for i in range(10) : i => {
      cidr_block = "${var.vpc_cidr_base}.${i}.0.0/16"
      account_id = lookup(var.vpc_account_mapping, tostring(i), var.primary_account_id)
      public_subnets = [
        "${var.vpc_cidr_base}.${i}.1.0/24",
        "${var.vpc_cidr_base}.${i}.2.0/24"
      ]
      private_subnets = [
        "${var.vpc_cidr_base}.${i}.10.0/24",
        "${var.vpc_cidr_base}.${i}.11.0/24"
      ]
    }
  }

  # Determine which provider to use for each VPC
  vpc_providers = {
    for i, config in local.vpc_configs : i => (
      config.account_id == var.primary_account_id ?
      "aws" :
      "aws.peer_${config.account_id}"
    )
  }
}

resource "aws_vpc" "main" {
  for_each = local.vpc_configs

  provider = local.vpc_providers[each.key]

  cidr_block           = each.value.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name     = "${var.environment}-vpc-${each.key}"
    VPCIndex = each.key
    Owner    = var.owner_tag
  }
}

resource "aws_internet_gateway" "main" {
  for_each = aws_vpc.main

  provider = local.vpc_providers[each.key]
  vpc_id   = each.value.id

  tags = {
    Name     = "${var.environment}-igw-${each.key}"
    VPCIndex = each.key
    Owner    = var.owner_tag
  }
}

resource "aws_subnet" "public" {
  for_each = {
    for item in flatten([
      for vpc_idx, vpc_config in local.vpc_configs : [
        for subnet_idx, subnet_cidr in vpc_config.public_subnets : {
          key        = "${vpc_idx}-public-${subnet_idx}"
          vpc_idx    = vpc_idx
          subnet_idx = subnet_idx
          cidr_block = subnet_cidr
        }
      ]
    ]) : item.key => item
  }

  provider                = local.vpc_providers[each.value.vpc_idx]
  vpc_id                  = aws_vpc.main[each.value.vpc_idx].id
  cidr_block              = each.value.cidr_block
  availability_zone       = local.azs[each.value.subnet_idx]
  map_public_ip_on_launch = true

  tags = {
    Name     = "${var.environment}-public-subnet-${each.key}"
    Type     = "Public"
    VPCIndex = each.value.vpc_idx
    Owner    = var.owner_tag
  }
}

resource "aws_subnet" "private" {
  for_each = {
    for item in flatten([
      for vpc_idx, vpc_config in local.vpc_configs : [
        for subnet_idx, subnet_cidr in vpc_config.private_subnets : {
          key        = "${vpc_idx}-private-${subnet_idx}"
          vpc_idx    = vpc_idx
          subnet_idx = subnet_idx
          cidr_block = subnet_cidr
        }
      ]
    ]) : item.key => item
  }

  provider          = local.vpc_providers[each.value.vpc_idx]
  vpc_id            = aws_vpc.main[each.value.vpc_idx].id
  cidr_block        = each.value.cidr_block
  availability_zone = local.azs[each.value.subnet_idx]

  tags = {
    Name     = "${var.environment}-private-subnet-${each.key}"
    Type     = "Private"
    VPCIndex = each.value.vpc_idx
    Owner    = var.owner_tag
  }
}

resource "aws_eip" "nat" {
  for_each = {
    for item in flatten([
      for vpc_idx in range(10) : [
        for az_idx in range(length(local.azs)) : {
          key     = "${vpc_idx}-${az_idx}"
          vpc_idx = vpc_idx
          az_idx  = az_idx
        }
      ]
    ]) : item.key => item
  }

  provider = local.vpc_providers[each.value.vpc_idx]
  domain   = "vpc"

  tags = {
    Name     = "${var.environment}-nat-eip-${each.key}"
    VPCIndex = each.value.vpc_idx
    Owner    = var.owner_tag
  }
}

resource "aws_nat_gateway" "main" {
  for_each = {
    for item in flatten([
      for vpc_idx in range(10) : [
        for az_idx in range(length(local.azs)) : {
          key        = "${vpc_idx}-${az_idx}"
          vpc_idx    = vpc_idx
          az_idx     = az_idx
          subnet_key = "${vpc_idx}-public-${az_idx}"
        }
      ]
    ]) : item.key => item
  }

  provider      = local.vpc_providers[each.value.vpc_idx]
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.value.subnet_key].id

  tags = {
    Name     = "${var.environment}-nat-${each.key}"
    VPCIndex = each.value.vpc_idx
    Owner    = var.owner_tag
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  for_each = aws_vpc.main

  provider = local.vpc_providers[each.key]
  vpc_id   = each.value.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[each.key].id
  }

  tags = {
    Name     = "${var.environment}-public-rt-${each.key}"
    Type     = "Public"
    VPCIndex = each.key
    Owner    = var.owner_tag
  }
}

resource "aws_route_table" "private" {
  for_each = {
    for item in flatten([
      for vpc_idx in range(10) : [
        for az_idx in range(length(local.azs)) : {
          key     = "${vpc_idx}-${az_idx}"
          vpc_idx = vpc_idx
          az_idx  = az_idx
        }
      ]
    ]) : item.key => item
  }

  provider = local.vpc_providers[each.value.vpc_idx]
  vpc_id   = aws_vpc.main[each.value.vpc_idx].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[each.key].id
  }

  tags = {
    Name     = "${var.environment}-private-rt-${each.key}"
    Type     = "Private"
    VPCIndex = each.value.vpc_idx
    Owner    = var.owner_tag
  }
}

resource "aws_route_table_association" "public" {
  for_each = {
    for key, subnet in aws_subnet.public : key => {
      vpc_idx    = split("-", key)[0]
      subnet_idx = split("-", key)[2]
      subnet_id  = subnet.id
    }
  }

  provider       = local.vpc_providers[each.value.vpc_idx]
  subnet_id      = each.value.subnet_id
  route_table_id = aws_route_table.public[each.value.vpc_idx].id
}

resource "aws_route_table_association" "private" {
  for_each = {
    for key, subnet in aws_subnet.private : key => {
      vpc_idx    = split("-", key)[0]
      subnet_idx = split("-", key)[2]
      subnet_id  = subnet.id
      rt_key     = "${split("-", key)[0]}-${split("-", key)[2]}"
    }
  }

  provider       = local.vpc_providers[each.value.vpc_idx]
  subnet_id      = each.value.subnet_id
  route_table_id = aws_route_table.private[each.value.rt_key].id
}
```

```hcl
# peering.tf
locals {
  # Generate peering connections based on topology
  peering_connections = var.peering_topology == "full-mesh" ? [
    for i in range(10) : [
      for j in range(i + 1, 10) : {
        requester_vpc_index = i
        accepter_vpc_index  = j
        connection_key      = "${i}-${j}"
      }
    ]
  ] : var.peering_topology == "hub-spoke" ? [
    for i in range(1, 10) : [{
      requester_vpc_index = 0
      accepter_vpc_index  = i
      connection_key      = "0-${i}"
    }]
  ] : [
    for conn in var.custom_peering_connections : {
      requester_vpc_index = conn.requester_vpc_index
      accepter_vpc_index  = conn.accepter_vpc_index
      connection_key      = "${conn.requester_vpc_index}-${conn.accepter_vpc_index}"
    }
  ]

  # Flatten the nested list
  peering_connections_flat = flatten(local.peering_connections)

  # Create a map with connection details
  peering_map = {
    for conn in local.peering_connections_flat : conn.connection_key => {
      requester_vpc_id      = aws_vpc.main[conn.requester_vpc_index].id
      accepter_vpc_id       = aws_vpc.main[conn.accepter_vpc_index].id
      requester_account_id  = local.vpc_configs[conn.requester_vpc_index].account_id
      accepter_account_id   = local.vpc_configs[conn.accepter_vpc_index].account_id
      requester_vpc_index   = conn.requester_vpc_index
      accepter_vpc_index    = conn.accepter_vpc_index
      requester_provider    = local.vpc_providers[conn.requester_vpc_index]
      accepter_provider     = local.vpc_providers[conn.accepter_vpc_index]
      same_account         = local.vpc_configs[conn.requester_vpc_index].account_id == local.vpc_configs[conn.accepter_vpc_index].account_id
    }
  }
}

# Use data sources to get VPC information for cross-account peering
data "aws_vpc" "requester" {
  for_each = local.peering_map

  provider = each.value.requester_provider
  id       = each.value.requester_vpc_id
}

data "aws_vpc" "accepter" {
  for_each = local.peering_map

  provider = each.value.accepter_provider
  id       = each.value.accepter_vpc_id
}

resource "aws_vpc_peering_connection" "main" {
  for_each = local.peering_map

  provider      = each.value.requester_provider
  vpc_id        = data.aws_vpc.requester[each.key].id
  peer_vpc_id   = data.aws_vpc.accepter[each.key].id
  peer_owner_id = each.value.accepter_account_id
  peer_region   = var.aws_region
  auto_accept   = each.value.same_account

  tags = {
    Name                = "${var.environment}-peering-${each.key}"
    RequesterVPCIndex   = each.value.requester_vpc_index
    AccepterVPCIndex    = each.value.accepter_vpc_index
    Owner               = var.owner_tag
  }
}

resource "aws_vpc_peering_connection_accepter" "main" {
  for_each = {
    for k, v in local.peering_map : k => v
    if !v.same_account
  }

  provider                  = each.value.accepter_provider
  vpc_peering_connection_id = aws_vpc_peering_connection.main[each.key].id
  auto_accept              = true

  tags = {
    Name              = "${var.environment}-peering-accepter-${each.key}"
    RequesterVPCIndex = each.value.requester_vpc_index
    AccepterVPCIndex  = each.value.accepter_vpc_index
    Owner             = var.owner_tag
  }
}
```

```hcl
# routes.tf
locals {
  # Generate route entries for each peering connection
  peering_routes = flatten([
    for conn_key, conn in local.peering_map : [
      # Routes from requester to accepter
      {
        route_key       = "${conn_key}-requester-to-accepter"
        vpc_index       = conn.requester_vpc_index
        destination_cidr = local.vpc_configs[conn.accepter_vpc_index].cidr_block
        pcx_id          = aws_vpc_peering_connection.main[conn_key].id
        provider        = conn.requester_provider
      },
      # Routes from accepter to requester
      {
        route_key       = "${conn_key}-accepter-to-requester"
        vpc_index       = conn.accepter_vpc_index
        destination_cidr = local.vpc_configs[conn.requester_vpc_index].cidr_block
        pcx_id          = aws_vpc_peering_connection.main[conn_key].id
        provider        = conn.accepter_provider
      }
    ]
  ])
}

# Routes for public route tables
resource "aws_route" "public_peering" {
  for_each = {
    for route in local.peering_routes :
    "${route.route_key}-public" => route
  }

  provider                  = each.value.provider
  route_table_id            = aws_route_table.public[each.value.vpc_index].id
  destination_cidr_block    = each.value.destination_cidr
  vpc_peering_connection_id = each.value.pcx_id

  depends_on = [
    aws_vpc_peering_connection_accepter.main
  ]
}

# Routes for private route tables
resource "aws_route" "private_peering" {
  for_each = {
    for item in flatten([
      for route in local.peering_routes : [
        for az_idx in range(length(local.azs)) : {
          route_key        = "${route.route_key}-private-${az_idx}"
          vpc_index        = route.vpc_index
          az_idx          = az_idx
          destination_cidr = route.destination_cidr
          pcx_id          = route.pcx_id
          provider        = route.provider
          rt_key          = "${route.vpc_index}-${az_idx}"
        }
      ]
    ]) : item.route_key => item
  }

  provider                  = each.value.provider
  route_table_id            = aws_route_table.private[each.value.rt_key].id
  destination_cidr_block    = each.value.destination_cidr
  vpc_peering_connection_id = each.value.pcx_id

  depends_on = [
    aws_vpc_peering_connection_accepter.main
  ]
}
```

```hcl
# security-groups.tf
locals {
  # Build a map of which VPCs are peered with each VPC
  vpc_peered_cidrs = {
    for vpc_idx in range(10) : vpc_idx => distinct(flatten([
      for conn_key, conn in local.peering_map : [
        conn.requester_vpc_index == vpc_idx ? local.vpc_configs[conn.accepter_vpc_index].cidr_block : [],
        conn.accepter_vpc_index == vpc_idx ? local.vpc_configs[conn.requester_vpc_index].cidr_block : []
      ]
    ]))
  }

  # Build database access rules
  database_access_rules = flatten([
    for target_vpc, source_vpcs in var.database_access_mapping : [
      for source_vpc in source_vpcs : {
        target_vpc = target_vpc
        source_vpc = source_vpc
        source_cidr = local.vpc_configs[source_vpc].cidr_block
      }
    ]
  ])
}

resource "aws_security_group" "vpc_peering" {
  for_each = aws_vpc.main

  provider    = local.vpc_providers[each.key]
  name        = "${var.environment}-vpc-${each.key}-peering-sg"
  description = "Security group for VPC peering traffic"
  vpc_id      = each.value.id

  tags = {
    Name     = "${var.environment}-vpc-${each.key}-peering-sg"
    VPCIndex = each.key
    Owner    = var.owner_tag
  }
}

# HTTPS ingress from peered VPCs
resource "aws_security_group_rule" "https_ingress" {
  for_each = {
    for item in flatten([
      for vpc_idx, cidrs in local.vpc_peered_cidrs : [
        for cidr_idx, cidr in cidrs : {
          key      = "${vpc_idx}-https-${cidr_idx}"
          vpc_idx  = vpc_idx
          cidr     = cidr
        }
      ]
    ]) : item.key => item
  }

  provider              = local.vpc_providers[each.value.vpc_idx]
  type                  = "ingress"
  from_port             = 443
  to_port               = 443
  protocol              = "tcp"
  cidr_blocks           = [each.value.cidr]
  security_group_id     = aws_security_group.vpc_peering[each.value.vpc_idx].id
  description           = "HTTPS from peered VPC"
}

# Database ingress based on mapping
resource "aws_security_group_rule" "database_ingress" {
  for_each = {
    for rule in local.database_access_rules :
    "${rule.target_vpc}-db-${rule.source_vpc}" => rule
  }

  provider              = local.vpc_providers[each.value.target_vpc]
  type                  = "ingress"
  from_port             = 3306
  to_port               = 3306
  protocol              = "tcp"
  cidr_blocks           = [each.value.source_cidr]
  security_group_id     = aws_security_group.vpc_peering[each.value.target_vpc].id
  description           = "MySQL/MariaDB from VPC ${each.value.source_vpc}"
}

# Egress to peered VPCs
resource "aws_security_group_rule" "egress_https" {
  for_each = {
    for item in flatten([
      for vpc_idx, cidrs in local.vpc_peered_cidrs : [
        for cidr_idx, cidr in cidrs : {
          key      = "${vpc_idx}-egress-https-${cidr_idx}"
          vpc_idx  = vpc_idx
          cidr     = cidr
        }
      ]
    ]) : item.key => item
  }

  provider              = local.vpc_providers[each.value.vpc_idx]
  type                  = "egress"
  from_port             = 443
  to_port               = 443
  protocol              = "tcp"
  cidr_blocks           = [each.value.cidr]
  security_group_id     = aws_security_group.vpc_peering[each.value.vpc_idx].id
  description           = "HTTPS to peered VPC"
}

resource "aws_security_group_rule" "egress_database" {
  for_each = {
    for item in flatten([
      for vpc_idx, cidrs in local.vpc_peered_cidrs : [
        for cidr_idx, cidr in cidrs : {
          key      = "${vpc_idx}-egress-db-${cidr_idx}"
          vpc_idx  = vpc_idx
          cidr     = cidr
        }
      ]
    ]) : item.key => item
  }

  provider              = local.vpc_providers[each.value.vpc_idx]
  type                  = "egress"
  from_port             = 3306
  to_port               = 3306
  protocol              = "tcp"
  cidr_blocks           = [each.value.cidr]
  security_group_id     = aws_security_group.vpc_peering[each.value.vpc_idx].id
  description           = "MySQL/MariaDB to peered VPC"
}
```

```hcl
# flow-logs.tf
# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  for_each = toset([for k, v in local.vpc_configs : v.account_id])

  provider = each.key == var.primary_account_id ? aws : aws.peer_${each.key}
  name     = "${var.environment}-vpc-flow-logs-role"

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

  tags = {
    Name  = "${var.environment}-vpc-flow-logs-role"
    Owner = var.owner_tag
  }
}

resource "aws_iam_role_policy" "flow_logs" {
  for_each = aws_iam_role.flow_logs

  provider = each.key == var.primary_account_id ? aws : aws.peer_${each.key}
  name     = "flow-logs-policy"
  role     = each.value.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "flow_logs" {
  for_each = aws_vpc.main

  provider          = local.vpc_providers[each.key]
  name              = "/aws/vpc/flowlogs/${each.value.id}"
  retention_in_days = var.flow_logs_retention_days

  tags = {
    Name     = "${var.environment}-vpc-${each.key}-flow-logs"
    VPCIndex = each.key
    Owner    = var.owner_tag
  }
}

# VPC Flow Logs
resource "aws_flow_log" "vpc" {
  for_each = aws_vpc.main

  provider             = local.vpc_providers[each.key]
  iam_role_arn         = aws_iam_role.flow_logs[local.vpc_configs[each.key].account_id].arn
  log_destination      = aws_cloudwatch_log_group.flow_logs[each.key].arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id              = each.value.id

  tags = {
    Name     = "${var.environment}-vpc-${each.key}-flow-log"
    VPCIndex = each.key
    Owner    = var.owner_tag
  }
}

# S3 bucket for log archival (in primary account)
resource "aws_s3_bucket" "flow_logs_archive" {
  count = var.enable_s3_log_streaming ? 1 : 0

  bucket = "${var.environment}-vpc-flow-logs-archive-${var.primary_account_id}"

  tags = {
    Name    = "${var.environment}-vpc-flow-logs-archive"
    Purpose = "VPC Flow Logs Archive"
    Owner   = var.owner_tag
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs_archive" {
  count = var.enable_s3_log_streaming ? 1 : 0

  bucket = aws_s3_bucket.flow_logs_archive[0].id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_public_access_block" "flow_logs_archive" {
  count = var.enable_s3_log_streaming ? 1 : 0

  bucket = aws_s3_bucket.flow_logs_archive[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# KMS key for S3 bucket encryption
resource "aws_kms_key" "flow_logs" {
  count = var.enable_s3_log_streaming ? 1 : 0

  description             = "KMS key for VPC Flow Logs encryption"
  deletion_window_in_days = 30

  tags = {
    Name  = "${var.environment}-flow-logs-kms"
    Owner = var.owner_tag
  }
}

resource "aws_kms_alias" "flow_logs" {
  count = var.enable_s3_log_streaming ? 1 : 0

  name          = "alias/${var.environment}-flow-logs"
  target_key_id = aws_kms_key.flow_logs[0].key_id
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs_archive" {
  count = var.enable_s3_log_streaming ? 1 : 0

  bucket = aws_s3_bucket.flow_logs_archive[0].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.flow_logs[0].arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Kinesis Firehose for streaming logs to S3
resource "aws_iam_role" "firehose" {
  count = var.enable_s3_log_streaming ? 1 : 0

  name = "${var.environment}-firehose-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "firehose.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "firehose" {
  count = var.enable_s3_log_streaming ? 1 : 0

  name = "firehose-flow-logs-policy"
  role = aws_iam_role.firehose[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.flow_logs_archive[0].arn,
          "${aws_s3_bucket.flow_logs_archive[0].arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.flow_logs[0].arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kinesis_firehose_delivery_stream" "flow_logs" {
  for_each = var.enable_s3_log_streaming ? aws_vpc.main : {}

  provider    = local.vpc_providers[each.key]
  name        = "${var.environment}-flow-logs-stream-vpc-${each.key}"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose[0].arn
    bucket_arn = aws_s3_bucket.flow_logs_archive[0].arn
    prefix     = "vpc-${each.key}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"

    buffer_size     = 5
    buffer_interval = 300

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.flow_logs[each.key].name
      log_stream_name = "S3Delivery"
    }
  }

  tags = {
    Name     = "${var.environment}-flow-logs-stream-vpc-${each.key}"
    VPCIndex = each.key
    Owner    = var.owner_tag
  }
}

# CloudWatch Logs subscription filter
resource "aws_iam_role" "cwl_to_firehose" {
  count = var.enable_s3_log_streaming ? 1 : 0

  name = "${var.environment}-cwl-to-firehose-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "logs.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "cwl_to_firehose" {
  count = var.enable_s3_log_streaming ? 1 : 0

  name = "cwl-to-firehose-policy"
  role = aws_iam_role.cwl_to_firehose[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "firehose:PutRecord",
        "firehose:PutRecordBatch"
      ]
      Resource = "arn:aws:firehose:*:*:deliverystream/${var.environment}-flow-logs-stream-*"
    }]
  })
}

resource "aws_cloudwatch_log_subscription_filter" "flow_logs_to_s3" {
  for_each = var.enable_s3_log_streaming ? aws_cloudwatch_log_group.flow_logs : {}

  provider        = local.vpc_providers[each.key]
  name            = "${var.environment}-flow-logs-to-s3-vpc-${each.key}"
  log_group_name  = each.value.name
  filter_pattern  = ""
  destination_arn = aws_kinesis_firehose_delivery_stream.flow_logs[each.key].arn
  role_arn       = aws_iam_role.cwl_to_firehose[0].arn
}
```

```hcl
# cloudtrail.tf
# S3 bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.environment}-cloudtrail-logs-${var.primary_account_id}"

  tags = {
    Name    = "${var.environment}-cloudtrail-logs"
    Purpose = "CloudTrail Audit Logs"
    Owner   = var.owner_tag
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = var.cloudtrail_glacier_transition_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.cloudtrail_retention_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# KMS key for CloudTrail encryption
resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.primary_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${var.primary_account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to describe key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow principals to decrypt log files"
        Effect = "Allow"
        Principal = {
          AWS = concat(
            ["arn:aws:iam::${var.primary_account_id}:root"],
            [for account_id in var.peer_account_ids : "arn:aws:iam::${account_id}:root"]
          )
        }
        Action = [
          "kms:Decrypt",
          "kms:ReEncryptFrom"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:CallerAccount" = concat([var.primary_account_id], var.peer_account_ids)
          }
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:*:trail/*"
          }
        }
      }
    ]
  })

  tags = {
    Name  = "${var.environment}-cloudtrail-kms"
    Owner = var.owner_tag
  }
}

resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/${var.environment}-cloudtrail"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket policy for CloudTrail
data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid = "AWSCloudTrailAclCheck"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail.arn]
  }

  statement {
    sid = "AWSCloudTrailWrite"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }

  statement {
    sid = "AllowPeerAccountsWrite"

    principals {
      type        = "AWS"
      identifiers = [for account_id in var.peer_account_ids : "arn:aws:iam::${account_id}:root"]
    }

    actions = [
      "s3:PutObject",
      "s3:GetObject"
    ]
    resources = ["${aws_s3_bucket.cloudtrail.arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name                          = "${var.environment}-vpc-peering-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail        = true
  is_organization_trail        = var.enable_organization_trail
  enable_log_file_validation   = true
  kms_key_id                   = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::EC2::VPC"
      values = ["arn:aws:ec2:*:*:vpc/*"]
    }
  }

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::EC2::VPCPeeringConnection"
      values = ["arn:aws:ec2:*:*:vpc-peering-connection/*"]
    }
  }

  tags = {
    Name  = "${var.environment}-vpc-peering-trail"
    Owner = var.owner_tag
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# Create CloudTrail in each peer account if not using organization trail
resource "aws_cloudtrail" "peer_accounts" {
  for_each = var.enable_organization_trail ? {} : toset(var.peer_account_ids)

  provider = aws.peer_${each.value}

  name                          = "${var.environment}-vpc-peering-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_log_file_validation   = true
  kms_key_id                   = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::EC2::VPC"
      values = ["arn:aws:ec2:*:*:vpc/*"]
    }
  }

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::EC2::VPCPeeringConnection"
      values = ["arn:aws:ec2:*:*:vpc-peering-connection/*"]
    }
  }

  tags = {
    Name  = "${var.environment}-vpc-peering-trail"
    Owner = var.owner_tag
  }
}
```

```hcl
# monitoring.tf
# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  count = var.sns_topic_arn == null ? 1 : 0

  name              = "${var.environment}-vpc-peering-alerts"
  kms_master_key_id = aws_kms_key.cloudtrail.id

  tags = {
    Name  = "${var.environment}-vpc-peering-alerts"
    Owner = var.owner_tag
  }
}

resource "aws_sns_topic_policy" "alerts" {
  count = var.sns_topic_arn == null ? 1 : 0

  arn = aws_sns_topic.alerts[0].arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchEvents"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts[0].arn
      },
      {
        Sid    = "AllowCloudWatch"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts[0].arn
      },
      {
        Sid    = "AllowPeerAccounts"
        Effect = "Allow"
        Principal = {
          AWS = [for account_id in var.peer_account_ids : "arn:aws:iam::${account_id}:root"]
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts[0].arn
      }
    ]
  })
}

locals {
  sns_topic_arn = var.sns_topic_arn != null ? var.sns_topic_arn : aws_sns_topic.alerts[0].arn
}

# CloudWatch Log Metric Filters
resource "aws_cloudwatch_log_metric_filter" "rejected_connections" {
  for_each = aws_cloudwatch_log_group.flow_logs

  provider       = local.vpc_providers[each.key]
  name           = "${var.environment}-rejected-connections-vpc-${each.key}"
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=REJECT, flowlogstatus]"
  log_group_name = each.value.name

  metric_transformation {
    name      = "RejectedConnectionsVPC${each.key}"
    namespace = "Corp/VPCPeering/Security"
    value     = "1"

    dimensions = {
      VPCId = aws_vpc.main[each.key].id
    }
  }
}

resource "aws_cloudwatch_log_metric_filter" "unauthorized_source_ips" {
  for_each = aws_cloudwatch_log_group.flow_logs

  provider       = local.vpc_providers[each.key]
  name           = "${var.environment}-unauthorized-ips-vpc-${each.key}"
  pattern        = "[version, account, eni, source!=${var.vpc_cidr_base}.*, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action, flowlogstatus]"
  log_group_name = each.value.name

  metric_transformation {
    name      = "UnauthorizedSourceIPsVPC${each.key}"
    namespace = "Corp/VPCPeering/Security"
    value     = "1"

    dimensions = {
      VPCId = aws_vpc.main[each.key].id
    }
  }
}

resource "aws_cloudwatch_log_metric_filter" "database_connections" {
  for_each = aws_cloudwatch_log_group.flow_logs

  provider       = local.vpc_providers[each.key]
  name           = "${var.environment}-database-connections-vpc-${each.key}"
  pattern        = "[version, account, eni, source, destination, srcport, destport=3306, protocol, packets, bytes, windowstart, windowend, action, flowlogstatus]"
  log_group_name = each.value.name

  metric_transformation {
    name      = "DatabaseConnectionsVPC${each.key}"
    namespace = "Corp/VPCPeering/Traffic"
    value     = "1"

    dimensions = {
      VPCId = aws_vpc.main[each.key].id
    }
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_rejected_connections" {
  for_each = aws_vpc.main

  provider            = local.vpc_providers[each.key]
  alarm_name          = "${var.environment}-high-rejected-connections-vpc-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RejectedConnectionsVPC${each.key}"
  namespace           = "Corp/VPCPeering/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "This metric monitors rejected connections"
  treat_missing_data  = "notBreaching"

  dimensions = {
    VPCId = each.value.id
  }

  alarm_actions = [local.sns_topic_arn]

  tags = {
    Name     = "${var.environment}-high-rejected-connections-vpc-${each.key}"
    VPCIndex = each.key
    Owner    = var.owner_tag
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_access_attempts" {
  for_each = aws_vpc.main

  provider            = local.vpc_providers[each.key]
  alarm_name          = "${var.environment}-unauthorized-access-vpc-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedSourceIPsVPC${each.key}"
  namespace           = "Corp/VPCPeering/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors unauthorized access attempts"
  treat_missing_data  = "notBreaching"

  dimensions = {
    VPCId = each.value.id
  }

  alarm_actions = [local.sns_topic_arn]

  tags = {
    Name     = "${var.environment}-unauthorized-access-vpc-${each.key}"
    VPCIndex = each.key
    Owner    = var.owner_tag
  }
}

resource "aws_cloudwatch_metric_alarm" "high_database_connections" {
  for_each = aws_vpc.main

  provider            = local.vpc_providers[each.key]
  alarm_name          = "${var.environment}-high-database-connections-vpc-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnectionsVPC${each.key}"
  namespace           = "Corp/VPCPeering/Traffic"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1000"
  alarm_description   = "This metric monitors database connections"
  treat_missing_data  = "notBreaching"

  dimensions = {
    VPCId = each.value.id
  }

  alarm_actions = [local.sns_topic_arn]

  tags = {
    Name     = "${var.environment}-high-database-connections-vpc-${each.key}"
    VPCIndex = each.key
    Owner    = var.owner_tag
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "vpc_peering" {
  dashboard_name = "${var.environment}-vpc-peering-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            for vpc_idx in range(10) : [
              "Corp/VPCPeering/Security",
              "RejectedConnectionsVPC${vpc_idx}",
              { stat = "Sum" }
            ]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Rejected Connections by VPC"
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            for vpc_idx in range(10) : [
              "Corp/VPCPeering/Security",
              "UnauthorizedSourceIPsVPC${vpc_idx}",
              { stat = "Sum" }
            ]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Unauthorized Access Attempts"
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            for vpc_idx in range(10) : [
              "Corp/VPCPeering/Traffic",
              "DatabaseConnectionsVPC${vpc_idx}",
              { stat = "Average" }
            ]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Database Connections"
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            for vpc_idx in range(10) : [
              "Corp/VPCPeering/Compliance",
              "ComplianceScore",
              { stat = "Average", dimensions = { VPCIndex = tostring(vpc_idx) } }
            ]
          ]
          period = 3600
          stat   = "Average"
          region = var.aws_region
          title  = "Compliance Scores by VPC"
        }
      }
    ]
  })
}
```

```hcl
# eventbridge.tf
# Event Bus for cross-account events
resource "aws_cloudwatch_event_bus" "cross_account" {
  name = "${var.environment}-vpc-peering-events"

  tags = {
    Name  = "${var.environment}-vpc-peering-events"
    Owner = var.owner_tag
  }
}

resource "aws_cloudwatch_event_permission" "cross_account" {
  for_each = toset(var.peer_account_ids)

  principal    = each.value
  statement_id = "AllowAccount${each.value}"
  event_bus_name = aws_cloudwatch_event_bus.cross_account.name
}

# EventBridge rules in primary account
resource "aws_cloudwatch_event_rule" "vpc_peering_changes" {
  name        = "${var.environment}-vpc-peering-changes"
  description = "Capture VPC peering connection changes"

  event_pattern = jsonencode
```
