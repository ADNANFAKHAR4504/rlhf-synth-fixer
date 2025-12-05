# Baseline Infrastructure - Intentionally Sub-Optimal
# This represents the "before" state that will be optimized by optimize.py

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Baseline uses local state - will be optimized to remote state
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Multiple provider blocks - intentionally redundant (will be optimized)
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "FinTech-App"
      ManagedBy   = "Terraform"
    }
  }
}

# Redundant provider block for same region
provider "aws" {
  alias  = "primary"
  region = var.aws_region
}

# Redundant provider block
provider "aws" {
  alias  = "backup"
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region for infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

# Hardcoded VPC configuration - Dev Environment
resource "aws_vpc" "dev_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "dev-vpc"
    Environment = "dev"
    Project     = "FinTech-App"
    ManagedBy   = "Terraform"
  }
}

# Hardcoded VPC configuration - Staging Environment
resource "aws_vpc" "staging_vpc" {
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "staging-vpc"
    Environment = "staging"
    Project     = "FinTech-App"
    ManagedBy   = "Terraform"
  }
}

# Hardcoded VPC configuration - Prod Environment
resource "aws_vpc" "prod_vpc" {
  cidr_block           = "10.2.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "prod-vpc"
    Environment = "prod"
    Project     = "FinTech-App"
    ManagedBy   = "Terraform"
  }
}

# Hardcoded subnet - Dev Public 1
resource "aws_subnet" "dev_public_1" {
  vpc_id                  = aws_vpc.dev_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "dev-public-1"
    Environment = "dev"
    Type        = "public"
  }
}

# Hardcoded subnet - Dev Public 2
resource "aws_subnet" "dev_public_2" {
  vpc_id                  = aws_vpc.dev_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name        = "dev-public-2"
    Environment = "dev"
    Type        = "public"
  }
}

# Hardcoded subnet - Dev Private 1
resource "aws_subnet" "dev_private_1" {
  vpc_id            = aws_vpc.dev_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name        = "dev-private-1"
    Environment = "dev"
    Type        = "private"
  }
}

# Hardcoded subnet - Dev Private 2
resource "aws_subnet" "dev_private_2" {
  vpc_id            = aws_vpc.dev_vpc.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name        = "dev-private-2"
    Environment = "dev"
    Type        = "private"
  }
}

# Hardcoded Internet Gateway - Dev
resource "aws_internet_gateway" "dev_igw" {
  vpc_id = aws_vpc.dev_vpc.id

  tags = {
    Name        = "dev-igw"
    Environment = "dev"
  }
}

# Hardcoded Security Group - Dev Web Server
# Contains duplicate rules that should be optimized
resource "aws_security_group" "dev_web_sg" {
  name        = "dev-web-sg"
  description = "Security group for dev web servers"
  vpc_id      = aws_vpc.dev_vpc.id

  # Duplicate rule 1
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet"
  }

  # Duplicate rule 2
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  # Duplicate rule 3
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "SSH from VPC"
  }

  # Duplicate rule 4
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "App port from VPC"
  }

  # Duplicate rule 5
  ingress {
    from_port   = 8443
    to_port     = 8443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "Secure app port from VPC"
  }

  # Many more duplicate egress rules
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All traffic outbound"
  }

  tags = {
    Name        = "dev-web-sg"
    Environment = "dev"
  }
}

# Hardcoded Security Group - Staging Web Server
resource "aws_security_group" "staging_web_sg" {
  name        = "staging-web-sg"
  description = "Security group for staging web servers"
  vpc_id      = aws_vpc.staging_vpc.id

  # Duplicate rules (same as dev)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16"]
    description = "SSH from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All traffic outbound"
  }

  tags = {
    Name        = "staging-web-sg"
    Environment = "staging"
  }
}

# Hardcoded EC2 instance - Dev Web Server 1
resource "aws_instance" "dev_web_1" {
  ami           = "ami-0c55b159cbfafe1f0"  # Hardcoded AMI
  instance_type = "t3.medium"               # Oversized for dev
  subnet_id     = aws_subnet.dev_public_1.id
  vpc_security_group_ids = [aws_security_group.dev_web_sg.id]

  tags = {
    Name        = "dev-web-1"
    Environment = "dev"
    Role        = "web"
  }
}

# Hardcoded EC2 instance - Dev Web Server 2
resource "aws_instance" "dev_web_2" {
  ami           = "ami-0c55b159cbfafe1f0"  # Hardcoded AMI
  instance_type = "t3.medium"               # Oversized for dev
  subnet_id     = aws_subnet.dev_public_2.id
  vpc_security_group_ids = [aws_security_group.dev_web_sg.id]

  tags = {
    Name        = "dev-web-2"
    Environment = "dev"
    Role        = "web"
  }
}

# Hardcoded RDS - Dev Database
# Should be consolidated into a module
resource "aws_db_subnet_group" "dev_db_subnet" {
  name       = "dev-db-subnet"
  subnet_ids = [aws_subnet.dev_private_1.id, aws_subnet.dev_private_2.id]

  tags = {
    Name        = "dev-db-subnet"
    Environment = "dev"
  }
}

resource "aws_security_group" "dev_db_sg" {
  name        = "dev-db-sg"
  description = "Security group for dev database"
  vpc_id      = aws_vpc.dev_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.dev_web_sg.id]
    description     = "PostgreSQL from web servers"
  }

  tags = {
    Name        = "dev-db-sg"
    Environment = "dev"
  }
}

resource "aws_db_instance" "dev_postgres" {
  identifier              = "dev-postgres-db"
  engine                  = "postgres"
  engine_version          = "15.3"
  instance_class          = "db.t3.medium"  # Oversized for dev
  allocated_storage       = 100              # Oversized for dev
  storage_type            = "gp3"
  db_subnet_group_name    = aws_db_subnet_group.dev_db_subnet.name
  vpc_security_group_ids  = [aws_security_group.dev_db_sg.id]
  username                = "dbadmin"        # Hardcoded username
  password                = "changeme123"    # Hardcoded password (security issue)
  skip_final_snapshot     = true
  backup_retention_period = 7
  multi_az                = false  # Should be true for prod

  tags = {
    Name        = "dev-postgres-db"
    Environment = "dev"
  }
}

# Hardcoded RDS - Staging Database (duplicate definition)
resource "aws_db_subnet_group" "staging_db_subnet" {
  name       = "staging-db-subnet"
  subnet_ids = [aws_subnet.dev_private_1.id, aws_subnet.dev_private_2.id]  # Wrong subnets!

  tags = {
    Name        = "staging-db-subnet"
    Environment = "staging"
  }
}

resource "aws_security_group" "staging_db_sg" {
  name        = "staging-db-sg"
  description = "Security group for staging database"
  vpc_id      = aws_vpc.staging_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.staging_web_sg.id]
    description     = "PostgreSQL from web servers"
  }

  tags = {
    Name        = "staging-db-sg"
    Environment = "staging"
  }
}

resource "aws_db_instance" "staging_postgres" {
  identifier              = "staging-postgres-db"
  engine                  = "postgres"
  engine_version          = "15.3"
  instance_class          = "db.t3.large"   # Oversized
  allocated_storage       = 200             # Oversized
  storage_type            = "gp3"
  db_subnet_group_name    = aws_db_subnet_group.staging_db_subnet.name
  vpc_security_group_ids  = [aws_security_group.staging_db_sg.id]
  username                = "dbadmin"       # Hardcoded
  password                = "changeme456"   # Hardcoded (security issue)
  skip_final_snapshot     = true
  backup_retention_period = 7
  multi_az                = false

  tags = {
    Name        = "staging-postgres-db"
    Environment = "staging"
  }
}

# Hardcoded Load Balancer - Dev
resource "aws_lb" "dev_alb" {
  name               = "dev-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.dev_web_sg.id]
  subnets            = [aws_subnet.dev_public_1.id, aws_subnet.dev_public_2.id]

  tags = {
    Name        = "dev-alb"
    Environment = "dev"
  }
}

resource "aws_lb_target_group" "dev_tg" {
  name     = "dev-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.dev_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    path                = "/health"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "dev-tg"
    Environment = "dev"
  }
}

resource "aws_lb_listener" "dev_listener" {
  load_balancer_arn = aws_lb.dev_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.dev_tg.arn
  }
}

resource "aws_lb_target_group_attachment" "dev_tg_attach_1" {
  target_group_arn = aws_lb_target_group.dev_tg.arn
  target_id        = aws_instance.dev_web_1.id
  port             = 80
}

resource "aws_lb_target_group_attachment" "dev_tg_attach_2" {
  target_group_arn = aws_lb_target_group.dev_tg.arn
  target_id        = aws_instance.dev_web_2.id
  port             = 80
}

# Outputs - exposing sensitive information without proper flags
output "dev_db_endpoint" {
  description = "Dev database endpoint"
  value       = aws_db_instance.dev_postgres.endpoint
  # Missing sensitive = true flag
}

output "dev_db_password" {
  description = "Dev database password"
  value       = aws_db_instance.dev_postgres.password
  # Missing sensitive = true flag - SECURITY ISSUE
}

output "staging_db_endpoint" {
  description = "Staging database endpoint"
  value       = aws_db_instance.staging_postgres.endpoint
}

output "dev_alb_dns" {
  description = "Dev ALB DNS name"
  value       = aws_lb.dev_alb.dns_name
}

output "dev_web_instance_ids" {
  description = "Dev web server instance IDs"
  value       = [aws_instance.dev_web_1.id, aws_instance.dev_web_2.id]
}
