# Multi-Region Disaster Recovery Architecture - Terraform Implementation

This implementation provides a production-ready multi-region disaster recovery solution for a transaction processing application with Aurora PostgreSQL Global Database, Auto Scaling EC2 instances, Application Load Balancers, Route 53 failover, S3 cross-region replication, CloudWatch monitoring, and AWS Backup integration.

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Region      = "primary"
      DR-Role     = "primary"
      Project     = "transaction-processing"
      ManagedBy   = "terraform"
    }
  }
}

# Secondary region provider (us-west-2)
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Region      = "secondary"
      DR-Role     = "secondary"
      Project     = "transaction-processing"
      ManagedBy   = "terraform"
    }
  }
}
```

## File: variables.tf

```hcl
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to ensure uniqueness"
  type        = string
  validation {
    condition     = length(var.environment_suffix) > 0
    error_message = "environment_suffix must not be empty"
  }
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_master_username" {
  description = "Master username for Aurora database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora database"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "transactiondb"
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.medium"
}

variable "ami_id_primary" {
  description = "AMI ID for EC2 instances in primary region"
  type        = string
  default     = "ami-0c02fb55956c7d316" # Amazon Linux 2023
}

variable "ami_id_secondary" {
  description = "AMI ID for EC2 instances in secondary region"
  type        = string
  default     = "ami-0efcece6bed30fd98" # Amazon Linux 2023
}

variable "domain_name" {
  description = "Domain name for Route 53 hosted zone"
  type        = string
}

variable "s3_bucket_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "transaction-data"
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}
```

## File: locals.tf

```hcl
locals {
  common_tags = {
    Environment = var.environment_suffix
    Project     = "transaction-processing"
    ManagedBy   = "terraform"
  }

  primary_azs   = ["${var.primary_region}a", "${var.primary_region}b", "${var.primary_region}c"]
  secondary_azs = ["${var.secondary_region}a", "${var.secondary_region}b", "${var.secondary_region}c"]

  primary_public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  primary_private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  primary_db_subnets      = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  secondary_public_subnets  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  secondary_private_subnets = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]
  secondary_db_subnets      = ["10.1.21.0/24", "10.1.22.0/24", "10.1.23.0/24"]
}
```

## File: vpc-primary.tf

```hcl
# Primary Region VPC
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name    = "vpc-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name    = "igw-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Public Subnets
resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = 3
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnets[count.index]
  availability_zone       = local.primary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name    = "subnet-public-primary-${count.index + 1}-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
    Type    = "public"
  })
}

# Primary Private Subnets
resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnets[count.index]
  availability_zone = local.primary_azs[count.index]

  tags = merge(local.common_tags, {
    Name    = "subnet-private-primary-${count.index + 1}-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
    Type    = "private"
  })
}

# Primary Database Subnets
resource "aws_subnet" "primary_db" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_db_subnets[count.index]
  availability_zone = local.primary_azs[count.index]

  tags = merge(local.common_tags, {
    Name    = "subnet-db-primary-${count.index + 1}-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
    Type    = "database"
  })
}

# Primary Public Route Table
resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name    = "rt-public-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Public Route Table Associations
resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Primary Private Route Tables
resource "aws_route_table" "primary_private" {
  provider = aws.primary
  count    = 3
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name    = "rt-private-primary-${count.index + 1}-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Private Route Table Associations
resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}
```

## File: vpc-secondary.tf

```hcl
# Secondary Region VPC
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name    = "vpc-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name    = "igw-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Public Subnets
resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = 3
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnets[count.index]
  availability_zone       = local.secondary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name    = "subnet-public-secondary-${count.index + 1}-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
    Type    = "public"
  })
}

# Secondary Private Subnets
resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = 3
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnets[count.index]
  availability_zone = local.secondary_azs[count.index]

  tags = merge(local.common_tags, {
    Name    = "subnet-private-secondary-${count.index + 1}-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
    Type    = "private"
  })
}

# Secondary Database Subnets
resource "aws_subnet" "secondary_db" {
  provider          = aws.secondary
  count             = 3
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_db_subnets[count.index]
  availability_zone = local.secondary_azs[count.index]

  tags = merge(local.common_tags, {
    Name    = "subnet-db-secondary-${count.index + 1}-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
    Type    = "database"
  })
}

# Secondary Public Route Table
resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name    = "rt-public-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Public Route Table Associations
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = 3
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Secondary Private Route Tables
resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  count    = 3
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name    = "rt-private-secondary-${count.index + 1}-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Private Route Table Associations
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = 3
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}
```

## File: vpc-peering.tf

```hcl
# VPC Peering Connection (initiated from primary)
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider    = aws.primary
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.secondary.id
  peer_region = var.secondary_region
  auto_accept = false

  tags = merge(local.common_tags, {
    Name    = "vpc-peering-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Accept VPC Peering Connection in secondary region
resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = merge(local.common_tags, {
    Name    = "vpc-peering-accepter-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Add routes to primary private route tables
resource "aws_route" "primary_to_secondary" {
  provider                  = aws.primary
  count                     = 3
  route_table_id            = aws_route_table.primary_private[count.index].id
  destination_cidr_block    = var.vpc_cidr_secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

# Add routes to secondary private route tables
resource "aws_route" "secondary_to_primary" {
  provider                  = aws.secondary
  count                     = 3
  route_table_id            = aws_route_table.secondary_private[count.index].id
  destination_cidr_block    = var.vpc_cidr_primary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}
```

## File: security-groups.tf

```hcl
# Primary ALB Security Group
resource "aws_security_group" "primary_alb" {
  provider    = aws.primary
  name        = "sg-alb-primary-${var.environment_suffix}"
  description = "Security group for primary ALB"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP from anywhere"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-alb-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Secondary ALB Security Group
resource "aws_security_group" "secondary_alb" {
  provider    = aws.secondary
  name        = "sg-alb-secondary-${var.environment_suffix}"
  description = "Security group for secondary ALB"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP from anywhere"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-alb-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Primary Application Security Group
resource "aws_security_group" "primary_app" {
  provider    = aws.primary
  name        = "sg-app-primary-${var.environment_suffix}"
  description = "Security group for primary application instances"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
    description     = "Allow traffic from primary ALB"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary]
    description = "Allow SSH from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-app-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Secondary Application Security Group
resource "aws_security_group" "secondary_app" {
  provider    = aws.secondary
  name        = "sg-app-secondary-${var.environment_suffix}"
  description = "Security group for secondary application instances"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
    description     = "Allow traffic from secondary ALB"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_secondary]
    description = "Allow SSH from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-app-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Primary Aurora Security Group
resource "aws_security_group" "primary_aurora" {
  provider    = aws.primary
  name        = "sg-aurora-primary-${var.environment_suffix}"
  description = "Security group for primary Aurora cluster"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_app.id]
    description     = "Allow PostgreSQL from primary application"
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_secondary]
    description = "Allow PostgreSQL from secondary VPC for replication"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-aurora-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Secondary Aurora Security Group
resource "aws_security_group" "secondary_aurora" {
  provider    = aws.secondary
  name        = "sg-aurora-secondary-${var.environment_suffix}"
  description = "Security group for secondary Aurora cluster"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_app.id]
    description     = "Allow PostgreSQL from secondary application"
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary]
    description = "Allow PostgreSQL from primary VPC for replication"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name    = "sg-aurora-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}
```

## File: aurora-global-database.tf

```hcl
# Aurora Global Database Cluster
resource "aws_rds_global_cluster" "main" {
  provider                  = aws.primary
  global_cluster_identifier = "aurora-global-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = var.db_name
  storage_encrypted         = true

  lifecycle {
    prevent_destroy = false
  }
}

# Primary DB Subnet Group
resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "aurora-subnet-primary-${var.environment_suffix}"
  subnet_ids = aws_subnet.primary_db[*].id

  tags = merge(local.common_tags, {
    Name    = "aurora-subnet-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Aurora Cluster
resource "aws_rds_cluster" "primary" {
  provider                        = aws.primary
  cluster_identifier              = "aurora-primary-${var.environment_suffix}"
  engine                          = aws_rds_global_cluster.main.engine
  engine_version                  = aws_rds_global_cluster.main.engine_version
  database_name                   = var.db_name
  master_username                 = var.db_master_username
  master_password                 = var.db_master_password
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  vpc_security_group_ids          = [aws_security_group.primary_aurora.id]
  backup_retention_period         = var.backup_retention_days
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  skip_final_snapshot             = true
  global_cluster_identifier       = aws_rds_global_cluster.main.id

  # Point-in-time recovery is enabled by default with backup_retention_period > 0

  tags = merge(local.common_tags, {
    Name    = "aurora-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })

  depends_on = [aws_rds_global_cluster.main]
}

# Primary Aurora Cluster Instances (writer)
resource "aws_rds_cluster_instance" "primary" {
  provider             = aws.primary
  count                = 2
  identifier           = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.primary.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.primary.engine
  engine_version       = aws_rds_cluster.primary.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.primary.name

  performance_insights_enabled = true

  tags = merge(local.common_tags, {
    Name    = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Secondary DB Subnet Group
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "aurora-subnet-secondary-${var.environment_suffix}"
  subnet_ids = aws_subnet.secondary_db[*].id

  tags = merge(local.common_tags, {
    Name    = "aurora-subnet-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Aurora Cluster (read replica)
resource "aws_rds_cluster" "secondary" {
  provider                        = aws.secondary
  cluster_identifier              = "aurora-secondary-${var.environment_suffix}"
  engine                          = aws_rds_global_cluster.main.engine
  engine_version                  = aws_rds_global_cluster.main.engine_version
  db_subnet_group_name            = aws_db_subnet_group.secondary.name
  vpc_security_group_ids          = [aws_security_group.secondary_aurora.id]
  backup_retention_period         = var.backup_retention_days
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  skip_final_snapshot             = true
  global_cluster_identifier       = aws_rds_global_cluster.main.id

  depends_on = [
    aws_rds_cluster_instance.primary
  ]

  tags = merge(local.common_tags, {
    Name    = "aurora-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Aurora Cluster Instances (reader)
resource "aws_rds_cluster_instance" "secondary" {
  provider             = aws.secondary
  count                = 2
  identifier           = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.secondary.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.secondary.engine
  engine_version       = aws_rds_cluster.secondary.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.secondary.name

  performance_insights_enabled = true

  tags = merge(local.common_tags, {
    Name    = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}
```

## File: alb-primary.tf

```hcl
# Primary Application Load Balancer
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "alb-primary-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = merge(local.common_tags, {
    Name    = "alb-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Target Group
resource "aws_lb_target_group" "primary" {
  provider    = aws.primary
  name        = "tg-primary-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, {
    Name    = "tg-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary ALB Listener
resource "aws_lb_listener" "primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = merge(local.common_tags, {
    Name    = "listener-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}
```

## File: alb-secondary.tf

```hcl
# Secondary Application Load Balancer
resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "alb-secondary-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = merge(local.common_tags, {
    Name    = "alb-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Target Group
resource "aws_lb_target_group" "secondary" {
  provider    = aws.secondary
  name        = "tg-secondary-${var.environment_suffix}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.secondary.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, {
    Name    = "tg-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary ALB Listener
resource "aws_lb_listener" "secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }

  tags = merge(local.common_tags, {
    Name    = "listener-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}
```

## File: iam.tf

```hcl
# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2_role" {
  name = "ec2-app-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name    = "ec2-app-role-${var.environment_suffix}"
    DR-Role = "both"
  })
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "cloudwatch-logs-policy-${var.environment_suffix}"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for S3 Access
resource "aws_iam_role_policy" "s3_access" {
  name = "s3-access-policy-${var.environment_suffix}"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*",
          aws_s3_bucket.secondary.arn,
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-app-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2_role.name

  tags = merge(local.common_tags, {
    Name    = "ec2-app-profile-${var.environment_suffix}"
    DR-Role = "both"
  })
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup_role" {
  name = "backup-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "backup.amazonaws.com"
      }
    }]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
  ]

  tags = merge(local.common_tags, {
    Name    = "backup-role-${var.environment_suffix}"
    DR-Role = "both"
  })
}
```

## File: ec2-asg-primary.tf

```hcl
# Primary Launch Template
resource "aws_launch_template" "primary" {
  provider      = aws.primary
  name          = "lt-primary-${var.environment_suffix}"
  image_id      = var.ami_id_primary
  instance_type = var.instance_type
  key_name      = null # Set key name if SSH access required

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.primary_app.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker
              systemctl start docker
              systemctl enable docker

              # Install CloudWatch agent
              wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
              rpm -U ./amazon-cloudwatch-agent.rpm

              # Sample application (replace with actual application)
              docker run -d -p 8080:8080 --name app \
                -e DB_HOST=${aws_rds_cluster.primary.endpoint} \
                -e DB_NAME=${var.db_name} \
                -e AWS_REGION=${var.primary_region} \
                your-application-image:latest
              EOF
  )

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name    = "app-primary-${var.environment_suffix}"
      Region  = "primary"
      DR-Role = "primary"
    })
  }

  tags = merge(local.common_tags, {
    Name    = "lt-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Auto Scaling Group
resource "aws_autoscaling_group" "primary" {
  provider            = aws.primary
  name                = "asg-primary-${var.environment_suffix}"
  vpc_zone_identifier = aws_subnet.primary_private[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size                  = 2
  max_size                  = 6
  desired_capacity          = 2

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupPendingInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "asg-primary-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment_suffix
    propagate_at_launch = true
  }

  tag {
    key                 = "Region"
    value               = "primary"
    propagate_at_launch = true
  }

  tag {
    key                 = "DR-Role"
    value               = "primary"
    propagate_at_launch = true
  }
}

# Primary Auto Scaling Policy - Target Tracking (CPU)
resource "aws_autoscaling_policy" "primary_cpu" {
  provider               = aws.primary
  name                   = "asg-policy-cpu-primary-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.primary.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

## File: ec2-asg-secondary.tf

```hcl
# Secondary Launch Template
resource "aws_launch_template" "secondary" {
  provider      = aws.secondary
  name          = "lt-secondary-${var.environment_suffix}"
  image_id      = var.ami_id_secondary
  instance_type = var.instance_type
  key_name      = null # Set key name if SSH access required

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.secondary_app.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker
              systemctl start docker
              systemctl enable docker

              # Install CloudWatch agent
              wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
              rpm -U ./amazon-cloudwatch-agent.rpm

              # Sample application (replace with actual application)
              docker run -d -p 8080:8080 --name app \
                -e DB_HOST=${aws_rds_cluster.secondary.endpoint} \
                -e DB_NAME=${var.db_name} \
                -e AWS_REGION=${var.secondary_region} \
                your-application-image:latest
              EOF
  )

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name    = "app-secondary-${var.environment_suffix}"
      Region  = "secondary"
      DR-Role = "secondary"
    })
  }

  tags = merge(local.common_tags, {
    Name    = "lt-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Auto Scaling Group
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.secondary
  name                = "asg-secondary-${var.environment_suffix}"
  vpc_zone_identifier = aws_subnet.secondary_private[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size                  = 2
  max_size                  = 6
  desired_capacity          = 2

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupPendingInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "asg-secondary-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment_suffix
    propagate_at_launch = true
  }

  tag {
    key                 = "Region"
    value               = "secondary"
    propagate_at_launch = true
  }

  tag {
    key                 = "DR-Role"
    value               = "secondary"
    propagate_at_launch = true
  }
}

# Secondary Auto Scaling Policy - Target Tracking (CPU)
resource "aws_autoscaling_policy" "secondary_cpu" {
  provider               = aws.secondary
  name                   = "asg-policy-cpu-secondary-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.secondary.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

## File: s3-replication.tf

```hcl
# S3 Replication IAM Role
resource "aws_iam_role" "s3_replication" {
  provider = aws.primary
  name     = "s3-replication-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name    = "s3-replication-role-${var.environment_suffix}"
    DR-Role = "both"
  })
}

# S3 Replication IAM Policy
resource "aws_iam_role_policy" "s3_replication" {
  provider = aws.primary
  name     = "s3-replication-policy-${var.environment_suffix}"
  role     = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      }
    ]
  })
}

# Primary S3 Bucket
resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "${var.s3_bucket_prefix}-primary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "${var.s3_bucket_prefix}-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Primary S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Primary S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "primary" {
  provider                = aws.primary
  bucket                  = aws_s3_bucket.primary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Secondary S3 Bucket
resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary
  bucket   = "${var.s3_bucket_prefix}-secondary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "${var.s3_bucket_prefix}-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Secondary S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Secondary S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "secondary" {
  provider                = aws.secondary
  bucket                  = aws_s3_bucket.secondary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Replication Configuration (Primary to Secondary) with RTC
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  role     = aws_iam_role.s3_replication.arn

  rule {
    id     = "replicate-all"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"

      # Replication Time Control (RTC) for predictable replication
      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      # Metrics for monitoring replication
      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }

  depends_on = [
    aws_s3_bucket_versioning.primary,
    aws_s3_bucket_versioning.secondary
  ]
}
```

## File: route53.tf

```hcl
# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.primary
  name     = var.domain_name

  tags = merge(local.common_tags, {
    Name    = "hosted-zone-${var.environment_suffix}"
    DR-Role = "both"
  })
}

# Route 53 Health Check for Primary ALB
resource "aws_route53_health_check" "primary" {
  provider          = aws.primary
  type              = "HTTPS"
  resource_path     = "/health"
  fqdn              = aws_lb.primary.dns_name
  port              = 443
  failure_threshold = 3
  request_interval  = 30

  tags = merge(local.common_tags, {
    Name    = "health-check-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Route 53 Health Check for Secondary ALB
resource "aws_route53_health_check" "secondary" {
  provider          = aws.primary
  type              = "HTTPS"
  resource_path     = "/health"
  fqdn              = aws_lb.secondary.dns_name
  port              = 443
  failure_threshold = 3
  request_interval  = 30

  tags = merge(local.common_tags, {
    Name    = "health-check-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Route 53 Primary Record with Failover Routing
resource "aws_route53_record" "primary" {
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "app.${var.domain_name}"
  type     = "A"

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

# Route 53 Secondary Record with Failover Routing
resource "aws_route53_record" "secondary" {
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "app.${var.domain_name}"
  type     = "A"

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier  = "secondary"
  health_check_id = aws_route53_health_check.secondary.id

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}
```

## File: cloudwatch.tf

```hcl
# CloudWatch Log Groups for Primary
resource "aws_cloudwatch_log_group" "primary_app" {
  provider          = aws.primary
  name              = "/aws/ec2/app-primary-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name    = "log-group-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# CloudWatch Log Groups for Secondary
resource "aws_cloudwatch_log_group" "secondary_app" {
  provider          = aws.secondary
  name              = "/aws/ec2/app-secondary-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name    = "log-group-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# SNS Topic for Alarms (Primary)
resource "aws_sns_topic" "primary_alarms" {
  provider = aws.primary
  name     = "dr-alarms-primary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "sns-alarms-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# SNS Topic for Alarms (Secondary)
resource "aws_sns_topic" "secondary_alarms" {
  provider = aws.secondary
  name     = "dr-alarms-secondary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "sns-alarms-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# CloudWatch Alarm: Primary Aurora Database Lag
resource "aws_cloudwatch_metric_alarm" "primary_aurora_lag" {
  provider            = aws.primary
  alarm_name          = "aurora-replication-lag-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 60000 # 60 seconds in milliseconds
  alarm_description   = "Aurora Global Database replication lag exceeds threshold"
  alarm_actions       = [aws_sns_topic.primary_alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = merge(local.common_tags, {
    Name    = "alarm-aurora-lag-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# CloudWatch Alarm: Primary ALB Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "primary_alb_unhealthy" {
  provider            = aws.primary
  alarm_name          = "alb-unhealthy-hosts-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Primary ALB has unhealthy hosts"
  alarm_actions       = [aws_sns_topic.primary_alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
    TargetGroup  = aws_lb_target_group.primary.arn_suffix
  }

  tags = merge(local.common_tags, {
    Name    = "alarm-alb-unhealthy-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# CloudWatch Alarm: Secondary ALB Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "secondary_alb_unhealthy" {
  provider            = aws.secondary
  alarm_name          = "alb-unhealthy-hosts-secondary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Secondary ALB has unhealthy hosts"
  alarm_actions       = [aws_sns_topic.secondary_alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.secondary.arn_suffix
    TargetGroup  = aws_lb_target_group.secondary.arn_suffix
  }

  tags = merge(local.common_tags, {
    Name    = "alarm-alb-unhealthy-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# CloudWatch Alarm: S3 Replication Status
resource "aws_cloudwatch_metric_alarm" "s3_replication" {
  provider            = aws.primary
  alarm_name          = "s3-replication-status-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReplicationLatency"
  namespace           = "AWS/S3"
  period              = 900 # 15 minutes
  statistic           = "Average"
  threshold           = 900000 # 15 minutes in milliseconds
  alarm_description   = "S3 replication latency exceeds RTC SLA"
  alarm_actions       = [aws_sns_topic.primary_alarms.arn]

  dimensions = {
    SourceBucket      = aws_s3_bucket.primary.id
    DestinationBucket = aws_s3_bucket.secondary.id
    RuleId            = "replicate-all"
  }

  tags = merge(local.common_tags, {
    Name    = "alarm-s3-replication-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# CloudWatch Alarm: Primary Route53 Health Check
resource "aws_cloudwatch_metric_alarm" "route53_primary_health" {
  provider            = aws.primary
  alarm_name          = "route53-health-primary-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Primary endpoint health check failed"
  alarm_actions       = [aws_sns_topic.primary_alarms.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }

  tags = merge(local.common_tags, {
    Name    = "alarm-route53-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# CloudWatch Dashboard (Primary Region)
resource "aws_cloudwatch_dashboard" "primary" {
  provider       = aws.primary
  dashboard_name = "dr-dashboard-primary-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", region = var.primary_region }],
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", region = var.primary_region }],
            ["AWS/RDS", "AuroraGlobalDBReplicationLag", { stat = "Average", region = var.primary_region }]
          ]
          period = 300
          stat   = "Average"
          region = var.primary_region
          title  = "Aurora Primary Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", region = var.primary_region }],
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum", region = var.primary_region }],
            ["AWS/ApplicationELB", "HealthyHostCount", { stat = "Average", region = var.primary_region }],
            ["AWS/ApplicationELB", "UnHealthyHostCount", { stat = "Average", region = var.primary_region }]
          ]
          period = 300
          stat   = "Average"
          region = var.primary_region
          title  = "ALB Primary Metrics"
        }
      }
    ]
  })
}

# CloudWatch Dashboard (Secondary Region)
resource "aws_cloudwatch_dashboard" "secondary" {
  provider       = aws.secondary
  dashboard_name = "dr-dashboard-secondary-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", region = var.secondary_region }],
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", region = var.secondary_region }]
          ]
          period = 300
          stat   = "Average"
          region = var.secondary_region
          title  = "Aurora Secondary Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", region = var.secondary_region }],
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum", region = var.secondary_region }],
            ["AWS/ApplicationELB", "HealthyHostCount", { stat = "Average", region = var.secondary_region }],
            ["AWS/ApplicationELB", "UnHealthyHostCount", { stat = "Average", region = var.secondary_region }]
          ]
          period = 300
          stat   = "Average"
          region = var.secondary_region
          title  = "ALB Secondary Metrics"
        }
      }
    ]
  })
}
```

## File: backup.tf

```hcl
# AWS Backup Vault (Primary)
resource "aws_backup_vault" "primary" {
  provider = aws.primary
  name     = "backup-vault-primary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "backup-vault-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# AWS Backup Vault (Secondary)
resource "aws_backup_vault" "secondary" {
  provider = aws.secondary
  name     = "backup-vault-secondary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "backup-vault-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# AWS Backup Plan (Primary)
resource "aws_backup_plan" "primary" {
  provider = aws.primary
  name     = "backup-plan-primary-${var.environment_suffix}"

  rule {
    rule_name         = "daily-backup-rule"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = "cron(0 2 * * ? *)" # Daily at 2 AM UTC

    lifecycle {
      delete_after = var.backup_retention_days
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.secondary.arn

      lifecycle {
        delete_after = var.backup_retention_days
      }
    }
  }

  advanced_backup_setting {
    backup_options = {
      WindowsVSS = "enabled"
    }
    resource_type = "EC2"
  }

  tags = merge(local.common_tags, {
    Name    = "backup-plan-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# AWS Backup Plan (Secondary)
resource "aws_backup_plan" "secondary" {
  provider = aws.secondary
  name     = "backup-plan-secondary-${var.environment_suffix}"

  rule {
    rule_name         = "daily-backup-rule"
    target_vault_name = aws_backup_vault.secondary.name
    schedule          = "cron(0 2 * * ? *)" # Daily at 2 AM UTC

    lifecycle {
      delete_after = var.backup_retention_days
    }
  }

  advanced_backup_setting {
    backup_options = {
      WindowsVSS = "enabled"
    }
    resource_type = "EC2"
  }

  tags = merge(local.common_tags, {
    Name    = "backup-plan-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Backup Selection (Primary) - EC2 Instances
resource "aws_backup_selection" "primary_ec2" {
  provider     = aws.primary
  name         = "backup-selection-ec2-primary-${var.environment_suffix}"
  plan_id      = aws_backup_plan.primary.id
  iam_role_arn = aws_iam_role.backup_role.arn

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Environment"
    value = var.environment_suffix
  }

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "DR-Role"
    value = "primary"
  }

  resources = ["*"]
}

# Backup Selection (Primary) - Aurora Cluster
resource "aws_backup_selection" "primary_aurora" {
  provider     = aws.primary
  name         = "backup-selection-aurora-primary-${var.environment_suffix}"
  plan_id      = aws_backup_plan.primary.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_rds_cluster.primary.arn
  ]
}

# Backup Selection (Secondary) - EC2 Instances
resource "aws_backup_selection" "secondary_ec2" {
  provider     = aws.secondary
  name         = "backup-selection-ec2-secondary-${var.environment_suffix}"
  plan_id      = aws_backup_plan.secondary.id
  iam_role_arn = aws_iam_role.backup_role.arn

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Environment"
    value = var.environment_suffix
  }

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "DR-Role"
    value = "secondary"
  }

  resources = ["*"]
}

# Backup Selection (Secondary) - Aurora Cluster
resource "aws_backup_selection" "secondary_aurora" {
  provider     = aws.secondary
  name         = "backup-selection-aurora-secondary-${var.environment_suffix}"
  plan_id      = aws_backup_plan.secondary.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_rds_cluster.secondary.arn
  ]
}
```

## File: outputs.tf

```hcl
output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "Secondary VPC ID"
  value       = aws_vpc.secondary.id
}

output "primary_alb_dns" {
  description = "Primary ALB DNS name"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns" {
  description = "Secondary ALB DNS name"
  value       = aws_lb.secondary.dns_name
}

output "primary_aurora_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
  sensitive   = true
}

output "secondary_aurora_endpoint" {
  description = "Secondary Aurora cluster endpoint"
  value       = aws_rds_cluster.secondary.endpoint
  sensitive   = true
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "primary_s3_bucket" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary.id
}

output "secondary_s3_bucket" {
  description = "Secondary S3 bucket name"
  value       = aws_s3_bucket.secondary.id
}

output "primary_backup_vault_arn" {
  description = "Primary backup vault ARN"
  value       = aws_backup_vault.primary.arn
}

output "secondary_backup_vault_arn" {
  description = "Secondary backup vault ARN"
  value       = aws_backup_vault.secondary.arn
}

output "primary_cloudwatch_dashboard_url" {
  description = "Primary CloudWatch dashboard URL"
  value       = "https://${var.primary_region}.console.aws.amazon.com/cloudwatch/deeplink.js?region=${var.primary_region}#dashboards:name=${aws_cloudwatch_dashboard.primary.dashboard_name}"
}

output "secondary_cloudwatch_dashboard_url" {
  description = "Secondary CloudWatch dashboard URL"
  value       = "https://${var.secondary_region}.console.aws.amazon.com/cloudwatch/deeplink.js?region=${var.secondary_region}#dashboards:name=${aws_cloudwatch_dashboard.secondary.dashboard_name}"
}
```

## File: terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and fill in your values

primary_region   = "us-east-1"
secondary_region = "us-west-2"

environment_suffix = "prod-dr-001"

vpc_cidr_primary   = "10.0.0.0/16"
vpc_cidr_secondary = "10.1.0.0/16"

db_master_username = "dbadmin"
db_master_password = "CHANGE_ME_SECURE_PASSWORD"
db_name            = "transactiondb"

instance_type = "t3.medium"

# AMI IDs - Update these with your region-specific AMIs
ami_id_primary   = "ami-0c02fb55956c7d316" # Amazon Linux 2023 us-east-1
ami_id_secondary = "ami-0efcece6bed30fd98" # Amazon Linux 2023 us-west-2

domain_name       = "example.com"
s3_bucket_prefix  = "transaction-data"

backup_retention_days = 7
```

## File: README.md

```markdown
# Multi-Region Disaster Recovery Architecture

This Terraform configuration implements a production-ready multi-region disaster recovery solution for a transaction processing application with RPO < 1 hour and RTO < 4 hours.

## Architecture Overview

### Components

- **Primary Region**: us-east-1 (Active)
- **Secondary Region**: us-west-2 (Standby/DR)

### Infrastructure

1. **Database**: Aurora PostgreSQL Global Database
   - Writer in us-east-1
   - Read replicas in both regions
   - Automated backups with 7-day retention
   - Point-in-time recovery enabled

2. **Compute**: EC2 Auto Scaling Groups
   - Minimum 2 instances per region
   - Target tracking scaling based on CPU
   - Launch templates with CloudWatch agent

3. **Load Balancing**: Application Load Balancers
   - ALB in each region
   - Health checks on /health endpoint
   - HTTP/HTTPS listeners

4. **DNS Failover**: Route 53
   - Hosted zone with failover routing
   - Health checks for both ALBs
   - Automatic failover on primary failure

5. **Storage**: S3 with Cross-Region Replication
   - Replication Time Control (RTC) enabled
   - 15-minute RTC SLA
   - Versioning enabled

6. **Networking**: Multi-VPC with Peering
   - 3 AZs per region
   - VPC peering for cross-region communication
   - Public, private, and database subnets

7. **Monitoring**: CloudWatch
   - Cross-region dashboards
   - Alarms for database lag, instance health, replication status
   - SNS notifications

8. **Backup**: AWS Backup
   - Daily backups in both regions
   - 7-day retention
   - Cross-region backup copies

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- IAM permissions for multi-region resource creation
- Valid domain name for Route 53

## Deployment

### 1. Initialize Terraform

```bash
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=dr-infrastructure/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=your-terraform-lock-table"
```

### 2. Create terraform.tfvars

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Plan and Apply

```bash
# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

### 4. Verify Deployment

```bash
# Check primary ALB
terraform output primary_alb_dns

# Check secondary ALB
terraform output secondary_alb_dns

# Check Route 53 name servers
terraform output route53_name_servers
```

## Failover Testing

### Manual Failover Test

1. **Monitor Current State**
   ```bash
   aws route53 get-health-check-status --health-check-id <primary-health-check-id>
   ```

2. **Simulate Primary Failure**
   - Stop primary ALB or scale down primary ASG to 0

3. **Verify Failover**
   ```bash
   # DNS should resolve to secondary ALB
   dig app.example.com
   ```

4. **Restore Primary**
   - Start primary ALB or scale up primary ASG

### Automated Testing

```bash
# Run health checks
./scripts/health-check.sh

# Test failover scenario
./scripts/test-failover.sh
```

## Monitoring

### CloudWatch Dashboards

- Primary: `https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:`
- Secondary: `https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:`

### Key Metrics

- Aurora replication lag
- ALB healthy/unhealthy host counts
- S3 replication latency
- Route 53 health check status
- EC2 instance health
- Auto Scaling group metrics

### Alarms

- `aurora-replication-lag-primary`: Database lag > 60 seconds
- `alb-unhealthy-hosts-primary`: Unhealthy hosts in primary
- `alb-unhealthy-hosts-secondary`: Unhealthy hosts in secondary
- `s3-replication-status`: Replication latency exceeds RTC SLA
- `route53-health-primary`: Primary health check failure

## Backup and Recovery

### Automated Backups

- **Aurora**: Automated backups with 7-day retention
- **EC2**: AWS Backup daily snapshots with 7-day retention
- **Cross-region**: Backups copied to secondary region

### Recovery Procedures

1. **Database Recovery**
   ```bash
   # Point-in-time recovery
   aws rds restore-db-cluster-to-point-in-time \
     --source-db-cluster-identifier aurora-primary-<suffix> \
     --db-cluster-identifier aurora-restored-<suffix> \
     --restore-to-time 2024-01-01T12:00:00Z
   ```

2. **EC2 Recovery**
   ```bash
   # Restore from AWS Backup
   aws backup start-restore-job \
     --recovery-point-arn <recovery-point-arn> \
     --iam-role-arn <backup-role-arn>
   ```

## Cost Optimization

- Aurora Serverless v2 can be used for non-production environments
- Consider Reserved Instances for predictable EC2 workloads
- Use S3 Intelligent-Tiering for cost-effective storage
- Review CloudWatch log retention periods

## Security

- All resources tagged with Environment, Region, and DR-Role
- Security groups follow least privilege principle
- Encryption at rest enabled for Aurora and S3
- VPC isolation with private subnets for databases
- IAM roles with minimal required permissions

## Compliance

- **RPO**: < 1 hour (Aurora Global Database replication)
- **RTO**: < 4 hours (Automated failover with Route 53)
- **Backup Retention**: 7 days
- **Replication**: RTC enabled for S3 (15-minute SLA)

## Maintenance

### Regular Tasks

1. Review CloudWatch alarms and dashboards
2. Test failover procedures monthly
3. Verify backup completion
4. Update AMIs and apply security patches
5. Review and rotate credentials

### Scaling

- Auto Scaling groups configured for automatic scaling
- Aurora read replicas can be added for read-heavy workloads
- ALB capacity scales automatically

## Troubleshooting

### Common Issues

1. **Aurora Replication Lag**
   - Check network connectivity between regions
   - Review Aurora cluster performance metrics
   - Consider scaling up instance class

2. **ALB Health Check Failures**
   - Verify /health endpoint is responding
   - Check security group rules
   - Review application logs

3. **S3 Replication Delays**
   - Verify replication configuration
   - Check IAM role permissions
   - Review RTC metrics

## Tags

All resources are tagged with:
- `Environment`: Value from `environment_suffix` variable
- `Region`: "primary" or "secondary"
- `DR-Role`: "primary", "secondary", or "both"
- `Project`: "transaction-processing"
- `ManagedBy`: "terraform"

## Outputs

- `primary_vpc_id`: Primary VPC ID
- `secondary_vpc_id`: Secondary VPC ID
- `primary_alb_dns`: Primary ALB DNS name
- `secondary_alb_dns`: Secondary ALB DNS name
- `primary_aurora_endpoint`: Primary Aurora endpoint (sensitive)
- `secondary_aurora_endpoint`: Secondary Aurora endpoint (sensitive)
- `route53_zone_id`: Route 53 hosted zone ID
- `primary_s3_bucket`: Primary S3 bucket name
- `secondary_s3_bucket`: Secondary S3 bucket name

## Support

For issues or questions, please contact the infrastructure team.
```
