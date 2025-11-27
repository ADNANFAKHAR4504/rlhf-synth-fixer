# Main Terraform configuration for ECS Fargate Optimization
# This file contains the core networking and ECS cluster resources

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name       = "ecs-vpc-${var.environment_suffix}"
    Service    = "networking"
    CostCenter = "infrastructure"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name       = "ecs-igw-${var.environment_suffix}"
    Service    = "networking"
    CostCenter = "infrastructure"
  }
}

# Public Subnets (for ALB)
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name       = "ecs-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type       = "public"
    Service    = "networking"
    CostCenter = "infrastructure"
  }
}

# Private Subnets (for ECS tasks)
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name       = "ecs-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type       = "private"
    Service    = "networking"
    CostCenter = "infrastructure"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name       = "ecs-public-rt-${var.environment_suffix}"
    Service    = "networking"
    CostCenter = "infrastructure"
  }
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# VPC Endpoint for ECR API (to avoid NAT Gateway costs)
resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name       = "ecr-api-endpoint-${var.environment_suffix}"
    Service    = "ecr"
    CostCenter = "infrastructure"
  }
}

# VPC Endpoint for ECR DKR
resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name       = "ecr-dkr-endpoint-${var.environment_suffix}"
    Service    = "ecr"
    CostCenter = "infrastructure"
  }
}

# VPC Endpoint for S3 (Gateway endpoint - no cost)
resource "aws_vpc_endpoint" "s3" {
  vpc_id          = aws_vpc.main.id
  service_name    = "com.amazonaws.${var.aws_region}.s3"
  route_table_ids = [aws_route_table.private.id]

  tags = {
    Name       = "s3-endpoint-${var.environment_suffix}"
    Service    = "s3"
    CostCenter = "infrastructure"
  }
}

# VPC Endpoint for CloudWatch Logs
resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name       = "logs-endpoint-${var.environment_suffix}"
    Service    = "cloudwatch"
    CostCenter = "infrastructure"
  }
}

# Route Table for Private Subnets (no NAT Gateway for cost optimization)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name       = "ecs-private-rt-${var.environment_suffix}"
    Service    = "networking"
    CostCenter = "infrastructure"
  }
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "vpc-endpoints-${var.environment_suffix}-"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name       = "vpc-endpoints-sg-${var.environment_suffix}"
    Service    = "networking"
    CostCenter = "infrastructure"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "alb-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name       = "alb-sg-${var.environment_suffix}"
    Service    = "alb"
    CostCenter = "infrastructure"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "ecs-tasks-${var.environment_suffix}-"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "Traffic from VPC"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name       = "ecs-tasks-sg-${var.environment_suffix}"
    Service    = "ecs"
    CostCenter = "infrastructure"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ECS Cluster with Container Insights enabled
resource "aws_ecs_cluster" "main" {
  name = "optimized-cluster-${var.environment_suffix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name       = "optimized-cluster-${var.environment_suffix}"
    Service    = "ecs"
    CostCenter = "infrastructure"
  }
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

# CloudWatch Log Groups with proper retention
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/api-${var.environment_suffix}"
  retention_in_days = var.environment_suffix == "prod" ? 30 : 7

  tags = {
    Name       = "api-logs-${var.environment_suffix}"
    Service    = "api"
    CostCenter = "infrastructure"
  }
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/worker-${var.environment_suffix}"
  retention_in_days = var.environment_suffix == "prod" ? 30 : 7

  tags = {
    Name       = "worker-logs-${var.environment_suffix}"
    Service    = "worker"
    CostCenter = "infrastructure"
  }
}

resource "aws_cloudwatch_log_group" "scheduler" {
  name              = "/ecs/scheduler-${var.environment_suffix}"
  retention_in_days = var.environment_suffix == "prod" ? 30 : 7

  tags = {
    Name       = "scheduler-logs-${var.environment_suffix}"
    Service    = "scheduler"
    CostCenter = "infrastructure"
  }
}

# Service Discovery Namespace
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "ecs.local"
  description = "Private DNS namespace for ECS services"
  vpc         = aws_vpc.main.id

  tags = {
    Name       = "ecs-discovery-${var.environment_suffix}"
    Service    = "service-discovery"
    CostCenter = "infrastructure"
  }
}
