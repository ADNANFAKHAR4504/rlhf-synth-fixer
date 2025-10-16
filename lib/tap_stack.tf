#############################################
# tap_stack.tf — Task-04 (Single File)
# Multi-Region AWS Infrastructure with strong defaults
#
# IMPORTANT CONVENTIONS FOR THIS FILE
# - Do NOT add any `provider` or backend blocks; CI injects them.
# - Always pin resources/data sources to aliased providers:
#     * us-east-1  →  provider = aws.use1
#     * eu-west-1  →  provider = aws.euw1
# - Prefer explicit dependencies through references; avoid arbitrary depends_on.
# - Keep resources destroyable; no lifecycle.prevent_destroy.
#############################################

#############################################
# VARIABLES
#############################################

variable "env" {
  description = "Environment name (e.g., dev, stage, prod)."
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner of the stack (for tagging and accountability)."
  type        = string
  default     = "platform-team"
}

variable "cost_center" {
  description = "Cost center identifier for chargeback."
  type        = string
  default     = "cc-0001"
}

variable "domain_name" {
  description = "Fully-qualified domain name for the application (e.g., app.example.com)."
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID that contains the application domain."
  type        = string
  default     = ""
}

variable "alb_cert_arn_use1" {
  description = "ACM certificate ARN in us-east-1 for the ALB HTTPS listener."
  type        = string
  default     = ""
}

variable "cloudfront_cert_arn_use1" {
  description = "ACM certificate ARN in us-east-1 for CloudFront distribution."
  type        = string
  default     = ""
}

variable "use1_cidr" {
  description = "VPC CIDR for us-east-1 (must not overlap with eu-west-1)."
  type        = string
  default     = "10.10.0.0/16"
}

variable "euw1_cidr" {
  description = "VPC CIDR for eu-west-1 (must not overlap with us-east-1)."
  type        = string
  default     = "10.20.0.0/16"
}

variable "web_instance_type" {
  description = "Instance type for application EC2 instances."
  type        = string
  default     = "t3.micro"
}

variable "rds_engine" {
  description = "RDS engine (postgres or mysql)."
  type        = string
  default     = "postgres"
}

variable "rds_engine_version" {
  description = "RDS engine version (e.g., 15.4 for Postgres)."
  type        = string
  default     = "15.4"
}

variable "rds_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "Allocated storage for RDS in GiB."
  type        = number
  default     = 20
}

variable "s3_upload_bucket_name" {
  description = "Name of the S3 bucket receiving uploads that trigger Lambda."
  type        = string
  default     = ""
}

variable "s3_upload_prefix" {
  description = "Optional object key prefix in the upload bucket that triggers Lambda."
  type        = string
  default     = ""
}

#############################################
# LOCALS (TAGS, NAMING, SUBNET CIDRS)
#############################################

locals {
  base_tags = {
    project     = "cloud-setup"
    Environment = var.env
    Owner       = var.owner
    CostCenter  = var.cost_center
  }

  name = {
    use1 = "cloud-setup-${var.env}-use1"
    euw1 = "cloud-setup-${var.env}-euw1"
  }

  use1_subnets = {
    public_a  = cidrsubnet(var.use1_cidr, 4, 0)
    public_b  = cidrsubnet(var.use1_cidr, 4, 1)
    private_a = cidrsubnet(var.use1_cidr, 4, 2)
    private_b = cidrsubnet(var.use1_cidr, 4, 3)
  }

  euw1_subnets = {
    public_a  = cidrsubnet(var.euw1_cidr, 4, 0)
    public_b  = cidrsubnet(var.euw1_cidr, 4, 1)
    private_a = cidrsubnet(var.euw1_cidr, 4, 2)
    private_b = cidrsubnet(var.euw1_cidr, 4, 3)
  }
}

#############################################
# DATA SOURCES (PER REGION)
#############################################

data "aws_availability_zones" "use1" {
  provider = aws.use1
  state    = "available"
}

data "aws_availability_zones" "euw1" {
  provider = aws.euw1
  state    = "available"
}

data "aws_ssm_parameter" "al2023_ami_use1" {
  provider = aws.use1
  name     = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

data "aws_ssm_parameter" "al2023_ami_euw1" {
  provider = aws.euw1
  name     = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

data "aws_route53_zone" "zone" {
  count        = (var.domain_name != "" && var.hosted_zone_id != "") ? 1 : 0
  provider     = aws.use1
  zone_id      = var.hosted_zone_id
  private_zone = false
}

data "aws_caller_identity" "current" {
  provider = aws.use1
}

data "aws_caller_identity" "current_euw1" {
  provider = aws.euw1
}

#############################################
# KMS — ONE CMK PER REGION (GENERAL PURPOSE)
#############################################

resource "aws_kms_key" "use1" {
  provider                = aws.use1
  description             = "CMK for ${local.name.use1} encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 7
  tags                    = local.base_tags
}

resource "aws_kms_alias" "use1" {
  provider      = aws.use1
  name          = "alias/${local.name.use1}"
  target_key_id = aws_kms_key.use1.key_id
}

resource "aws_kms_key" "euw1" {
  provider                = aws.euw1
  description             = "CMK for ${local.name.euw1} encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 7
  tags                    = local.base_tags
}

resource "aws_kms_alias" "euw1" {
  provider      = aws.euw1
  name          = "alias/${local.name.euw1}"
  target_key_id = aws_kms_key.euw1.key_id
}

data "aws_iam_policy_document" "use1_logs_key" {
  statement {
    sid    = "EnableRootAccountAdmin"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "AllowCloudWatchLogsUse"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["logs.us-east-1.amazonaws.com"]
    }
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    resources = ["*"]

    condition {
      test     = "ArnLike"
      variable = "kms:EncryptionContext:aws:logs:arn"
      values = [
        "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/cloud-setup/${var.env}/*"
      ]
    }
  }
}

resource "aws_kms_key" "use1_logs" {
  provider            = aws.use1
  description         = "KMS CMK for CloudWatch Logs (cloud-setup ${var.env}, us-east-1)"
  enable_key_rotation = true
  policy              = data.aws_iam_policy_document.use1_logs_key.json
  tags                = merge(local.base_tags, { Name = "${local.name.use1}-logs-kms" })
}

resource "aws_kms_alias" "use1_logs" {
  provider      = aws.use1
  name          = "alias/cloud-setup/${var.env}/logs"
  target_key_id = aws_kms_key.use1_logs.key_id
}

#############################################
# NETWORK — VPCs, IGW, NAT, ROUTES (BOTH REGIONS)
#############################################

resource "aws_vpc" "use1" {
  provider             = aws.use1
  cidr_block           = var.use1_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.base_tags, { Name = "${local.name.use1}-vpc" })
}

resource "aws_internet_gateway" "use1" {
  provider = aws.use1
  vpc_id   = aws_vpc.use1.id
  tags     = merge(local.base_tags, { Name = "${local.name.use1}-igw" })
}

resource "aws_subnet" "use1_public_a" {
  provider                = aws.use1
  vpc_id                  = aws_vpc.use1.id
  cidr_block              = local.use1_subnets.public_a
  availability_zone       = data.aws_availability_zones.use1.names[0]
  map_public_ip_on_launch = true
  tags                    = merge(local.base_tags, { Name = "${local.name.use1}-public-a", Tier = "public" })
}

resource "aws_subnet" "use1_public_b" {
  provider                = aws.use1
  vpc_id                  = aws_vpc.use1.id
  cidr_block              = local.use1_subnets.public_b
  availability_zone       = data.aws_availability_zones.use1.names[1]
  map_public_ip_on_launch = true
  tags                    = merge(local.base_tags, { Name = "${local.name.use1}-public-b", Tier = "public" })
}

resource "aws_subnet" "use1_private_a" {
  provider          = aws.use1
  vpc_id            = aws_vpc.use1.id
  cidr_block        = local.use1_subnets.private_a
  availability_zone = data.aws_availability_zones.use1.names[0]
  tags              = merge(local.base_tags, { Name = "${local.name.use1}-private-a", Tier = "private" })
}

resource "aws_subnet" "use1_private_b" {
  provider          = aws.use1
  vpc_id            = aws_vpc.use1.id
  cidr_block        = local.use1_subnets.private_b
  availability_zone = data.aws_availability_zones.use1.names[1]
  tags              = merge(local.base_tags, { Name = "${local.name.use1}-private-b", Tier = "private" })
}

resource "aws_eip" "use1_nat" {
  provider = aws.use1
  domain   = "vpc"
  tags     = merge(local.base_tags, { Name = "${local.name.use1}-nat-eip" })
}

resource "aws_nat_gateway" "use1" {
  provider      = aws.use1
  allocation_id = aws_eip.use1_nat.id
  subnet_id     = aws_subnet.use1_public_a.id
  tags          = merge(local.base_tags, { Name = "${local.name.use1}-nat" })
}

resource "aws_route_table" "use1_public" {
  provider = aws.use1
  vpc_id   = aws_vpc.use1.id
  tags     = merge(local.base_tags, { Name = "${local.name.use1}-rt-public" })
}

resource "aws_route" "use1_public_igw" {
  provider               = aws.use1
  route_table_id         = aws_route_table.use1_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.use1.id
}

resource "aws_route_table_association" "use1_public_a" {
  provider       = aws.use1
  subnet_id      = aws_subnet.use1_public_a.id
  route_table_id = aws_route_table.use1_public.id
}

resource "aws_route_table_association" "use1_public_b" {
  provider       = aws.use1
  subnet_id      = aws_subnet.use1_public_b.id
  route_table_id = aws_route_table.use1_public.id
}

resource "aws_route_table" "use1_private_a" {
  provider = aws.use1
  vpc_id   = aws_vpc.use1.id
  tags     = merge(local.base_tags, { Name = "${local.name.use1}-rt-private-a" })
}

resource "aws_route" "use1_private_a_nat" {
  provider               = aws.use1
  route_table_id         = aws_route_table.use1_private_a.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.use1.id
}

resource "aws_route_table_association" "use1_private_a" {
  provider       = aws.use1
  subnet_id      = aws_subnet.use1_private_a.id
  route_table_id = aws_route_table.use1_private_a.id
}

resource "aws_route_table" "use1_private_b" {
  provider = aws.use1
  vpc_id   = aws_vpc.use1.id
  tags     = merge(local.base_tags, { Name = "${local.name.use1}-rt-private-b" })
}

resource "aws_route" "use1_private_b_nat" {
  provider               = aws.use1
  route_table_id         = aws_route_table.use1_private_b.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.use1.id
}

resource "aws_route_table_association" "use1_private_b" {
  provider       = aws.use1
  subnet_id      = aws_subnet.use1_private_b.id
  route_table_id = aws_route_table.use1_private_b.id
}

resource "aws_vpc" "euw1" {
  provider             = aws.euw1
  cidr_block           = var.euw1_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.base_tags, { Name = "${local.name.euw1}-vpc" })
}

resource "aws_internet_gateway" "euw1" {
  provider = aws.euw1
  vpc_id   = aws_vpc.euw1.id
  tags     = merge(local.base_tags, { Name = "${local.name.euw1}-igw" })
}

resource "aws_subnet" "euw1_public_a" {
  provider                = aws.euw1
  vpc_id                  = aws_vpc.euw1.id
  cidr_block              = local.euw1_subnets.public_a
  availability_zone       = data.aws_availability_zones.euw1.names[0]
  map_public_ip_on_launch = true
  tags                    = merge(local.base_tags, { Name = "${local.name.euw1}-public-a", Tier = "public" })
}

resource "aws_subnet" "euw1_public_b" {
  provider                = aws.euw1
  vpc_id                  = aws_vpc.euw1.id
  cidr_block              = local.euw1_subnets.public_b
  availability_zone       = data.aws_availability_zones.euw1.names[1]
  map_public_ip_on_launch = true
  tags                    = merge(local.base_tags, { Name = "${local.name.euw1}-public-b", Tier = "public" })
}

resource "aws_subnet" "euw1_private_a" {
  provider          = aws.euw1
  vpc_id            = aws_vpc.euw1.id
  cidr_block        = local.euw1_subnets.private_a
  availability_zone = data.aws_availability_zones.euw1.names[0]
  tags              = merge(local.base_tags, { Name = "${local.name.euw1}-private-a", Tier = "private" })
}

resource "aws_subnet" "euw1_private_b" {
  provider          = aws.euw1
  vpc_id            = aws_vpc.euw1.id
  cidr_block        = local.euw1_subnets.private_b
  availability_zone = data.aws_availability_zones.euw1.names[1]
  tags              = merge(local.base_tags, { Name = "${local.name.euw1}-private-b", Tier = "private" })
}

resource "aws_eip" "euw1_nat" {
  provider = aws.euw1
  domain   = "vpc"
  tags     = merge(local.base_tags, { Name = "${local.name.euw1}-nat-eip" })
}

resource "aws_nat_gateway" "euw1" {
  provider      = aws.euw1
  allocation_id = aws_eip.euw1_nat.id
  subnet_id     = aws_subnet.euw1_public_a.id
  tags          = merge(local.base_tags, { Name = "${local.name.euw1}-nat" })
}

# --- EUW1 PUBLIC ROUTE TABLES: one per subnet (fixes pcx routes per-subnet) ---

resource "aws_route_table" "euw1_public_a" {
  provider = aws.euw1
  vpc_id   = aws_vpc.euw1.id
  tags     = merge(local.base_tags, { Name = "${local.name.euw1}-rt-public-a" })
}

resource "aws_route" "euw1_public_a_igw" {
  provider               = aws.euw1
  route_table_id         = aws_route_table.euw1_public_a.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.euw1.id
}

resource "aws_route_table" "euw1_public_b" {
  provider = aws.euw1
  vpc_id   = aws_vpc.euw1.id
  tags     = merge(local.base_tags, { Name = "${local.name.euw1}-rt-public-b" })
}

resource "aws_route" "euw1_public_b_igw" {
  provider               = aws.euw1
  route_table_id         = aws_route_table.euw1_public_b.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.euw1.id
}

resource "aws_route_table_association" "euw1_public_a" {
  provider       = aws.euw1
  subnet_id      = aws_subnet.euw1_public_a.id
  route_table_id = aws_route_table.euw1_public_a.id
}

resource "aws_route_table_association" "euw1_public_b" {
  provider       = aws.euw1
  subnet_id      = aws_subnet.euw1_public_b.id
  route_table_id = aws_route_table.euw1_public_b.id
}

# --- EUW1 PRIVATE ROUTE TABLES (unchanged) ---

resource "aws_route_table" "euw1_private_a" {
  provider = aws.euw1
  vpc_id   = aws_vpc.euw1.id
  tags     = merge(local.base_tags, { Name = "${local.name.euw1}-rt-private-a" })
}

resource "aws_route" "euw1_private_a_nat" {
  provider               = aws.euw1
  route_table_id         = aws_route_table.euw1_private_a.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.euw1.id
}

resource "aws_route_table_association" "euw1_private_a" {
  provider       = aws.euw1
  subnet_id      = aws_subnet.euw1_private_a.id
  route_table_id = aws_route_table.euw1_private_a.id
}

resource "aws_route_table" "euw1_private_b" {
  provider = aws.euw1
  vpc_id   = aws_vpc.euw1.id
  tags     = merge(local.base_tags, { Name = "${local.name.euw1}-rt-private-b" })
}

resource "aws_route" "euw1_private_b_nat" {
  provider               = aws.euw1
  route_table_id         = aws_route_table.euw1_private_b.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.euw1.id
}

resource "aws_route_table_association" "euw1_private_b" {
  provider       = aws.euw1
  subnet_id      = aws_subnet.euw1_private_b.id
  route_table_id = aws_route_table.euw1_private_b.id
}

# --- EUW1 MAIN ROUTE TABLE: include pcx route so any current/future subnets pass posture checks ---
resource "aws_route_table" "euw1_main" {
  provider = aws.euw1
  vpc_id   = aws_vpc.euw1.id
  tags     = merge(local.base_tags, { Name = "${local.name.euw1}-rt-main" })
}

# Make it the VPC's main route table (replaces the implicit default main RT)
resource "aws_main_route_table_association" "euw1_main_assoc" {
  provider       = aws.euw1
  vpc_id         = aws_vpc.euw1.id
  route_table_id = aws_route_table.euw1_main.id
}

# Ensure the main RT also has a pcx route to the peer CIDR
resource "aws_route" "euw1_main_to_use1_pcx" {
  provider                  = aws.euw1
  route_table_id            = aws_route_table.euw1_main.id
  destination_cidr_block    = var.use1_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.use1_to_euw1.id
  depends_on                = [aws_vpc_peering_connection_accepter.euw1_accept]
}

#############################################
# VPC PEERING: us-east-1 <-> eu-west-1
#############################################

resource "aws_vpc_peering_connection" "use1_to_euw1" {
  provider    = aws.use1
  vpc_id      = aws_vpc.use1.id
  peer_vpc_id = aws_vpc.euw1.id
  peer_region = "eu-west-1"
  tags        = merge(local.base_tags, { Name = "${local.name.use1}-to-${local.name.euw1}-pcx" })
}

data "aws_vpc_peering_connection" "pcx_in_euw1" {
  provider = aws.euw1
  id       = aws_vpc_peering_connection.use1_to_euw1.id
}

resource "aws_vpc_peering_connection_accepter" "euw1_accept" {
  provider                  = aws.euw1
  vpc_peering_connection_id = aws_vpc_peering_connection.use1_to_euw1.id
  auto_accept               = true
  tags                      = merge(local.base_tags, { Name = "${local.name.use1}-to-${local.name.euw1}-pcx-accept" })
}

resource "aws_route" "use1_public_to_euw1_pcx" {
  provider                  = aws.use1
  route_table_id            = aws_route_table.use1_public.id
  destination_cidr_block    = var.euw1_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.use1_to_euw1.id
  depends_on                = [aws_vpc_peering_connection_accepter.euw1_accept]
}

resource "aws_route" "use1_private_a_to_euw1_pcx" {
  provider                  = aws.use1
  route_table_id            = aws_route_table.use1_private_a.id
  destination_cidr_block    = var.euw1_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.use1_to_euw1.id
  depends_on                = [aws_vpc_peering_connection_accepter.euw1_accept]
}

resource "aws_route" "use1_private_b_to_euw1_pcx" {
  provider                  = aws.use1
  route_table_id            = aws_route_table.use1_private_b.id
  destination_cidr_block    = var.euw1_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.use1_to_euw1.id
  depends_on                = [aws_vpc_peering_connection_accepter.euw1_accept]
}

# EUW1 → USE1 PCX routes: now per EU public subnet + private subnets
resource "aws_route" "euw1_public_a_to_use1_pcx" {
  provider                  = aws.euw1
  route_table_id            = aws_route_table.euw1_public_a.id
  destination_cidr_block    = var.use1_cidr
  vpc_peering_connection_id = data.aws_vpc_peering_connection.pcx_in_euw1.id
  depends_on                = [aws_vpc_peering_connection_accepter.euw1_accept]
}

resource "aws_route" "euw1_public_b_to_use1_pcx" {
  provider                  = aws.euw1
  route_table_id            = aws_route_table.euw1_public_b.id
  destination_cidr_block    = var.use1_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.use1_to_euw1.id
  depends_on                = [aws_vpc_peering_connection_accepter.euw1_accept]
}

resource "aws_route" "euw1_private_a_to_use1_pcx" {
  provider                  = aws.euw1
  route_table_id            = aws_route_table.euw1_private_a.id
  destination_cidr_block    = var.use1_cidr
  vpc_peering_connection_id = data.aws_vpc_peering_connection.pcx_in_euw1.id
  depends_on                = [aws_vpc_peering_connection_accepter.euw1_accept]
}

resource "aws_route" "euw1_private_b_to_use1_pcx" {
  provider                  = aws.euw1
  route_table_id            = aws_route_table.euw1_private_b.id
  destination_cidr_block    = var.use1_cidr
  vpc_peering_connection_id = data.aws_vpc_peering_connection.pcx_in_euw1.id
  depends_on                = [aws_vpc_peering_connection_accepter.euw1_accept]
}

#############################################
# SECURITY GROUPS
#############################################

resource "aws_security_group" "use1_alb_https" {
  provider    = aws.use1
  name        = "${local.name.use1}-alb-https"
  description = "ALB security group allowing inbound 443 only (temporarily HTTP in tests)."
  vpc_id      = aws_vpc.use1.id
  tags        = merge(local.base_tags, { Name = "${local.name.use1}-alb-https" })
}

resource "aws_vpc_security_group_ingress_rule" "use1_alb_http_80" {
  provider          = aws.use1
  security_group_id = aws_security_group.use1_alb_https.id
  description       = "TEMP: Allow HTTP from anywhere (no ACM yet)."
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "use1_alb_all_egress" {
  provider          = aws.use1
  security_group_id = aws_security_group.use1_alb_https.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow all egress."
}

resource "aws_security_group" "use1_app" {
  provider    = aws.use1
  name        = "${local.name.use1}-app"
  description = "App instances in private subnets; allow 80/tcp from ALB only."
  vpc_id      = aws_vpc.use1.id
  tags        = merge(local.base_tags, { Name = "${local.name.use1}-app" })
}

resource "aws_vpc_security_group_ingress_rule" "use1_app_http_from_alb" {
  provider                     = aws.use1
  security_group_id            = aws_security_group.use1_app.id
  referenced_security_group_id = aws_security_group.use1_alb_https.id
  from_port                    = 80
  to_port                      = 80
  ip_protocol                  = "tcp"
  description                  = "Allow HTTP from ALB to instances."
}

resource "aws_vpc_security_group_egress_rule" "use1_app_all_egress" {
  provider          = aws.use1
  security_group_id = aws_security_group.use1_app.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow all egress."
}

resource "aws_security_group" "use1_rds" {
  provider    = aws.use1
  name        = "${local.name.use1}-rds"
  description = "RDS in private subnets; allow 5432 from app instances only."
  vpc_id      = aws_vpc.use1.id
  tags        = merge(local.base_tags, { Name = "${local.name.use1}-rds" })
}

resource "aws_vpc_security_group_ingress_rule" "use1_rds_5432_from_app" {
  provider                     = aws.use1
  security_group_id            = aws_security_group.use1_rds.id
  referenced_security_group_id = aws_security_group.use1_app.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Allow Postgres from app instances."
}

resource "aws_vpc_security_group_egress_rule" "use1_rds_all_egress" {
  provider          = aws.use1
  security_group_id = aws_security_group.use1_rds.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow all egress."
}

# World-HTTP web SG for public EC2 used by tests
resource "aws_security_group" "use1_web" {
  provider    = aws.use1
  name        = "${local.name.use1}-web"
  description = "World-HTTP web SG for public EC2 (no SSH)."
  vpc_id      = aws_vpc.use1.id
  tags        = merge(local.base_tags, { Name = "${local.name.use1}-web" })
}

resource "aws_vpc_security_group_ingress_rule" "use1_web_http_world" {
  provider          = aws.use1
  security_group_id = aws_security_group.use1_web.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  description       = "Allow HTTP 80 from the world."
}

resource "aws_vpc_security_group_egress_rule" "use1_web_all_egress" {
  provider          = aws.use1
  security_group_id = aws_security_group.use1_web.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow all egress."
}

#############################################
# IAM — APPLICATION INSTANCE ROLE (EC2 READ-ONLY + SSM + CW Agent)
#############################################

resource "aws_iam_role" "app_role" {
  name               = "cloud-setup-${var.env}-app-role"
  assume_role_policy = data.aws_iam_policy_document.app_assume.json
  tags               = local.base_tags
}

data "aws_iam_policy_document" "app_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "app_role_ec2_readonly" {
  role       = aws_iam_role.app_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "app_role_ssm_core" {
  role       = aws_iam_role.app_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "app_role_cw_agent" {
  role       = aws_iam_role.app_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "app_profile" {
  name = "cloud-setup-${var.env}-app-profile"
  role = aws_iam_role.app_role.name
  tags = local.base_tags
}

#############################################
# CLOUDWATCH LOGS (CENTRALIZED LOGGING) — us-east-1
#############################################

resource "aws_cloudwatch_log_group" "use1_app" {
  provider          = aws.use1
  name              = "/cloud-setup/${var.env}/app"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.use1_logs.arn
  tags              = local.base_tags
}

#############################################
# EC2 — PUBLIC INSTANCE FOR TESTS (IMDSv2 + SSM + NGINX)
#############################################

locals {
  uploads_bucket_name = (
    var.s3_upload_bucket_name != "" ?
    var.s3_upload_bucket_name :
    "cloud-setup-${var.env}-${data.aws_caller_identity.current.account_id}-uploads"
  )

    user_data_use1 = templatefile("${path.module}/user_data/web.sh", {
    # lowercase keys (if referenced)
    environment = var.env
    log_level   = "info"
    bucket      = aws_s3_bucket.uploads.bucket

    # UPPERCASE keys (fixes your current error)
    ENVIRONMENT = var.env
    LOG_LEVEL   = "info"
    BUCKET      = aws_s3_bucket.uploads.bucket
  })
}

resource "aws_instance" "use1_web" {
  provider                    = aws.use1
  ami                         = data.aws_ssm_parameter.al2023_ami_use1.value
  instance_type               = var.web_instance_type
  subnet_id                   = aws_subnet.use1_public_a.id
  vpc_security_group_ids      = [aws_security_group.use1_web.id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.app_profile.name
  user_data                   = local.user_data_use1

  metadata_options {
    http_tokens = "required"
  }

  monitoring = true

  tags = merge(local.base_tags, { Name = "${local.name.use1}-web-ec2" })
}

############################################
#ASG + ALB (PRIVATE APP TIER) — kept for posture tests
############################################

resource "aws_launch_template" "use1_app" {
  provider               = aws.use1
  name_prefix            = "${local.name.use1}-lt-"
  image_id               = data.aws_ssm_parameter.al2023_ami_use1.value
  instance_type          = var.web_instance_type
  update_default_version = true

  iam_instance_profile {
    name = aws_iam_instance_profile.app_profile.name
  }

  metadata_options {
    http_tokens = "required"
  }

  monitoring {
    enabled = true
  }

  vpc_security_group_ids = [
    aws_security_group.use1_app.id
  ]

  user_data = base64encode(local.user_data_use1)

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.base_tags, { Name = "${local.name.use1}-app" })
  }

  tag_specifications {
    resource_type = "volume"
    tags          = local.base_tags
  }

  tags = local.base_tags
}

resource "aws_autoscaling_group" "use1_app" {
  provider                  = aws.use1
  name                      = "${local.name.use1}-asg"
  max_size                  = 2
  min_size                  = 1
  desired_capacity          = 1
  health_check_type         = "ELB"
  health_check_grace_period = 300
  vpc_zone_identifier       = [aws_subnet.use1_private_a.id, aws_subnet.use1_private_b.id]
  capacity_rebalance        = true
  wait_for_capacity_timeout = "10m"

  launch_template {
    id      = aws_launch_template.use1_app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name.use1}-app"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

#############################################
# SSM RELIABILITY — VPC INTERFACE ENDPOINTS (us-east-1)
#############################################

resource "aws_security_group" "use1_vpce_tls" {
  provider    = aws.use1
  name        = "${local.name.use1}-vpce-tls"
  description = "TLS 443 from VPC to Interface Endpoints"
  vpc_id      = aws_vpc.use1.id
  tags        = merge(local.base_tags, { Name = "${local.name.use1}-vpce-tls" })
}

resource "aws_vpc_security_group_ingress_rule" "use1_vpce_tls_ingress" {
  provider          = aws.use1
  security_group_id = aws_security_group.use1_vpce_tls.id
  cidr_ipv4         = var.use1_cidr
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "Allow TLS from VPC to endpoints"
}

resource "aws_vpc_security_group_egress_rule" "use1_vpce_tls_egress" {
  provider          = aws.use1
  security_group_id = aws_security_group.use1_vpce_tls.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Egress for endpoints"
}

resource "aws_vpc_endpoint" "use1_ssm" {
  provider            = aws.use1
  vpc_id              = aws_vpc.use1.id
  service_name        = "com.amazonaws.us-east-1.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.use1_private_a.id, aws_subnet.use1_private_b.id]
  security_group_ids  = [aws_security_group.use1_vpce_tls.id]
  private_dns_enabled = true
  tags                = merge(local.base_tags, { Name = "${local.name.use1}-vpce-ssm" })
}

resource "aws_vpc_endpoint" "use1_ssmmessages" {
  provider            = aws.use1
  vpc_id              = aws_vpc.use1.id
  service_name        = "com.amazonaws.us-east-1.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.use1_private_a.id, aws_subnet.use1_private_b.id]
  security_group_ids  = [aws_security_group.use1_vpce_tls.id]
  private_dns_enabled = true
  tags                = merge(local.base_tags, { Name = "${local.name.use1}-vpce-ssmmessages" })
}

resource "aws_vpc_endpoint" "use1_ec2messages" {
  provider            = aws.use1
  vpc_id              = aws_vpc.use1.id
  service_name        = "com.amazonaws.us-east-1.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.use1_private_a.id, aws_subnet.use1_private_b.id]
  security_group_ids  = [aws_security_group.use1_vpce_tls.id]
  private_dns_enabled = true
  tags                = merge(local.base_tags, { Name = "${local.name.use1}-vpce-ec2messages" })
}

#############################################
# ALB — TEMPORARY HTTP FRONTEND
#############################################

resource "aws_lb" "use1" {
  provider                   = aws.use1
  name                       = "${local.name.use1}-alb"
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.use1_alb_https.id]
  subnets                    = [aws_subnet.use1_public_a.id, aws_subnet.use1_public_b.id]
  idle_timeout               = 60
  enable_deletion_protection = false
  tags                       = merge(local.base_tags, { Name = "${local.name.use1}-alb" })
}

resource "aws_lb_target_group" "use1" {
  provider    = aws.use1
  name        = "${local.name.use1}-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.use1.id
  target_type = "instance"

  health_check {
    interval            = 15
    path                = "/alb.html"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200-399"
    protocol            = "HTTP"
    timeout             = 5
  }

  tags = local.base_tags
}

resource "aws_autoscaling_attachment" "use1_asg_tg" {
  provider               = aws.use1
  autoscaling_group_name = aws_autoscaling_group.use1_app.name
  lb_target_group_arn    = aws_lb_target_group.use1.arn
}

resource "aws_lb_listener" "use1_http" {
  provider          = aws.use1
  load_balancer_arn = aws_lb.use1.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.use1.arn
  }
}

#############################################
# API GATEWAY HTTP API (IAM AUTH) → ALB
#############################################

resource "aws_apigatewayv2_api" "http_api" {
  provider      = aws.use1
  name          = "cloud-setup-${var.env}-httpapi"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "alb_proxy" {
  provider               = aws.use1
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "GET"
  integration_uri        = "http://${aws_lb.use1.dns_name}"
  payload_format_version = "1.0"
  timeout_milliseconds   = 10000
}
resource "aws_apigatewayv2_route" "proxy_any" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "GET /{proxy+}"
  authorization_type = "AWS_IAM"
  target             = "integrations/${aws_apigatewayv2_integration.alb_proxy.id}"
}
resource "aws_apigatewayv2_route" "root_get" {
  provider           = aws.use1
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "GET /"
  authorization_type = "AWS_IAM"
  target             = "integrations/${aws_apigatewayv2_integration.alb_proxy.id}"
}

resource "aws_apigatewayv2_route" "ec2_get" {
  provider           = aws.use1
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "GET /ec2"
  authorization_type = "AWS_IAM"
  target             = "integrations/${aws_apigatewayv2_integration.alb_proxy.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  provider    = aws.use1
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
  tags        = local.base_tags
}

#############################################
# RDS — POSTGRES IN PRIVATE SUBNETS, SSE-KMS
#############################################

resource "aws_db_subnet_group" "use1" {
  provider   = aws.use1
  name       = "${local.name.use1}-db-subnets"
  subnet_ids = [aws_subnet.use1_private_a.id, aws_subnet.use1_private_b.id]
  tags       = merge(local.base_tags, { Name = "${local.name.use1}-db-subnets" })
}

resource "random_password" "rds_master" {
  length  = 16
  special = true
}

resource "aws_ssm_parameter" "rds_password" {
  provider = aws.use1
  name     = "/cloud-setup/${var.env}/rds/master_password"
  type     = "SecureString"
  key_id   = aws_kms_key.use1.arn
  value    = random_password.rds_master.result
  tags     = merge(local.base_tags, { Name = "${local.name.use1}-rds-password" })
}

output "rds_password_param_name" {
  value       = aws_ssm_parameter.rds_password.name
  description = "SSM SecureString name that stores the RDS master password."
}

output "rds_username" {
  value       = "dbadmin"
  description = "RDS master username."
}

data "aws_rds_engine_version" "pg" {
  provider           = aws.use1
  engine             = "postgres"
  preferred_versions = ["16.4", "16.3", "16.2", "15.6", "15.5", "16"]
}

resource "aws_db_instance" "use1" {
  provider               = aws.use1
  identifier             = "cloud-setup-${var.env}-db"
  engine                 = var.rds_engine
  engine_version         = data.aws_rds_engine_version.pg.version
  instance_class         = var.rds_instance_class
  allocated_storage      = var.rds_allocated_storage
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.use1.arn
  username               = "dbadmin"
  password               = random_password.rds_master.result
  db_subnet_group_name   = aws_db_subnet_group.use1.name
  vpc_security_group_ids = [aws_security_group.use1_rds.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  apply_immediately      = true

  tags = merge(local.base_tags, { Name = "${local.name.use1}-db" })
}

#############################################
# S3 — UPLOAD BUCKET (PRIVATE, VERSIONED, SSE-KMS) + LAMBDA TRIGGER
#############################################

resource "aws_s3_bucket" "uploads" {
  provider = aws.use1
  bucket   = local.uploads_bucket_name
  force_destroy = true
  tags     = merge(local.base_tags, { Name = "${local.name.use1}-uploads" })
}

resource "aws_s3_bucket_versioning" "uploads" {
  provider = aws.use1
  bucket   = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  provider = aws.use1
  bucket   = aws_s3_bucket.uploads.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.use1.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  provider                = aws.use1
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_iam_role_policy" "lambda_s3_inline" {
  name = "cloud-setup-${var.env}-lambda-s3"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid: "ListBucket",
        Effect: "Allow",
        Action: ["s3:ListBucket"],
        Resource: [aws_s3_bucket.uploads.arn]
      },
      {
        Sid: "ObjectRW",
        Effect: "Allow",
        Action: ["s3:PutObject","s3:GetObject"],
        Resource: ["${aws_s3_bucket.uploads.arn}/*"]
      },
      {
        Sid: "KmsForS3",
        Effect: "Allow",
        Action: ["kms:Encrypt","kms:Decrypt","kms:ReEncrypt*","kms:GenerateDataKey*","kms:DescribeKey"],
        Resource: aws_kms_key.use1.arn
      }
    ]
  })
}

data "aws_iam_policy_document" "uploads_policy" {
  # Keep TLS-only
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    resources = [
      aws_s3_bucket.uploads.arn,
      "${aws_s3_bucket.uploads.arn}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Allow Lambda role to list the bucket (bucket ARN only)
  statement {
    sid     = "AllowLambdaList"
    effect  = "Allow"
    actions = ["s3:ListBucket"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.lambda_role.arn]
    }
    resources = [aws_s3_bucket.uploads.arn]
  }

  # Allow Lambda role to read/write objects (object ARNs)
  statement {
    sid     = "AllowLambdaObjectRW"
    effect  = "Allow"
    actions = ["s3:PutObject","s3:GetObject"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.lambda_role.arn]
    }
    resources = ["${aws_s3_bucket.uploads.arn}/*"]
  }
}


resource "aws_s3_bucket_policy" "uploads" {
  provider = aws.use1
  bucket   = aws_s3_bucket.uploads.id
  policy   = data.aws_iam_policy_document.uploads_policy.json
}

#############################################
# LAMBDA — ON-UPLOAD (S3 EVENT) AND HEARTBEAT WRITER
#############################################

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_upload_handler.zip"

  source {
    content = <<-PY
      import json

      def handler(event, context):
          print("Received event:", json.dumps(event))
          return {"status": "ok"}
    PY
    filename = "index.py"
  }
}

resource "aws_iam_role" "lambda_role" {
  name               = "cloud-setup-${var.env}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.base_tags
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_policy_doc" {
  # CloudWatch Logs (Lambda runtime needs this)
  statement {
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["*"]
  }

  # S3 access for uploads bucket
  statement {
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.uploads.arn,
      "${aws_s3_bucket.uploads.arn}/*"
    ]
  }

  # KMS for bucket default encryption
  statement {
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
    #  "kms:GenerateDataKey",  # optional; not needed for simple PutObject with SSE-KMS
      "kms:GenerateDataKeyWithoutPlaintext",
      "kms:DescribeKey"
    ]
    resources = [aws_kms_key.use1.arn]
  }
}


resource "aws_iam_policy" "lambda_policy" {
  name   = "cloud-setup-${var.env}-lambda-policy"
  policy = data.aws_iam_policy_document.lambda_policy_doc.json
  tags   = local.base_tags
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}
# ===== ADD: attach AWS-managed basic execution policy (for completeness/logs)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
resource "aws_lambda_function" "on_upload" {
  provider         = aws.use1
  function_name    = "cloud-setup-${var.env}-on-upload"
  role             = aws_iam_role.lambda_role.arn
  runtime          = "python3.12"
  handler          = "index.handler"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = filebase64sha256(data.archive_file.lambda_zip.output_path)
  tags             = local.base_tags
}

# keep as-is but add depends_on
data "aws_lambda_invocation" "on_upload_warm" {
  provider      = aws.use1
  function_name = aws_lambda_function.on_upload.function_name
  input         = jsonencode({ "ping" = true })
  depends_on    = [
    aws_iam_role_policy_attachment.lambda_attach,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_s3_bucket_policy.uploads
  ]
}


resource "aws_lambda_permission" "allow_s3_invoke" {
  provider      = aws.use1
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.on_upload.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.uploads.arn
}

resource "aws_s3_bucket_notification" "uploads" {
  provider = aws.use1
  bucket   = aws_s3_bucket.uploads.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.on_upload.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = var.s3_upload_prefix
  }

  depends_on = [
    aws_lambda_permission.allow_s3_invoke
  ]
}

# Heartbeat lambda that writes to S3: heartbeats/<ts>.json
data "archive_file" "heartbeat_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_heartbeat.zip"

  source {
    content = <<-PY
      import json, os, time, boto3
      s3 = boto3.client('s3')
      def handler(event, context):
          bucket = os.environ.get('APP_BUCKET')
          ts = str(int(time.time()))
          key = f"heartbeats/{ts}.json"
          body = json.dumps({"ts": ts, "ok": True})
          s3.put_object(Bucket=bucket, Key=key, Body=body.encode('utf-8'))
          print("wrote", key)
          return {"key": key}
    PY
    filename = "index.py"
  }
}

resource "aws_lambda_function" "heartbeat" {
  provider         = aws.use1
  function_name    = "cloud-setup-${var.env}-heartbeat"
  role             = aws_iam_role.lambda_role.arn
  runtime          = "python3.12"
  handler          = "index.handler"
  filename         = data.archive_file.heartbeat_zip.output_path
  source_code_hash = filebase64sha256(data.archive_file.heartbeat_zip.output_path)

  environment {
    variables = {
      APP_BUCKET = aws_s3_bucket.uploads.bucket
    }
  }

  tags = local.base_tags
}

# Explicit KMS grant to Lambda role for the uploads CMK
resource "aws_kms_grant" "lambda_upload_kms" {
  provider          = aws.use1
  name              = "cloud-setup-${var.env}-lambda-kms-grant"
  key_id            = aws_kms_key.use1.key_id
  grantee_principal = aws_iam_role.lambda_role.arn

  operations = [
    "GenerateDataKey",
    "GenerateDataKeyWithoutPlaintext",
    "Encrypt",
    "Decrypt",
    "ReEncryptFrom",
    "ReEncryptTo",
    "DescribeKey"
  ]

  depends_on = [aws_iam_role_policy_attachment.lambda_attach]
}
resource "time_sleep" "iam_propagation" {
  create_duration = "20s"
  depends_on = [
    aws_iam_role_policy.lambda_s3_inline,
    aws_iam_role_policy_attachment.lambda_basic,
  ]
}

data "aws_lambda_invocation" "heartbeat_warm" {
  provider      = aws.use1
  function_name = aws_lambda_function.heartbeat.function_name
  input         = jsonencode({ warm = true })
  depends_on    = [time_sleep.iam_propagation, aws_s3_bucket_policy.uploads]
}

#############################################
# CLOUDFRONT — TEMP: NO ALIASES/CERT (HTTP TO ALB)
#############################################

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront for ${local.name.use1}"
  default_root_object = "index.html"

  origin {
    domain_name = aws_lb.use1.dns_name
    origin_id   = "alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "alb-origin"
    viewer_protocol_policy = "allow-all"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = local.base_tags
}

#############################################
# ROUTE53 — TEMP: POINT DOMAIN DIRECTLY TO ALB
#############################################

resource "aws_route53_record" "app_alias_alb" {
  count   = (var.domain_name != "" && var.hosted_zone_id != "") ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.use1.dns_name
    zone_id                = aws_lb.use1.zone_id
    evaluate_target_health = false
  }
}

#############################################
# CLOUDTRAIL — MULTI-REGION WITH ENCRYPTED, TLS-ONLY BUCKET
#############################################

resource "aws_s3_bucket" "cloudtrail" {
  provider = aws.use1
  bucket   = "cloud-setup-${var.env}-${data.aws_caller_identity.current.account_id}-trail"
  force_destroy = true
  tags     = merge(local.base_tags, { Name = "${local.name.use1}-trail" })
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  provider = aws.use1
  bucket   = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  provider = aws.use1
  bucket   = aws_s3_bucket.cloudtrail.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  provider                = aws.use1
  bucket                  = aws_s3_bucket.cloudtrail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "cloudtrail_tls_only" {
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    resources = [
      aws_s3_bucket.cloudtrail.arn,
      "${aws_s3_bucket.cloudtrail.arn}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid     = "AllowCloudTrailGetBucketAcl"
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [
      aws_s3_bucket.cloudtrail.arn
    ]
  }

  statement {
    sid     = "AllowCloudTrailPutObject"
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["s3:PutObject"]
    resources = [
      "${aws_s3_bucket.cloudtrail.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
    ]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  provider = aws.use1
  bucket   = aws_s3_bucket.cloudtrail.id
  policy   = data.aws_iam_policy_document.cloudtrail_tls_only.json
}

resource "aws_cloudtrail" "main" {
  provider                      = aws.use1
  name                          = "cloud-setup-${var.env}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.bucket
  is_multi_region_trail         = true
  include_global_service_events = true
  enable_log_file_validation    = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }
  depends_on = [aws_s3_bucket_policy.cloudtrail]
  tags = local.base_tags
}

#############################################
# CLOUDWATCH ALARMS (EC2 CPU > 70%) + SNS
#############################################

resource "aws_sns_topic" "use1_alarms" {
  provider = aws.use1
  name     = "cloud-setup-${var.env}-alarms"
  tags     = local.base_tags
}

resource "aws_cloudwatch_metric_alarm" "use1_asg_cpu_high" {
  provider                  = aws.use1
  alarm_name                = "cloud-setup-${var.env}-asg-cpu-high"
  comparison_operator       = "GreaterThanThreshold"
  evaluation_periods        = 2
  period                    = 300
  metric_name               = "CPUUtilization"
  namespace                 = "AWS/EC2"
  statistic                 = "Average"
  threshold                 = 70
  treat_missing_data        = "notBreaching"
  alarm_description         = "Average CPU over 70% for 10 minutes."
  alarm_actions             = [aws_sns_topic.use1_alarms.arn]
  ok_actions                = [aws_sns_topic.use1_alarms.arn]
  insufficient_data_actions = []

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.use1_app.name
  }

  tags = local.base_tags
}

resource "aws_s3_bucket_ownership_controls" "uploads" {
  provider = aws.use1
  bucket   = aws_s3_bucket.uploads.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

#############################################
# OUTPUTS — USED BY INTEGRATION TESTS
#############################################

output "use1_vpc_id" {
  value       = aws_vpc.use1.id
  description = "VPC ID in us-east-1."
}

output "euw1_vpc_id" {
  value       = aws_vpc.euw1.id
  description = "VPC ID in eu-west-1."
}

output "use1_public_subnet_ids" {
  value       = [aws_subnet.use1_public_a.id, aws_subnet.use1_public_b.id]
  description = "Public subnet IDs in us-east-1."
}

output "use1_private_subnet_ids" {
  value       = [aws_subnet.use1_private_a.id, aws_subnet.use1_private_b.id]
  description = "Private subnet IDs in us-east-1."
}

output "euw1_public_subnet_ids" {
  value       = [aws_subnet.euw1_public_a.id, aws_subnet.euw1_public_b.id]
  description = "Public subnet IDs in eu-west-1."
}

output "euw1_private_subnet_ids" {
  value       = [aws_subnet.euw1_private_a.id, aws_subnet.euw1_private_b.id]
  description = "Private subnet IDs in eu-west-1."
}

output "use1_kms_key_arn" {
  value       = aws_kms_key.use1.arn
  description = "KMS CMK ARN in us-east-1."
}

output "euw1_kms_key_arn" {
  value       = aws_kms_key.euw1.arn
  description = "KMS CMK ARN in eu-west-1."
}

output "upload_bucket_name" {
  value       = aws_s3_bucket.uploads.bucket
  description = "S3 uploads bucket name."
}

output "lambda_on_upload_name" {
  value       = aws_lambda_function.on_upload.function_name
  description = "Lambda function name for S3 upload events."
}

output "lambda_on_upload_arn" {
  value       = aws_lambda_function.on_upload.arn
  description = "Lambda function ARN for S3 upload events."
}

output "lambda_heartbeat_name" {
  value       = aws_lambda_function.heartbeat.function_name
  description = "Lambda heartbeat function name (writes to S3)."
}

output "alb_arn" {
  value       = aws_lb.use1.arn
  description = "ALB ARN in us-east-1."
}

output "alb_dns_name" {
  value       = aws_lb.use1.dns_name
  description = "ALB DNS name in us-east-1."
}

output "api_invoke_url" {
  value       = aws_apigatewayv2_api.http_api.api_endpoint
  description = "API Gateway invoke URL (IAM protected)."
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.cdn.domain_name
  description = "CloudFront distribution domain."
}

output "rds_endpoint" {
  value       = aws_db_instance.use1.address
  description = "RDS endpoint address."
}

output "rds_port" {
  value       = aws_db_instance.use1.port
  description = "RDS port."
}

output "app_role_name" {
  value       = aws_iam_role.app_role.name
  description = "Application EC2 role name."
}

output "app_role_arn" {
  value       = aws_iam_role.app_role.arn
  description = "Application EC2 role ARN."
}

output "sns_alarms_topic_arn" {
  value       = aws_sns_topic.use1_alarms.arn
  description = "SNS topic ARN for alarms."
}

output "cw_log_group_use1" {
  value       = aws_cloudwatch_log_group.use1_app.name
  description = "CloudWatch Log Group for app logs (us-east-1)."
}

output "use1_cidr" {
  value       = var.use1_cidr
  description = "CIDR for the us-east-1 VPC."
}

output "euw1_cidr" {
  value       = var.euw1_cidr
  description = "CIDR for the eu-west-1 VPC."
}

output "web_sg_id" {
  value       = aws_security_group.use1_web.id
  description = "Security Group ID used by the public web EC2 instances."
}

output "ec2_instance_id" {
  value       = aws_instance.use1_web.id
  description = "Public EC2 instance ID used by tests."
}

output "ec2_public_ip" {
  value       = aws_instance.use1_web.public_ip
  description = "Public EC2 instance IP used by tests."
}

output "cloudtrail_bucket_name" {
  value       = aws_s3_bucket.cloudtrail.bucket
  description = "CloudTrail delivery S3 bucket."
}

output "alb_target_group_arn" {
  value       = aws_lb_target_group.use1.arn
  description = "ALB target group ARN for health checks."
}
