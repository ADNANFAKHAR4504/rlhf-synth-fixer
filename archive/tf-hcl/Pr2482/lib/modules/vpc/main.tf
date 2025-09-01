data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc-${var.region}"
  }
}

# Internet Gateway (for NAT Gateway only)
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-igw-${var.region}"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-${var.environment}-eip-nat-${var.region}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Subnet (for NAT Gateway only - no public resources)
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 1)
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false # Ensure no public IPs

  tags = {
    Name = "${var.project_name}-${var.environment}-public-subnet-${var.region}"
    Type = "Public"
  }
}

# Private Subnet
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 2)
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "${var.project_name}-${var.environment}-private-subnet-${var.region}"
    Type = "Private"
  }
}

# Database Subnet
resource "aws_subnet" "database" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 3)
  availability_zone = data.aws_availability_zones.available.names[2]

  tags = {
    Name = "${var.project_name}-${var.environment}-database-subnet-${var.region}"
    Type = "Database"
  }
}

# Additional database subnet for RDS subnet group
resource "aws_subnet" "database_secondary" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 4)
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "${var.project_name}-${var.environment}-database-subnet-secondary-${var.region}"
    Type = "Database"
  }
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "${var.project_name}-${var.environment}-nat-${var.region}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-public-rt-${var.region}"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-private-rt-${var.region}"
  }
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  # No internet access for database subnet

  tags = {
    Name = "${var.project_name}-${var.environment}-database-rt-${var.region}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "database" {
  subnet_id      = aws_subnet.database.id
  route_table_id = aws_route_table.database.id
}

resource "aws_route_table_association" "database_secondary" {
  subnet_id      = aws_subnet.database_secondary.id
  route_table_id = aws_route_table.database.id
}

# Security Groups
resource "aws_security_group" "private_sg" {
  name_prefix = "${var.project_name}-${var.environment}-private-"
  vpc_id      = aws_vpc.main.id

  # Allow inbound traffic only from within VPC
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow all outbound traffic through NAT
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-private-sg-${var.region}"
  }
}

resource "aws_security_group" "database_sg" {
  name_prefix = "${var.project_name}-${var.environment}-database-"
  vpc_id      = aws_vpc.main.id

  # Allow database traffic only from private subnet
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.private_sg.id]
  }

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.private_sg.id]
  }

  # No outbound internet access

  tags = {
    Name = "${var.project_name}-${var.environment}-database-sg-${var.region}"
  }
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn         = aws_iam_role.flow_log_role.arn
  log_destination      = "arn:aws:s3:::${var.central_logging_bucket}/vpc-flow-logs/${var.region}/"
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc-flow-log-${var.region}"
  }
}

# Flow Logs for each subnet
resource "aws_flow_log" "public_subnet_flow_log" {
  iam_role_arn         = aws_iam_role.flow_log_role.arn
  log_destination      = "arn:aws:s3:::${var.central_logging_bucket}/subnet-flow-logs/${var.region}/public/"
  log_destination_type = "s3"
  traffic_type         = "ALL"
  subnet_id            = aws_subnet.public.id

  tags = {
    Name = "${var.project_name}-${var.environment}-public-subnet-flow-log-${var.region}"
  }
}

resource "aws_flow_log" "private_subnet_flow_log" {
  iam_role_arn         = aws_iam_role.flow_log_role.arn
  log_destination      = "arn:aws:s3:::${var.central_logging_bucket}/subnet-flow-logs/${var.region}/private/"
  log_destination_type = "s3"
  traffic_type         = "ALL"
  subnet_id            = aws_subnet.private.id

  tags = {
    Name = "${var.project_name}-${var.environment}-private-subnet-flow-log-${var.region}"
  }
}

resource "aws_flow_log" "database_subnet_flow_log" {
  iam_role_arn         = aws_iam_role.flow_log_role.arn
  log_destination      = "arn:aws:s3:::${var.central_logging_bucket}/subnet-flow-logs/${var.region}/database/"
  log_destination_type = "s3"
  traffic_type         = "ALL"
  subnet_id            = aws_subnet.database.id

  tags = {
    Name = "${var.project_name}-${var.environment}-database-subnet-flow-log-${var.region}"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log_role" {
  name_prefix = "${var.project_name}-${var.environment}-flow-log-role-"

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

  tags = {
    Name = "${var.project_name}-${var.environment}-flow-log-role-${var.region}"
  }
}

resource "aws_iam_role_policy" "flow_log_policy" {
  name_prefix = "${var.project_name}-${var.environment}-flow-log-policy-"
  role        = aws_iam_role.flow_log_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.central_logging_bucket}",
          "arn:aws:s3:::${var.central_logging_bucket}/*"
        ]
      }
    ]
  })
}

# VPC Endpoints for secure AWS service access
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.region}.s3"

  tags = {
    Name = "${var.project_name}-${var.environment}-s3-endpoint-${var.region}"
  }
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${var.region}.secretsmanager"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = [aws_subnet.private.id]
  security_group_ids = [aws_security_group.private_sg.id]

  tags = {
    Name = "${var.project_name}-${var.environment}-secretsmanager-endpoint-${var.region}"
  }
}

# Example RDS instance with encryption
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group-${var.region}"
  subnet_ids = [aws_subnet.database.id, aws_subnet.database_secondary.id]

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group-${var.region}"
  }
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption in ${var.region}"
  deletion_window_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-kms-${var.region}"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.project_name}-${var.environment}-rds-${var.region}"
  target_key_id = aws_kms_key.rds.key_id
}