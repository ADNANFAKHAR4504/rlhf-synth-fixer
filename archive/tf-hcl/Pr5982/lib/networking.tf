# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "vpc-${var.environment_suffix}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "igw-${var.environment_suffix}"
    }
  )
}

# Public Subnets (for ALB)
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "public-subnet-${var.environment_suffix}-${count.index + 1}"
      Tier = "public"
    }
  )
}

# Private Subnets for Application
resource "aws_subnet" "private_app" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "private-app-subnet-${var.environment_suffix}-${count.index + 1}"
      Tier = "private-app"
    }
  )
}

# Private Subnets for Database
resource "aws_subnet" "private_db" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "private-db-subnet-${var.environment_suffix}-${count.index + 1}"
      Tier = "private-db"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 3

  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "nat-eip-${var.environment_suffix}-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "nat-${var.environment_suffix}-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "public-rt-${var.environment_suffix}"
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  # Route to on-premises via Direct Connect
  dynamic "route" {
    for_each = var.direct_connect_gateway_id != "" ? [1] : []
    content {
      cidr_block = var.onprem_cidr
      gateway_id = var.direct_connect_gateway_id
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "private-rt-${var.environment_suffix}-${count.index + 1}"
    }
  )
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_app" {
  count = 3

  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "private_db" {
  count = 3

  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "alb-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from on-premises"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.onprem_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "alb-sg-${var.environment_suffix}"
    }
  )

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
    from_port       = var.payment_app_port
    to_port         = var.payment_app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "Traffic from on-premises"
    from_port   = var.payment_app_port
    to_port     = var.payment_app_port
    protocol    = "tcp"
    cidr_blocks = [var.onprem_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-tasks-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "rds-${var.environment_suffix}-"
  description = "Security group for RDS Aurora cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL from ECS tasks"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  ingress {
    description     = "MySQL from DMS"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.dms.id]
  }

  ingress {
    description = "MySQL from on-premises"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.onprem_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for DMS
resource "aws_security_group" "dms" {
  name_prefix = "dms-${var.environment_suffix}-"
  description = "Security group for DMS replication instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "MySQL from on-premises"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.onprem_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "dms-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoints for Systems Manager (for private subnet access)
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "ssm-endpoint-${var.environment_suffix}"
    }
  )
}

resource "aws_vpc_endpoint" "ssmmessages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "ssmmessages-endpoint-${var.environment_suffix}"
    }
  )
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
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "vpc-endpoints-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}