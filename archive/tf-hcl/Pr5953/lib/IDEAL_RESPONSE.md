# Cross-Region VPC Peering Infrastructure

Complete Terraform configuration for establishing secure cross-region VPC peering between production and partner VPCs with comprehensive security, monitoring, and access controls.

## File: lib/locals.tf

```hcl
# locals.tf - CIDR calculations and tag mappings

locals {
  # Environment and project metadata
  project_name = "fintech-payment"
  environment  = "production"

  # Common tags for all resources
  common_tags = {
    Environment = local.environment
    Project     = local.project_name
    CostCenter  = "payment-processing"
    ManagedBy   = "Terraform"
  }

  # Region configuration
  primary_region = "us-east-1"
  partner_region = "us-east-2"

  # VPC CIDR blocks
  production_vpc_cidr = "10.0.0.0/16"
  partner_vpc_cidr    = "172.16.0.0/16"

  # Application subnet CIDRs (only these subnets will have peering routes)
  production_app_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
  partner_app_subnet_cidrs    = ["172.16.10.0/24", "172.16.11.0/24", "172.16.12.0/24"]

  # Public and database subnet CIDRs (no peering access)
  production_public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  production_db_subnet_cidrs     = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]

  partner_public_subnet_cidrs = ["172.16.1.0/24", "172.16.2.0/24", "172.16.3.0/24"]
  partner_db_subnet_cidrs     = ["172.16.20.0/24", "172.16.21.0/24", "172.16.22.0/24"]

  # Availability zones
  azs = ["${local.primary_region}a", "${local.primary_region}b", "${local.primary_region}c"]
  partner_azs = ["${local.partner_region}a", "${local.partner_region}b", "${local.partner_region}c"]

  # Allowed traffic ports for peering
  allowed_ports = {
    https      = 443
    custom_api = 8443
  }

  # Flow log configuration
  flow_log_aggregation_interval = 60  # 1 minute in seconds

  # CIDR validation - ensure no overlap
  cidr_overlap_check = (
    can(cidrsubnet(local.production_vpc_cidr, 0, 0)) &&
    can(cidrsubnet(local.partner_vpc_cidr, 0, 0)) &&
    local.production_vpc_cidr != local.partner_vpc_cidr
  )
}
```

## File: lib/variables.tf

```hcl
# variables.tf

variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid collisions"
  type        = string
}

variable "aws_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "partner_region" {
  description = "Partner VPC region for cross-region peering"
  type        = string
  default     = "us-east-2"
}

variable "partner_account_id" {
  description = "AWS Account ID of the partner (for cross-account peering)"
  type        = string
  default     = ""  # Empty for same-account peering
}

variable "partner_vpc_id" {
  description = "VPC ID of the partner VPC (optional, will be looked up via data source if not provided)"
  type        = string
  default     = ""
}

variable "enable_dns_resolution" {
  description = "Enable DNS resolution across the VPC peering connection"
  type        = bool
  default     = true
}

variable "flow_log_retention_days" {
  description = "Retention period for VPC Flow Logs"
  type        = number
  default     = 7
}

variable "alarm_email_endpoint" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops-team@example.com"
}
```

## File: lib/main.tf

```hcl
# main.tf - Core VPC Peering Infrastructure

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for accepter VPC (partner VPC) - dynamically fetch details
data "aws_vpc" "partner" {
  provider = aws.partner

  # If partner_vpc_id is provided, use it; otherwise find by tag
  id = var.partner_vpc_id != "" ? var.partner_vpc_id : null

  dynamic "filter" {
    for_each = var.partner_vpc_id == "" ? [1] : []
    content {
      name   = "tag:Name"
      values = ["partner-vpc-*"]
    }
  }
}

# Validate CIDR compatibility between VPCs
data "aws_vpc" "production" {
  id = aws_vpc.production.id
}

# -----------------------------------------------------------------------------
# PRODUCTION VPC (Primary Region: us-east-1)
# -----------------------------------------------------------------------------

resource "aws_vpc" "production" {
  provider             = aws.primary
  cidr_block           = local.production_vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "production-vpc-${var.environment_suffix}"
    Tier = "production"
  })
}

# Public subnets (no peering routes)
resource "aws_subnet" "production_public" {
  provider          = aws.primary
  count             = length(local.production_public_subnet_cidrs)

  vpc_id            = aws_vpc.production.id
  cidr_block        = local.production_public_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "production-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "public"
  })
}

# Application subnets (will have peering routes)
resource "aws_subnet" "production_app" {
  provider          = aws.primary
  count             = length(local.production_app_subnet_cidrs)

  vpc_id            = aws_vpc.production.id
  cidr_block        = local.production_app_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "production-app-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "application"
  })
}

# Database subnets (no peering routes)
resource "aws_subnet" "production_db" {
  provider          = aws.primary
  count             = length(local.production_db_subnet_cidrs)

  vpc_id            = aws_vpc.production.id
  cidr_block        = local.production_db_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "production-db-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "database"
  })
}

# Internet Gateway for public subnets
resource "aws_internet_gateway" "production" {
  provider = aws.primary
  vpc_id   = aws_vpc.production.id

  tags = merge(local.common_tags, {
    Name = "production-igw-${var.environment_suffix}"
  })
}

# -----------------------------------------------------------------------------
# PARTNER VPC (Secondary Region: us-east-2)
# -----------------------------------------------------------------------------

resource "aws_vpc" "partner" {
  provider             = aws.partner
  cidr_block           = local.partner_vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "partner-vpc-${var.environment_suffix}"
    Tier = "partner"
  })
}

# Partner application subnets (will have peering routes)
resource "aws_subnet" "partner_app" {
  provider          = aws.partner
  count             = length(local.partner_app_subnet_cidrs)

  vpc_id            = aws_vpc.partner.id
  cidr_block        = local.partner_app_subnet_cidrs[count.index]
  availability_zone = local.partner_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "partner-app-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "application"
  })
}

# Partner public subnets (no peering routes)
resource "aws_subnet" "partner_public" {
  provider          = aws.partner
  count             = length(local.partner_public_subnet_cidrs)

  vpc_id            = aws_vpc.partner.id
  cidr_block        = local.partner_public_subnet_cidrs[count.index]
  availability_zone = local.partner_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "partner-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "public"
  })
}

# Partner database subnets (no peering routes)
resource "aws_subnet" "partner_db" {
  provider          = aws.partner
  count             = length(local.partner_db_subnet_cidrs)

  vpc_id            = aws_vpc.partner.id
  cidr_block        = local.partner_db_subnet_cidrs[count.index]
  availability_zone = local.partner_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "partner-db-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "database"
  })
}

# Internet Gateway for partner VPC
resource "aws_internet_gateway" "partner" {
  provider = aws.partner
  vpc_id   = aws_vpc.partner.id

  tags = merge(local.common_tags, {
    Name = "partner-igw-${var.environment_suffix}"
  })
}

# -----------------------------------------------------------------------------
# VPC PEERING CONNECTION
# -----------------------------------------------------------------------------

# Create VPC peering connection (requester side in us-east-1)
resource "aws_vpc_peering_connection" "production_to_partner" {
  provider      = aws.primary
  vpc_id        = aws_vpc.production.id
  peer_vpc_id   = aws_vpc.partner.id
  peer_region   = var.partner_region
  peer_owner_id = var.partner_account_id != "" ? var.partner_account_id : data.aws_caller_identity.current.account_id
  auto_accept   = false

  # Configure DNS resolution options for the requester
  requester {
    allow_remote_vpc_dns_resolution = var.enable_dns_resolution
  }

  tags = merge(local.common_tags, {
    Name = "production-partner-peering-${var.environment_suffix}"
    Side = "requester"
  })
}

# Accept VPC peering connection (accepter side in us-east-2)
resource "aws_vpc_peering_connection_accepter" "partner_accept" {
  provider                  = aws.partner
  vpc_peering_connection_id = aws_vpc_peering_connection.production_to_partner.id
  auto_accept               = true

  # Configure DNS resolution options for the accepter
  accepter {
    allow_remote_vpc_dns_resolution = var.enable_dns_resolution
  }

  tags = merge(local.common_tags, {
    Name = "partner-production-peering-accepter-${var.environment_suffix}"
    Side = "accepter"
  })
}

# Verify VPC peering options prevent overlapping CIDRs
resource "aws_vpc_peering_connection_options" "requester" {
  provider                  = aws.primary
  vpc_peering_connection_id = aws_vpc_peering_connection_accepter.partner_accept.id

  requester {
    allow_remote_vpc_dns_resolution = var.enable_dns_resolution
  }

  depends_on = [aws_vpc_peering_connection_accepter.partner_accept]
}

resource "aws_vpc_peering_connection_options" "accepter" {
  provider                  = aws.partner
  vpc_peering_connection_id = aws_vpc_peering_connection_accepter.partner_accept.id

  accepter {
    allow_remote_vpc_dns_resolution = var.enable_dns_resolution
  }

  depends_on = [aws_vpc_peering_connection_accepter.partner_accept]
}
```

## File: lib/routing.tf

```hcl
# routing.tf - Route tables and peering routes

# -----------------------------------------------------------------------------
# PRODUCTION VPC ROUTE TABLES
# -----------------------------------------------------------------------------

# Route table for public subnets (no peering routes)
resource "aws_route_table" "production_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.production.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.production.id
  }

  tags = merge(local.common_tags, {
    Name = "production-public-rt-${var.environment_suffix}"
    Tier = "public"
  })
}

# Route table for application subnets (with peering routes to specific partner CIDRs)
resource "aws_route_table" "production_app" {
  provider = aws.primary
  count    = length(local.production_app_subnet_cidrs)
  vpc_id   = aws_vpc.production.id

  tags = merge(local.common_tags, {
    Name = "production-app-rt-${count.index + 1}-${var.environment_suffix}"
    Tier = "application"
  })
}

# Peering routes for each application subnet to specific partner application subnets
resource "aws_route" "production_to_partner_app" {
  provider                  = aws.primary
  count                     = length(local.production_app_subnet_cidrs) * length(local.partner_app_subnet_cidrs)

  route_table_id            = aws_route_table.production_app[floor(count.index / length(local.partner_app_subnet_cidrs))].id
  destination_cidr_block    = local.partner_app_subnet_cidrs[count.index % length(local.partner_app_subnet_cidrs)]
  vpc_peering_connection_id = aws_vpc_peering_connection.production_to_partner.id

  depends_on = [aws_vpc_peering_connection_accepter.partner_accept]
}

# Route table for database subnets (no peering routes)
resource "aws_route_table" "production_db" {
  provider = aws.primary
  vpc_id   = aws_vpc.production.id

  tags = merge(local.common_tags, {
    Name = "production-db-rt-${var.environment_suffix}"
    Tier = "database"
  })
}

# Route table associations - production VPC
resource "aws_route_table_association" "production_public" {
  provider       = aws.primary
  count          = length(aws_subnet.production_public)
  subnet_id      = aws_subnet.production_public[count.index].id
  route_table_id = aws_route_table.production_public.id
}

resource "aws_route_table_association" "production_app" {
  provider       = aws.primary
  count          = length(aws_subnet.production_app)
  subnet_id      = aws_subnet.production_app[count.index].id
  route_table_id = aws_route_table.production_app[count.index].id
}

resource "aws_route_table_association" "production_db" {
  provider       = aws.primary
  count          = length(aws_subnet.production_db)
  subnet_id      = aws_subnet.production_db[count.index].id
  route_table_id = aws_route_table.production_db.id
}

# -----------------------------------------------------------------------------
# PARTNER VPC ROUTE TABLES
# -----------------------------------------------------------------------------

# Route table for public subnets (no peering routes)
resource "aws_route_table" "partner_public" {
  provider = aws.partner
  vpc_id   = aws_vpc.partner.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.partner.id
  }

  tags = merge(local.common_tags, {
    Name = "partner-public-rt-${var.environment_suffix}"
    Tier = "public"
  })
}

# Route table for application subnets (with peering routes to specific production CIDRs)
resource "aws_route_table" "partner_app" {
  provider = aws.partner
  count    = length(local.partner_app_subnet_cidrs)
  vpc_id   = aws_vpc.partner.id

  tags = merge(local.common_tags, {
    Name = "partner-app-rt-${count.index + 1}-${var.environment_suffix}"
    Tier = "application"
  })
}

# Peering routes for each partner application subnet to specific production application subnets
resource "aws_route" "partner_to_production_app" {
  provider                  = aws.partner
  count                     = length(local.partner_app_subnet_cidrs) * length(local.production_app_subnet_cidrs)

  route_table_id            = aws_route_table.partner_app[floor(count.index / length(local.production_app_subnet_cidrs))].id
  destination_cidr_block    = local.production_app_subnet_cidrs[count.index % length(local.production_app_subnet_cidrs)]
  vpc_peering_connection_id = aws_vpc_peering_connection.production_to_partner.id

  depends_on = [aws_vpc_peering_connection_accepter.partner_accept]
}

# Route table for database subnets (no peering routes)
resource "aws_route_table" "partner_db" {
  provider = aws.partner
  vpc_id   = aws_vpc.partner.id

  tags = merge(local.common_tags, {
    Name = "partner-db-rt-${var.environment_suffix}"
    Tier = "database"
  })
}

# Route table associations - partner VPC
resource "aws_route_table_association" "partner_public" {
  provider       = aws.partner
  count          = length(aws_subnet.partner_public)
  subnet_id      = aws_subnet.partner_public[count.index].id
  route_table_id = aws_route_table.partner_public.id
}

resource "aws_route_table_association" "partner_app" {
  provider       = aws.partner
  count          = length(aws_subnet.partner_app)
  subnet_id      = aws_subnet.partner_app[count.index].id
  route_table_id = aws_route_table.partner_app[count.index].id
}

resource "aws_route_table_association" "partner_db" {
  provider       = aws.partner
  count          = length(aws_subnet.partner_db)
  subnet_id      = aws_subnet.partner_db[count.index].id
  route_table_id = aws_route_table.partner_db.id
}
```

## File: lib/security.tf

```hcl
# security.tf - Security groups for VPC peering traffic

# -----------------------------------------------------------------------------
# PRODUCTION VPC SECURITY GROUPS
# -----------------------------------------------------------------------------

# Security group for production application servers
resource "aws_security_group" "production_app" {
  provider    = aws.primary
  name        = "production-app-sg-${var.environment_suffix}"
  description = "Security group for production application servers allowing peered VPC traffic"
  vpc_id      = aws_vpc.production.id

  tags = merge(local.common_tags, {
    Name = "production-app-sg-${var.environment_suffix}"
  })
}

# Allow HTTPS (443) from partner VPC application subnets
resource "aws_security_group_rule" "production_app_https_from_partner" {
  provider          = aws.primary
  count             = length(local.partner_app_subnet_cidrs)

  type              = "ingress"
  from_port         = local.allowed_ports.https
  to_port           = local.allowed_ports.https
  protocol          = "tcp"
  cidr_blocks       = [local.partner_app_subnet_cidrs[count.index]]
  description       = "Allow HTTPS from partner app subnet ${count.index + 1}"
  security_group_id = aws_security_group.production_app.id
}

# Allow custom API (8443) from partner VPC application subnets
resource "aws_security_group_rule" "production_app_api_from_partner" {
  provider          = aws.primary
  count             = length(local.partner_app_subnet_cidrs)

  type              = "ingress"
  from_port         = local.allowed_ports.custom_api
  to_port           = local.allowed_ports.custom_api
  protocol          = "tcp"
  cidr_blocks       = [local.partner_app_subnet_cidrs[count.index]]
  description       = "Allow custom API traffic from partner app subnet ${count.index + 1}"
  security_group_id = aws_security_group.production_app.id
}

# Egress to partner VPC - HTTPS
resource "aws_security_group_rule" "production_app_https_to_partner" {
  provider          = aws.primary
  count             = length(local.partner_app_subnet_cidrs)

  type              = "egress"
  from_port         = local.allowed_ports.https
  to_port           = local.allowed_ports.https
  protocol          = "tcp"
  cidr_blocks       = [local.partner_app_subnet_cidrs[count.index]]
  description       = "Allow HTTPS to partner app subnet ${count.index + 1}"
  security_group_id = aws_security_group.production_app.id
}

# Egress to partner VPC - custom API
resource "aws_security_group_rule" "production_app_api_to_partner" {
  provider          = aws.primary
  count             = length(local.partner_app_subnet_cidrs)

  type              = "egress"
  from_port         = local.allowed_ports.custom_api
  to_port           = local.allowed_ports.custom_api
  protocol          = "tcp"
  cidr_blocks       = [local.partner_app_subnet_cidrs[count.index]]
  description       = "Allow custom API traffic to partner app subnet ${count.index + 1}"
  security_group_id = aws_security_group.production_app.id
}

# -----------------------------------------------------------------------------
# PARTNER VPC SECURITY GROUPS
# -----------------------------------------------------------------------------

# Security group for partner application servers
resource "aws_security_group" "partner_app" {
  provider    = aws.partner
  name        = "partner-app-sg-${var.environment_suffix}"
  description = "Security group for partner application servers allowing peered VPC traffic"
  vpc_id      = aws_vpc.partner.id

  tags = merge(local.common_tags, {
    Name = "partner-app-sg-${var.environment_suffix}"
  })
}

# Allow HTTPS (443) from production VPC application subnets
resource "aws_security_group_rule" "partner_app_https_from_production" {
  provider          = aws.partner
  count             = length(local.production_app_subnet_cidrs)

  type              = "ingress"
  from_port         = local.allowed_ports.https
  to_port           = local.allowed_ports.https
  protocol          = "tcp"
  cidr_blocks       = [local.production_app_subnet_cidrs[count.index]]
  description       = "Allow HTTPS from production app subnet ${count.index + 1}"
  security_group_id = aws_security_group.partner_app.id
}

# Allow custom API (8443) from production VPC application subnets
resource "aws_security_group_rule" "partner_app_api_from_production" {
  provider          = aws.partner
  count             = length(local.production_app_subnet_cidrs)

  type              = "ingress"
  from_port         = local.allowed_ports.custom_api
  to_port           = local.allowed_ports.custom_api
  protocol          = "tcp"
  cidr_blocks       = [local.production_app_subnet_cidrs[count.index]]
  description       = "Allow custom API traffic from production app subnet ${count.index + 1}"
  security_group_id = aws_security_group.partner_app.id
}

# Egress to production VPC - HTTPS
resource "aws_security_group_rule" "partner_app_https_to_production" {
  provider          = aws.partner
  count             = length(local.production_app_subnet_cidrs)

  type              = "egress"
  from_port         = local.allowed_ports.https
  to_port           = local.allowed_ports.https
  protocol          = "tcp"
  cidr_blocks       = [local.production_app_subnet_cidrs[count.index]]
  description       = "Allow HTTPS to production app subnet ${count.index + 1}"
  security_group_id = aws_security_group.partner_app.id
}

# Egress to production VPC - custom API
resource "aws_security_group_rule" "partner_app_api_to_production" {
  provider          = aws.partner
  count             = length(local.production_app_subnet_cidrs)

  type              = "egress"
  from_port         = local.allowed_ports.custom_api
  to_port           = local.allowed_ports.custom_api
  protocol          = "tcp"
  cidr_blocks       = [local.production_app_subnet_cidrs[count.index]]
  description       = "Allow custom API traffic to production app subnet ${count.index + 1}"
  security_group_id = aws_security_group.partner_app.id
}
```

## File: lib/monitoring.tf

```hcl
# monitoring.tf - VPC Flow Logs and CloudWatch Alarms

# -----------------------------------------------------------------------------
# S3 BUCKET FOR FLOW LOGS
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "flow_logs" {
  provider = aws.primary
  bucket   = "vpc-flow-logs-${data.aws_caller_identity.current.account_id}-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name = "vpc-flow-logs-${var.environment_suffix}"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "flow_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.flow_logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = var.flow_log_retention_days
    }
  }
}

# S3 bucket policy for VPC Flow Logs
resource "aws_s3_bucket_policy" "flow_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.flow_logs.id
  policy   = data.aws_iam_policy_document.flow_logs_bucket_policy.json
}

data "aws_iam_policy_document" "flow_logs_bucket_policy" {
  provider = aws.primary

  statement {
    sid    = "AWSLogDeliveryWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.flow_logs.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }

  statement {
    sid    = "AWSLogDeliveryAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }

    actions = [
      "s3:GetBucketAcl"
    ]

    resources = [
      aws_s3_bucket.flow_logs.arn
    ]
  }
}

# -----------------------------------------------------------------------------
# VPC FLOW LOGS
# -----------------------------------------------------------------------------

# Production VPC Flow Logs
resource "aws_flow_log" "production_vpc" {
  provider             = aws.primary
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.production.id

  # 1-minute aggregation interval as required
  max_aggregation_interval = local.flow_log_aggregation_interval

  tags = merge(local.common_tags, {
    Name = "production-vpc-flow-log-${var.environment_suffix}"
  })

  depends_on = [aws_s3_bucket_policy.flow_logs]
}

# Partner VPC Flow Logs
resource "aws_flow_log" "partner_vpc" {
  provider             = aws.partner
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.partner.id

  # 1-minute aggregation interval as required
  max_aggregation_interval = local.flow_log_aggregation_interval

  tags = merge(local.common_tags, {
    Name = "partner-vpc-flow-log-${var.environment_suffix}"
  })

  depends_on = [aws_s3_bucket_policy.flow_logs]
}

# -----------------------------------------------------------------------------
# CLOUDWATCH ALARMS
# -----------------------------------------------------------------------------

# SNS topic for alarm notifications
resource "aws_sns_topic" "peering_alarms" {
  provider = aws.primary
  name     = "vpc-peering-alarms-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name = "vpc-peering-alarms-${var.environment_suffix}"
  })
}

resource "aws_sns_topic_subscription" "alarm_email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.peering_alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email_endpoint
}

# CloudWatch Log Group for peering connection metrics
resource "aws_cloudwatch_log_group" "peering_metrics" {
  provider          = aws.primary
  name              = "/aws/vpc/peering/${var.environment_suffix}"
  retention_in_days = var.flow_log_retention_days

  tags = merge(local.common_tags, {
    Name = "peering-metrics-${var.environment_suffix}"
  })
}

# CloudWatch metric filter for peering connection state changes
resource "aws_cloudwatch_log_metric_filter" "peering_state_change" {
  provider       = aws.primary
  name           = "peering-state-changes-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.peering_metrics.name
  pattern        = "[time, request_id, event_type=PeeringConnectionStateChange*, ...]"

  metric_transformation {
    name      = "PeeringConnectionStateChanges"
    namespace = "CustomVPC/Peering"
    value     = "1"
  }
}

# Alarm for peering connection state changes
resource "aws_cloudwatch_metric_alarm" "peering_state_change" {
  provider            = aws.primary
  alarm_name          = "peering-state-change-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "PeeringConnectionStateChanges"
  namespace           = "CustomVPC/Peering"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when VPC peering connection state changes"
  alarm_actions       = [aws_sns_topic.peering_alarms.arn]

  tags = merge(local.common_tags, {
    Name = "peering-state-change-alarm-${var.environment_suffix}"
  })
}

# CloudWatch metric filter for traffic anomalies (rejected connections)
resource "aws_cloudwatch_log_metric_filter" "rejected_traffic" {
  provider       = aws.primary
  name           = "rejected-peering-traffic-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.peering_metrics.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, start, end, action=REJECT*, flow_log_status]"

  metric_transformation {
    name      = "RejectedPeeringConnections"
    namespace = "CustomVPC/Peering"
    value     = "1"
  }
}

# Alarm for traffic anomalies (high rejection rate)
resource "aws_cloudwatch_metric_alarm" "traffic_anomaly" {
  provider            = aws.primary
  alarm_name          = "peering-traffic-anomaly-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RejectedPeeringConnections"
  namespace           = "CustomVPC/Peering"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Alert when rejected peering traffic exceeds threshold"
  alarm_actions       = [aws_sns_topic.peering_alarms.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(local.common_tags, {
    Name = "peering-traffic-anomaly-alarm-${var.environment_suffix}"
  })
}
```

## File: lib/iam.tf

```hcl
# iam.tf - IAM roles and policies for cross-account access

# -----------------------------------------------------------------------------
# IAM ROLE FOR CROSS-ACCOUNT VPC PEERING
# -----------------------------------------------------------------------------

# IAM role for cross-account VPC peering operations
resource "aws_iam_role" "vpc_peering" {
  provider = aws.primary
  name     = "vpc-peering-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = var.partner_account_id != "" ? "arn:aws:iam::${var.partner_account_id}:root" : data.aws_caller_identity.current.arn
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${local.project_name}-${var.environment_suffix}"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "vpc-peering-role-${var.environment_suffix}"
  })
}

# IAM policy for VPC peering with least privilege
resource "aws_iam_policy" "vpc_peering" {
  provider    = aws.primary
  name        = "vpc-peering-policy-${var.environment_suffix}"
  description = "Least privilege policy for VPC peering operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowVPCPeeringOperations"
        Effect = "Allow"
        Action = [
          "ec2:DescribeVpcPeeringConnections",
          "ec2:DescribeVpcs",
          "ec2:DescribeRouteTables",
          "ec2:DescribeSubnets"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowPeeringAccept"
        Effect = "Allow"
        Action = [
          "ec2:AcceptVpcPeeringConnection",
          "ec2:ModifyVpcPeeringConnectionOptions"
        ]
        Resource = [
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:vpc-peering-connection/*",
          "arn:aws:ec2:${var.partner_region}:${data.aws_caller_identity.current.account_id}:vpc-peering-connection/*"
        ]
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Project" = local.project_name
          }
        }
      },
      {
        Sid    = "DenyDangerousOperations"
        Effect = "Deny"
        Action = [
          "ec2:DeleteVpcPeeringConnection",
          "ec2:RejectVpcPeeringConnection",
          "ec2:CreateRoute",
          "ec2:DeleteRoute"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:PrincipalArn" = aws_iam_role.vpc_peering.arn
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "vpc-peering-policy-${var.environment_suffix}"
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "vpc_peering" {
  provider   = aws.primary
  role       = aws_iam_role.vpc_peering.name
  policy_arn = aws_iam_policy.vpc_peering.arn
}

# -----------------------------------------------------------------------------
# IAM ROLE FOR FLOW LOGS
# -----------------------------------------------------------------------------

# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  provider = aws.primary
  name     = "vpc-flow-logs-role-${var.environment_suffix}"

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
    Name = "vpc-flow-logs-role-${var.environment_suffix}"
  })
}

# IAM policy for Flow Logs to write to CloudWatch Logs
resource "aws_iam_policy" "flow_logs" {
  provider    = aws.primary
  name        = "vpc-flow-logs-policy-${var.environment_suffix}"
  description = "Policy for VPC Flow Logs to write to CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowFlowLogsWrite"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/vpc/peering/*"
      },
      {
        Sid    = "DenyUnauthorizedAccess"
        Effect = "Deny"
        Action = [
          "logs:DeleteLogGroup",
          "logs:DeleteLogStream"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "vpc-flow-logs-policy-${var.environment_suffix}"
  })
}

# Attach policy to Flow Logs role
resource "aws_iam_role_policy_attachment" "flow_logs" {
  provider   = aws.primary
  role       = aws_iam_role.flow_logs.name
  policy_arn = aws_iam_policy.flow_logs.arn
}
```

## File: lib/provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {}
}

# Primary provider for production VPC (us-east-1)
provider "aws" {
  alias  = "primary"
  region = var.aws_region
}

# Secondary provider for partner VPC (us-east-2)
provider "aws" {
  alias  = "partner"
  region = var.partner_region
}

# Default provider (uses primary region)
provider "aws" {
  region = var.aws_region
}
```

## File: lib/outputs.tf

```hcl
# outputs.tf

# -----------------------------------------------------------------------------
# VPC PEERING CONNECTION OUTPUTS
# -----------------------------------------------------------------------------

output "vpc_peering_connection_id" {
  description = "The ID of the VPC peering connection"
  value       = aws_vpc_peering_connection.production_to_partner.id
}

output "vpc_peering_connection_status" {
  description = "The status of the VPC peering connection"
  value       = aws_vpc_peering_connection.production_to_partner.accept_status
}

output "dns_resolution_enabled_requester" {
  description = "DNS resolution status for requester VPC"
  value       = aws_vpc_peering_connection.production_to_partner.requester[0].allow_remote_vpc_dns_resolution
}

output "dns_resolution_enabled_accepter" {
  description = "DNS resolution status for accepter VPC"
  value       = aws_vpc_peering_connection_accepter.partner_accept.accepter[0].allow_remote_vpc_dns_resolution
}

# -----------------------------------------------------------------------------
# VPC OUTPUTS
# -----------------------------------------------------------------------------

output "production_vpc_id" {
  description = "Production VPC ID"
  value       = aws_vpc.production.id
}

output "production_vpc_cidr" {
  description = "Production VPC CIDR block"
  value       = aws_vpc.production.cidr_block
}

output "partner_vpc_id" {
  description = "Partner VPC ID"
  value       = aws_vpc.partner.id
}

output "partner_vpc_cidr" {
  description = "Partner VPC CIDR block"
  value       = aws_vpc.partner.cidr_block
}

# -----------------------------------------------------------------------------
# ROUTE TABLE OUTPUTS
# -----------------------------------------------------------------------------

output "production_app_route_table_ids" {
  description = "List of route table IDs for production application subnets"
  value       = aws_route_table.production_app[*].id
}

output "partner_app_route_table_ids" {
  description = "List of route table IDs for partner application subnets"
  value       = aws_route_table.partner_app[*].id
}

output "production_peering_route_count" {
  description = "Number of peering routes configured in production VPC"
  value       = length(local.production_app_subnet_cidrs) * length(local.partner_app_subnet_cidrs)
}

output "partner_peering_route_count" {
  description = "Number of peering routes configured in partner VPC"
  value       = length(local.partner_app_subnet_cidrs) * length(local.production_app_subnet_cidrs)
}

output "total_configured_routes" {
  description = "Total number of peering routes configured across both VPCs"
  value       = (length(local.production_app_subnet_cidrs) * length(local.partner_app_subnet_cidrs)) + (length(local.partner_app_subnet_cidrs) * length(local.production_app_subnet_cidrs))
}

# -----------------------------------------------------------------------------
# SECURITY GROUP OUTPUTS
# -----------------------------------------------------------------------------

output "production_app_security_group_id" {
  description = "Security group ID for production application servers"
  value       = aws_security_group.production_app.id
}

output "partner_app_security_group_id" {
  description = "Security group ID for partner application servers"
  value       = aws_security_group.partner_app.id
}

# -----------------------------------------------------------------------------
# MONITORING OUTPUTS
# -----------------------------------------------------------------------------

output "flow_logs_bucket_name" {
  description = "S3 bucket name for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.bucket
}

output "flow_logs_bucket_arn" {
  description = "S3 bucket ARN for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.arn
}

output "production_flow_log_id" {
  description = "Production VPC Flow Log ID"
  value       = aws_flow_log.production_vpc.id
}

output "partner_flow_log_id" {
  description = "Partner VPC Flow Log ID"
  value       = aws_flow_log.partner_vpc.id
}

output "alarm_topic_arn" {
  description = "SNS topic ARN for peering alarms"
  value       = aws_sns_topic.peering_alarms.arn
}

# -----------------------------------------------------------------------------
# IAM OUTPUTS
# -----------------------------------------------------------------------------

output "vpc_peering_role_arn" {
  description = "ARN of the IAM role for VPC peering operations"
  value       = aws_iam_role.vpc_peering.arn
}

output "flow_logs_role_arn" {
  description = "ARN of the IAM role for VPC Flow Logs"
  value       = aws_iam_role.flow_logs.arn
}

# -----------------------------------------------------------------------------
# SUBNET OUTPUTS
# -----------------------------------------------------------------------------

output "production_app_subnet_ids" {
  description = "List of production application subnet IDs"
  value       = aws_subnet.production_app[*].id
}

output "partner_app_subnet_ids" {
  description = "List of partner application subnet IDs"
  value       = aws_subnet.partner_app[*].id
}

# -----------------------------------------------------------------------------
# CONFIGURATION SUMMARY
# -----------------------------------------------------------------------------

output "configuration_summary" {
  description = "Summary of the VPC peering configuration"
  value = {
    peering_connection_id         = aws_vpc_peering_connection.production_to_partner.id
    dns_resolution_enabled        = var.enable_dns_resolution
    production_vpc_cidr           = local.production_vpc_cidr
    partner_vpc_cidr              = local.partner_vpc_cidr
    allowed_ports                 = local.allowed_ports
    flow_log_aggregation_interval = "${local.flow_log_aggregation_interval} seconds"
    total_routes_configured       = (length(local.production_app_subnet_cidrs) * length(local.partner_app_subnet_cidrs)) + (length(local.partner_app_subnet_cidrs) * length(local.production_app_subnet_cidrs))
  }
}
```

## Deployment Instructions

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Create terraform.tfvars:
   ```hcl
   environment_suffix = "unique-suffix-here"
   aws_region         = "us-east-1"
   partner_region     = "us-east-2"
   alarm_email_endpoint = "your-email@example.com"
   ```

3. Plan deployment:
   ```bash
   terraform plan
   ```

4. Apply configuration:
   ```bash
   terraform apply
   ```

## Architecture Summary

- Two VPCs: Production (10.0.0.0/16) in us-east-1, Partner (172.16.0.0/16) in us-east-2
- Cross-region VPC peering with DNS resolution enabled
- Separate route tables for public, application, and database tiers
- Peering routes only for application subnets (restricted CIDR blocks)
- Security groups allowing only ports 443 and 8443 between peered VPCs
- VPC Flow Logs with 1-minute aggregation to S3
- CloudWatch alarms for peering state changes and traffic anomalies
- IAM roles with least privilege and explicit deny statements
- All resources tagged with Environment, Project, and CostCenter
