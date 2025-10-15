# tap_stack.tf - Multi-Account VPC Peering with Secure Access

# ================================================================================
# VARIABLES
# ================================================================================

variable "primary_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "peer_account_ids" {
  description = "List of peer AWS account IDs"
  type        = list(string)
  default     = []
}

variable "account_id_map" {
  description = "Map of VPC index to AWS account ID (defaults to current account)"
  type        = map(string)
  default     = {}
}

variable "cross_account_role_name" {
  description = "IAM role name for cross-account access"
  type        = string
  default     = "TerraformPeeringRole"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"

  validation {
    condition     = can(regex("^(production|staging|development)$", var.environment))
    error_message = "Environment must be production, staging, or development."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "vpc-peering"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team"
}

variable "vpc_count" {
  description = "Number of VPCs to create"
  type        = number
  default     = 10

  validation {
    condition     = var.vpc_count >= 2 && var.vpc_count <= 10
    error_message = "VPC count must be between 2 and 10."
  }
}

variable "vpc_base_cidr" {
  description = "Base CIDR for VPCs (10.X.0.0/16)"
  type        = string
  default     = "10.0.0.0/16"
}

variable "peering_topology" {
  description = "VPC peering topology: full-mesh, hub-spoke, or custom"
  type        = string
  default     = "hub-spoke"

  validation {
    condition     = can(regex("^(full-mesh|hub-spoke|custom)$", var.peering_topology))
    error_message = "Peering topology must be full-mesh, hub-spoke, or custom."
  }
}

variable "custom_peering_map" {
  description = "Custom peering map for custom topology (list of requester/accepter pairs)"
  type = list(object({
    requester_vpc_index = number
    accepter_vpc_index  = number
  }))
  default = []
}

variable "database_access_map" {
  description = "Database access mapping (source VPC index to target VPC index)"
  type = list(object({
    source_vpc_index = number
    target_vpc_index = number
  }))
  default = []
}

variable "flow_log_retention_days" {
  description = "VPC Flow Logs retention period in days"
  type        = number
  default     = 30
}

variable "log_archive_transition_days" {
  description = "Days before transitioning logs to Glacier"
  type        = number
  default     = 90
}

variable "log_archive_deletion_days" {
  description = "Days before deleting archived logs"
  type        = number
  default     = 365
}

variable "sns_topic_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = "ops@example.com"
}

variable "compliance_check_schedule" {
  description = "CloudWatch Events schedule for compliance checks"
  type        = string
  default     = "rate(1 hour)"
}

variable "enable_flow_logs_to_s3" {
  description = "Enable streaming VPC Flow Logs to S3"
  type        = bool
  default     = true
}

variable "enable_compliance_lambda" {
  description = "Enable Lambda compliance checking"
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail logging"
  type        = bool
  default     = true
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.12"
}

variable "environment_suffix" {
  description = "Random suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

# ================================================================================
# DATA SOURCES
# ================================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

# ================================================================================
# RANDOM SUFFIX FOR UNIQUE NAMING
# ================================================================================

resource "random_string" "environment_suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

# ================================================================================
# LOCALS
# ================================================================================

locals {
  # Environment suffix
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.environment_suffix[0].result

  # Common tags
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
    ManagedBy   = "Terraform"
  }

  # VPC CIDR blocks (10.0.0.0/16, 10.1.0.0/16, ..., 10.9.0.0/16)
  vpc_cidrs = [for i in range(var.vpc_count) : cidrsubnet("10.0.0.0/8", 8, i)]

  # Public subnets (x.0.1.0/24, x.0.2.0/24)
  public_subnet_cidrs = {
    for i in range(var.vpc_count) : i => [
      cidrsubnet(local.vpc_cidrs[i], 8, 1),
      cidrsubnet(local.vpc_cidrs[i], 8, 2)
    ]
  }

  # Private subnets (x.0.10.0/24, x.0.11.0/24)
  private_subnet_cidrs = {
    for i in range(var.vpc_count) : i => [
      cidrsubnet(local.vpc_cidrs[i], 8, 10),
      cidrsubnet(local.vpc_cidrs[i], 8, 11)
    ]
  }

  # Peering connections based on topology
  peering_connections = var.peering_topology == "full-mesh" ? [
    for i in range(var.vpc_count) : [
      for j in range(var.vpc_count) :
      {
        requester_vpc_index = i
        accepter_vpc_index  = j
      }
      if i < j
    ]
    ] : var.peering_topology == "hub-spoke" ? [
    for i in range(1, var.vpc_count) : [
      {
        requester_vpc_index = 0
        accepter_vpc_index  = i
      }
    ]
  ] : [var.custom_peering_map]

  # Flatten peering connections
  peering_pairs = flatten(local.peering_connections)

  # Account ID for each VPC (defaults to current account)
  vpc_account_ids = {
    for i in range(var.vpc_count) :
    i => lookup(var.account_id_map, i, data.aws_caller_identity.current.account_id)
  }

  # Create unique HTTPS ingress rules per VPC to avoid duplicates
  # For each peering pair, create two rules: one for each direction
  https_ingress_rules = flatten([
    for pair in local.peering_pairs : [
      # Rule for accepter VPC to allow traffic from requester VPC
      {
        vpc_index   = pair.accepter_vpc_index
        source_cidr = local.vpc_cidrs[pair.requester_vpc_index]
        source_idx  = pair.requester_vpc_index
      },
      # Rule for requester VPC to allow traffic from accepter VPC
      {
        vpc_index   = pair.requester_vpc_index
        source_cidr = local.vpc_cidrs[pair.accepter_vpc_index]
        source_idx  = pair.accepter_vpc_index
      }
    ]
  ])

  # Create unique map with vpc_index and source_cidr as key
  https_ingress_unique = {
    for rule in local.https_ingress_rules :
    "${rule.vpc_index}-${rule.source_cidr}" => rule
  }
}

# ================================================================================
# VPC AND NETWORKING
# ================================================================================

resource "aws_vpc" "main" {
  count = var.vpc_count

  cidr_block           = local.vpc_cidrs[count.index]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name     = "${var.project_name}-vpc-${count.index}-${local.env_suffix}"
    VPCIndex = count.index
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = var.vpc_count * 2

  vpc_id            = aws_vpc.main[floor(count.index / 2)].id
  cidr_block        = local.public_subnet_cidrs[floor(count.index / 2)][count.index % 2]
  availability_zone = data.aws_availability_zones.available.names[count.index % 2]

  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name     = "${var.project_name}-public-subnet-${floor(count.index / 2)}-${count.index % 2}-${local.env_suffix}"
    VPCIndex = floor(count.index / 2)
    Type     = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = var.vpc_count * 2

  vpc_id            = aws_vpc.main[floor(count.index / 2)].id
  cidr_block        = local.private_subnet_cidrs[floor(count.index / 2)][count.index % 2]
  availability_zone = data.aws_availability_zones.available.names[count.index % 2]

  tags = merge(local.common_tags, {
    Name     = "${var.project_name}-private-subnet-${floor(count.index / 2)}-${count.index % 2}-${local.env_suffix}"
    VPCIndex = floor(count.index / 2)
    Type     = "Private"
  })
}

# Internet Gateways
resource "aws_internet_gateway" "main" {
  count = var.vpc_count

  vpc_id = aws_vpc.main[count.index].id

  tags = merge(local.common_tags, {
    Name     = "${var.project_name}-igw-${count.index}-${local.env_suffix}"
    VPCIndex = count.index
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.vpc_count * 2

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name     = "${var.project_name}-nat-eip-${floor(count.index / 2)}-${count.index % 2}-${local.env_suffix}"
    VPCIndex = floor(count.index / 2)
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.vpc_count * 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name     = "${var.project_name}-nat-${floor(count.index / 2)}-${count.index % 2}-${local.env_suffix}"
    VPCIndex = floor(count.index / 2)
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Route Tables
resource "aws_route_table" "public" {
  count = var.vpc_count

  vpc_id = aws_vpc.main[count.index].id

  tags = merge(local.common_tags, {
    Name     = "${var.project_name}-public-rt-${count.index}-${local.env_suffix}"
    VPCIndex = count.index
    Type     = "Public"
  })
}

# Public Route to Internet Gateway
resource "aws_route" "public_internet" {
  count = var.vpc_count

  route_table_id         = aws_route_table.public[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main[count.index].id
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = var.vpc_count * 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[floor(count.index / 2)].id
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = var.vpc_count * 2

  vpc_id = aws_vpc.main[floor(count.index / 2)].id

  tags = merge(local.common_tags, {
    Name     = "${var.project_name}-private-rt-${floor(count.index / 2)}-${count.index % 2}-${local.env_suffix}"
    VPCIndex = floor(count.index / 2)
    Type     = "Private"
  })
}

# Private Route to NAT Gateway
resource "aws_route" "private_nat" {
  count = var.vpc_count * 2

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = var.vpc_count * 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ================================================================================
# VPC PEERING CONNECTIONS
# ================================================================================

resource "aws_vpc_peering_connection" "main" {
  count = length(local.peering_pairs)

  vpc_id      = aws_vpc.main[local.peering_pairs[count.index].requester_vpc_index].id
  peer_vpc_id = aws_vpc.main[local.peering_pairs[count.index].accepter_vpc_index].id

  peer_owner_id = local.vpc_account_ids[local.peering_pairs[count.index].accepter_vpc_index]

  auto_accept = local.vpc_account_ids[local.peering_pairs[count.index].requester_vpc_index] == local.vpc_account_ids[local.peering_pairs[count.index].accepter_vpc_index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-peering-${local.peering_pairs[count.index].requester_vpc_index}-to-${local.peering_pairs[count.index].accepter_vpc_index}-${local.env_suffix}"
    Side = "Requester"
  })
}

# VPC Peering Connection Accepter (for cross-account peering)
resource "aws_vpc_peering_connection_accepter" "main" {
  count = length([
    for pair in local.peering_pairs :
    pair if local.vpc_account_ids[pair.requester_vpc_index] != local.vpc_account_ids[pair.accepter_vpc_index]
  ])

  vpc_peering_connection_id = aws_vpc_peering_connection.main[count.index].id
  auto_accept               = true

  tags = merge(local.common_tags, {
    Side = "Accepter"
  })
}

# ================================================================================
# PEERING ROUTES
# ================================================================================

# Routes for requester VPCs (public route tables)
resource "aws_route" "peering_requester_public" {
  count = length(local.peering_pairs)

  route_table_id            = aws_route_table.public[local.peering_pairs[count.index].requester_vpc_index].id
  destination_cidr_block    = local.vpc_cidrs[local.peering_pairs[count.index].accepter_vpc_index]
  vpc_peering_connection_id = aws_vpc_peering_connection.main[count.index].id

  depends_on = [aws_vpc_peering_connection.main]
}

# Routes for requester VPCs (private route tables)
resource "aws_route" "peering_requester_private" {
  count = length(local.peering_pairs) * 2

  route_table_id            = aws_route_table.private[local.peering_pairs[floor(count.index / 2)].requester_vpc_index * 2 + (count.index % 2)].id
  destination_cidr_block    = local.vpc_cidrs[local.peering_pairs[floor(count.index / 2)].accepter_vpc_index]
  vpc_peering_connection_id = aws_vpc_peering_connection.main[floor(count.index / 2)].id

  depends_on = [aws_vpc_peering_connection.main]
}

# Routes for accepter VPCs (public route tables)
resource "aws_route" "peering_accepter_public" {
  count = length(local.peering_pairs)

  route_table_id            = aws_route_table.public[local.peering_pairs[count.index].accepter_vpc_index].id
  destination_cidr_block    = local.vpc_cidrs[local.peering_pairs[count.index].requester_vpc_index]
  vpc_peering_connection_id = aws_vpc_peering_connection.main[count.index].id

  depends_on = [aws_vpc_peering_connection.main]
}

# Routes for accepter VPCs (private route tables)
resource "aws_route" "peering_accepter_private" {
  count = length(local.peering_pairs) * 2

  route_table_id            = aws_route_table.private[local.peering_pairs[floor(count.index / 2)].accepter_vpc_index * 2 + (count.index % 2)].id
  destination_cidr_block    = local.vpc_cidrs[local.peering_pairs[floor(count.index / 2)].requester_vpc_index]
  vpc_peering_connection_id = aws_vpc_peering_connection.main[floor(count.index / 2)].id

  depends_on = [aws_vpc_peering_connection.main]
}

# ================================================================================
# SECURITY GROUPS
# ================================================================================

# Security Groups for each VPC
resource "aws_security_group" "vpc_peering" {
  count = var.vpc_count

  name_prefix = "${var.project_name}-vpc-${count.index}-sg-"
  description = "Security group for VPC ${count.index} peering traffic"
  vpc_id      = aws_vpc.main[count.index].id

  tags = merge(local.common_tags, {
    Name     = "${var.project_name}-vpc-${count.index}-sg-${local.env_suffix}"
    VPCIndex = count.index
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Allow HTTPS (443) from all peered VPC CIDRs
resource "aws_security_group_rule" "https_ingress" {
  for_each = local.https_ingress_unique

  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = [each.value.source_cidr]
  security_group_id = aws_security_group.vpc_peering[each.value.vpc_index].id
  description       = "Allow HTTPS from peered VPC ${each.value.source_idx}"
}

# Allow MySQL (3306) from specific VPC CIDRs based on database_access_map
resource "aws_security_group_rule" "mysql_from_specific_vpcs" {
  count = length(var.database_access_map)

  type              = "ingress"
  from_port         = 3306
  to_port           = 3306
  protocol          = "tcp"
  cidr_blocks       = [local.vpc_cidrs[var.database_access_map[count.index].source_vpc_index]]
  security_group_id = aws_security_group.vpc_peering[var.database_access_map[count.index].target_vpc_index].id
  description       = "Allow MySQL from VPC ${var.database_access_map[count.index].source_vpc_index}"
}

# Egress rules for all outbound to peered VPCs
resource "aws_security_group_rule" "egress_to_all" {
  count = var.vpc_count

  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.vpc_peering[count.index].id
  description       = "Allow all outbound traffic"
}

# ================================================================================
# KMS ENCRYPTION
# ================================================================================

resource "aws_kms_key" "main" {
  description             = "KMS key for VPC peering infrastructure encryption"
  deletion_window_in_days = 30
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.primary_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow SNS"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-kms-key-${local.env_suffix}"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${local.env_suffix}"
  target_key_id = aws_kms_key.main.key_id
}

# ================================================================================
# VPC FLOW LOGS
# ================================================================================

# CloudWatch Log Groups for VPC Flow Logs
resource "aws_cloudwatch_log_group" "flow_logs" {
  count = var.vpc_count

  name              = "/aws/vpc/flowlogs/${aws_vpc.main[count.index].id}"
  retention_in_days = var.flow_log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name     = "${var.project_name}-flowlogs-${count.index}-${local.env_suffix}"
    VPCIndex = count.index
  })
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  name = "${var.project_name}-flow-logs-role-${local.env_suffix}"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_logs" {
  name = "${var.project_name}-flow-logs-policy-${local.env_suffix}"
  role = aws_iam_role.flow_logs.id

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

# VPC Flow Logs
resource "aws_flow_log" "main" {
  count = var.vpc_count

  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs[count.index].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main[count.index].id

  tags = merge(local.common_tags, {
    Name     = "${var.project_name}-flow-log-${count.index}-${local.env_suffix}"
    VPCIndex = count.index
  })
}

# ================================================================================
# CENTRALIZED LOGGING - S3 BUCKET
# ================================================================================

resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-logs-${data.aws_caller_identity.current.account_id}-${local.env_suffix}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-logs-${local.env_suffix}"
  })
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "archive-logs"
    status = "Enabled"

    filter {}

    transition {
      days          = var.log_archive_transition_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.log_archive_deletion_days
    }
  }
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat([
      {
        Sid    = "AllowCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AllowCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
      }
      ],
      length(var.peer_account_ids) > 0 ? [
        {
          Sid    = "AllowCrossAccountWrite"
          Effect = "Allow"
          Principal = {
            AWS = [for account_id in var.peer_account_ids : "arn:aws:iam::${account_id}:root"]
          }
          Action = [
            "s3:PutObject",
            "s3:PutObjectAcl"
          ]
          Resource = "${aws_s3_bucket.logs.arn}/*"
        }
    ] : [])
  })
}

# ================================================================================
# CLOUDTRAIL
# ================================================================================

resource "aws_cloudtrail" "main" {
  count = var.enable_cloudtrail ? 1 : 0

  name                          = "${var.project_name}-trail-${local.env_suffix}"
  s3_bucket_name                = aws_s3_bucket.logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-trail-${local.env_suffix}"
  })

  depends_on = [aws_s3_bucket_policy.logs]
}

# ================================================================================
# SNS TOPIC FOR NOTIFICATIONS
# ================================================================================

resource "aws_sns_topic" "alerts" {
  name              = "${var.project_name}-alerts-${local.env_suffix}"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alerts-${local.env_suffix}"
  })
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.sns_topic_email
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat([
      {
        Sid    = "AllowCloudWatchEvents"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
      ],
      length(var.peer_account_ids) > 0 ? [
        {
          Sid    = "AllowCrossAccountPublish"
          Effect = "Allow"
          Principal = {
            AWS = [for account_id in var.peer_account_ids : "arn:aws:iam::${account_id}:root"]
          }
          Action   = "SNS:Publish"
          Resource = aws_sns_topic.alerts.arn
        }
    ] : [])
  })
}

# ================================================================================
# CLOUDWATCH MONITORING
# ================================================================================

# Metric Filter for Rejected Connections
resource "aws_cloudwatch_log_metric_filter" "rejected_connections" {
  count = var.vpc_count

  name           = "${var.project_name}-rejected-connections-${count.index}-${local.env_suffix}"
  log_group_name = aws_cloudwatch_log_group.flow_logs[count.index].name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=REJECT, flowlogstatus]"

  metric_transformation {
    name      = "RejectedConnections-VPC-${count.index}"
    namespace = "Corp/VPCPeering/Security"
    value     = "1"
  }
}

# Alarm for Rejected Connections
resource "aws_cloudwatch_metric_alarm" "rejected_connections" {
  count = var.vpc_count

  alarm_name          = "${var.project_name}-rejected-connections-${count.index}-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RejectedConnections-VPC-${count.index}"
  namespace           = "Corp/VPCPeering/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Alert on high number of rejected connections in VPC ${count.index}"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# ================================================================================
# EVENTBRIDGE RULES
# ================================================================================

# Rule for VPC Peering Connection Deleted
resource "aws_cloudwatch_event_rule" "peering_deleted" {
  name        = "${var.project_name}-peering-deleted-${local.env_suffix}"
  description = "Capture VPC peering connection deletion events"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = ["DeleteVpcPeeringConnection"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "peering_deleted_sns" {
  rule      = aws_cloudwatch_event_rule.peering_deleted.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alerts.arn
}

# Rule for Security Group Modified
resource "aws_cloudwatch_event_rule" "security_group_modified" {
  name        = "${var.project_name}-sg-modified-${local.env_suffix}"
  description = "Capture security group modification events"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "AuthorizeSecurityGroupIngress",
        "RevokeSecurityGroupIngress",
        "AuthorizeSecurityGroupEgress",
        "RevokeSecurityGroupEgress"
      ]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "security_group_modified_sns" {
  rule      = aws_cloudwatch_event_rule.security_group_modified.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alerts.arn
}

# Rule for Unauthorized API Calls
resource "aws_cloudwatch_event_rule" "unauthorized_api_calls" {
  name        = "${var.project_name}-unauthorized-calls-${local.env_suffix}"
  description = "Capture unauthorized API call attempts"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      errorCode = ["UnauthorizedOperation", "AccessDenied"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "unauthorized_api_calls_sns" {
  rule      = aws_cloudwatch_event_rule.unauthorized_api_calls.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alerts.arn
}

# ================================================================================
# LAMBDA COMPLIANCE FUNCTION
# ================================================================================

# IAM Role for Lambda
resource "aws_iam_role" "compliance_lambda" {
  count = var.enable_compliance_lambda ? 1 : 0

  name = "${var.project_name}-compliance-lambda-role-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "compliance_lambda" {
  count = var.enable_compliance_lambda ? 1 : 0

  name = "${var.project_name}-compliance-lambda-policy-${local.env_suffix}"
  role = aws_iam_role.compliance_lambda[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat([
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeVpcs",
          "ec2:DescribeVpcPeeringConnections",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSecurityGroupRules",
          "ec2:DescribeRouteTables",
          "ec2:DescribeFlowLogs"
        ]
        Resource = "*"
      }
      ],
      length(var.peer_account_ids) > 0 ? [
        {
          Effect = "Allow"
          Action = [
            "sts:AssumeRole"
          ]
          Resource = [
            for account_id in var.peer_account_ids :
            "arn:aws:iam::${account_id}:role/${var.cross_account_role_name}"
          ]
        }
      ] : [],
      [
        {
          Effect = "Allow"
          Action = [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ]
          Resource = "arn:aws:logs:*:*:*"
        },
        {
          Effect = "Allow"
          Action = [
            "sns:Publish"
          ]
          Resource = aws_sns_topic.alerts.arn
        },
        {
          Effect = "Allow"
          Action = [
            "cloudwatch:PutMetricData"
          ]
          Resource = "*"
        }
    ])
  })
}

# Lambda Function
data "archive_file" "compliance_lambda" {
  count = var.enable_compliance_lambda ? 1 : 0

  type        = "zip"
  source_file = "${path.module}/lambda/compliance_check.py"
  output_path = "${path.module}/lambda_compliance.zip"
}

resource "aws_lambda_function" "compliance" {
  count = var.enable_compliance_lambda ? 1 : 0

  filename         = data.archive_file.compliance_lambda[0].output_path
  function_name    = "${var.project_name}-compliance-${local.env_suffix}"
  role             = aws_iam_role.compliance_lambda[0].arn
  handler          = "compliance_check.handler"
  source_code_hash = data.archive_file.compliance_lambda[0].output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = 300
  memory_size      = 256

  environment {
    variables = {
      VPC_IDS                = join(",", [for vpc in aws_vpc.main : vpc.id])
      PEERING_CONNECTION_IDS = join(",", [for pc in aws_vpc_peering_connection.main : pc.id])
      SNS_TOPIC_ARN          = aws_sns_topic.alerts.arn
      CROSS_ACCOUNT_ROLE     = var.cross_account_role_name
      PEER_ACCOUNT_IDS       = join(",", var.peer_account_ids)
    }
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy.compliance_lambda,
    aws_cloudwatch_log_group.compliance_lambda
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "compliance_lambda" {
  count = var.enable_compliance_lambda ? 1 : 0

  name              = "/aws/lambda/${var.project_name}-compliance-${local.env_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

# EventBridge Rule for Scheduled Lambda
resource "aws_cloudwatch_event_rule" "compliance_schedule" {
  count = var.enable_compliance_lambda ? 1 : 0

  name                = "${var.project_name}-compliance-schedule-${local.env_suffix}"
  description         = "Trigger compliance checks hourly"
  schedule_expression = var.compliance_check_schedule

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "compliance_lambda" {
  count = var.enable_compliance_lambda ? 1 : 0

  rule      = aws_cloudwatch_event_rule.compliance_schedule[0].name
  target_id = "ComplianceLambdaTarget"
  arn       = aws_lambda_function.compliance[0].arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  count = var.enable_compliance_lambda ? 1 : 0

  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_schedule[0].arn
}

# ================================================================================
# OUTPUTS
# ================================================================================

output "vpc_ids" {
  description = "List of VPC IDs"
  value       = [for vpc in aws_vpc.main : vpc.id]
}

output "vpc_cidrs" {
  description = "List of VPC CIDR blocks"
  value       = [for vpc in aws_vpc.main : vpc.cidr_block]
}

output "peering_connection_ids" {
  description = "Map of peering connection IDs"
  value = {
    for idx, pc in aws_vpc_peering_connection.main :
    "${local.peering_pairs[idx].requester_vpc_index}-to-${local.peering_pairs[idx].accepter_vpc_index}" => pc.id
  }
}

output "security_group_ids" {
  description = "Map of security group IDs per VPC"
  value = {
    for idx, sg in aws_security_group.vpc_peering :
    idx => sg.id
  }
}

output "cloudwatch_log_group_names" {
  description = "List of CloudWatch log group names for VPC Flow Logs"
  value       = [for lg in aws_cloudwatch_log_group.flow_logs : lg.name]
}

output "s3_bucket_name" {
  description = "S3 bucket name for centralized logging"
  value       = aws_s3_bucket.logs.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN for centralized logging"
  value       = aws_s3_bucket.logs.arn
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].arn : null
}

output "kms_key_arn" {
  description = "KMS key ARN for encryption"
  value       = aws_kms_key.main.arn
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.main.key_id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "lambda_function_arn" {
  description = "Lambda function ARN for compliance checks"
  value       = var.enable_compliance_lambda ? aws_lambda_function.compliance[0].arn : null
}

output "lambda_function_name" {
  description = "Lambda function name for compliance checks"
  value       = var.enable_compliance_lambda ? aws_lambda_function.compliance[0].function_name : null
}

output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "peering_topology" {
  description = "VPC peering topology used"
  value       = var.peering_topology
}
