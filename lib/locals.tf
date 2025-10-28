# locals.tf - Local values and computed configurations

locals {
  # Naming convention with region suffix
  name_prefix = "${var.project_name}-${var.environment}-${var.aws_region}"

  # Common tags for all resources
  common_tags = merge(
    {
      Environment = var.environment
      Project     = var.project_name
      Region      = var.aws_region
      ManagedBy   = "terraform"
      CreatedAt   = formatdate("YYYY-MM-DD", timestamp())
    },
    var.additional_tags
  )

  # VPC configuration
  vpc_name = "${local.name_prefix}-vpc"

  # Availability zone configuration
  az_count = var.availability_zones_count

  # CIDR calculations for subnets
  # VPC CIDR: 10.0.0.0/20 provides 4096 IP addresses
  # Public subnets: /26 (64 IPs each) - 10.0.0.0/26, 10.0.0.64/26, 10.0.0.128/26
  # Private subnets: /24 (256 IPs each) - 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24

  public_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 6, 0),   # 10.0.0.0/26
    cidrsubnet(var.vpc_cidr, 6, 1),   # 10.0.0.64/26
    cidrsubnet(var.vpc_cidr, 6, 2),   # 10.0.0.128/26
  ]

  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 4, 1),   # 10.0.1.0/24
    cidrsubnet(var.vpc_cidr, 4, 2),   # 10.0.2.0/24
    cidrsubnet(var.vpc_cidr, 4, 3),   # 10.0.3.0/24
  ]

  # Subnet names
  public_subnet_names = [
    for i in range(local.az_count) : "${local.name_prefix}-${var.public_subnet_suffix}-${i + 1}"
  ]

  private_subnet_names = [
    for i in range(local.az_count) : "${local.name_prefix}-${var.private_subnet_suffix}-${i + 1}"
  ]

  # Internet Gateway name
  igw_name = "${local.name_prefix}-igw"

  # NAT Gateway configuration
  nat_gateway_name = "${local.name_prefix}-nat"
  nat_eip_name     = "${local.name_prefix}-nat-eip"

  # Route table names
  public_route_table_name  = "${local.name_prefix}-public-rt"
  private_route_table_names = [
    for i in range(local.az_count) : "${local.name_prefix}-${var.private_subnet_suffix}-rt-${i + 1}"
  ]

  # DHCP options set name
  dhcp_options_name = "${local.name_prefix}-dhcp"

  # VPC Flow Logs configuration
  flow_logs_name           = "${local.name_prefix}-flow-logs"
  flow_logs_log_group_name = "/aws/vpc/flowlogs/${local.name_prefix}"
  flow_logs_role_name      = "${local.name_prefix}-flow-logs-role"
  flow_logs_policy_name    = "${local.name_prefix}-flow-logs-policy"

  # Security group for VPC endpoints (if needed in future)
  vpc_endpoint_sg_name = "${local.name_prefix}-vpc-endpoints-sg"
}