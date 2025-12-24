# =============================================================================
# Production-Ready EKS Cluster - Main Network Infrastructure
# =============================================================================
#
# This file defines the core networking infrastructure for a production EKS cluster
# designed for containerized microservices workloads.
#
# Architecture Overview:
# - Multi-AZ deployment across 3 availability zones for high availability
# - Public subnets: Host load balancers and NAT gateways for internet-facing traffic
# - Private subnets: Host EKS worker nodes and Fargate pods for security
# - NAT Gateways: One per AZ for redundancy and high availability
# - VPC Endpoints: Reduce NAT Gateway costs and improve security by keeping traffic within AWS network
#
# =============================================================================

# =============================================================================
# AWS Provider Configuration
# =============================================================================
# =============================================================================
# Data Sources - Discover AWS infrastructure information
# =============================================================================
#
# Fetch available AZs in the current region to ensure multi-AZ deployment

  region = var.aws_region

  default_tags {
    tags = merge(
      var.tags,
      {
        EnvironmentSuffix = var.environment_suffix
      }
# =============================================================================
# VPC Configuration - Foundation for all networking
# =============================================================================
#
# Create a dedicated VPC for EKS cluster isolation.
# DNS hostnames and support are required for EKS to function properly.
# The kubernetes.io/cluster tag allows EKS to identify VPC resources.
    )
  }
}

# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC for EKS cluster
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                                                  = "eks-vpc-${var.environment_suffix}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
  }
}
# =============================================================================
# Internet Gateway - Enables outbound internet access for public subnets
# =============================================================================

# Internet Gateway for public subnets
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "eks-igw-${var.environment_suffix}"
  }
}

# Public subnets for load balancers (3 AZs)
resource "aws_subnet" "public" {
  count = 3
# =============================================================================
# Public Subnets - For load balancers and NAT gateways
# =============================================================================
#
# Create 3 public subnets across different AZs for high availability.
# These subnets host ALBs and NAT Gateways, providing internet access.
# The kubernetes.io/role/elb tag allows ALB Ingress Controller to discover subnets.

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                                                  = "eks-public-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/elb"                                              = "1"
  }
}

# Private subnets for worker nodes (3 AZs)
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                                                  = "eks-private-subnet-${count.index + 1}-${var.environment_suffix}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}" = "shared"
    "kubernetes.io/role/internal-elb"                                     = "1"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 3

  domain = "vpc"

  tags = {
    Name = "eks-nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways for private subnet outbound traffic (one per AZ)
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "eks-nat-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "eks-public-rt-${var.environment_suffix}"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route tables for private subnets (one per AZ)
resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "eks-private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

# Associate private subnets with their respective route tables
resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# NOTE: VPC Flow Logs disabled for LocalStack compatibility
# LocalStack does not properly support VPC Flow Logs
# VPC Flow Logs for network monitoring
# resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
#   name              = "/aws/vpc/flowlogs-${var.environment_suffix}"
#   retention_in_days = 7
#
#   tags = {
#     Name = "eks-vpc-flowlogs-${var.environment_suffix}"
#   }
# }
#
# resource "aws_iam_role" "vpc_flow_logs" {
#   name = "vpc-flow-logs-role-${var.environment_suffix}"
#
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = "sts:AssumeRole"
#         Effect = "Allow"
#         Principal = {
#           Service = "vpc-flow-logs.amazonaws.com"
#         }
#       }
#     ]
#   })
# }
#
# resource "aws_iam_role_policy" "vpc_flow_logs" {
#   name = "vpc-flow-logs-policy-${var.environment_suffix}"
#   role = aws_iam_role.vpc_flow_logs.id
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = [
#           "logs:CreateLogGroup",
#           "logs:CreateLogStream",
#           "logs:PutLogEvents",
#           "logs:DescribeLogGroups",
#           "logs:DescribeLogStreams"
#         ]
#         Effect   = "Allow"
#         Resource = "*"
#       }
#     ]
#   })
# }
#
# resource "aws_flow_log" "main" {
#   iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
#   log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
#   traffic_type    = "ALL"
#   vpc_id          = aws_vpc.main.id
#
#   tags = {
#     Name = "eks-vpc-flowlog-${var.environment_suffix}"
#   }
# }
