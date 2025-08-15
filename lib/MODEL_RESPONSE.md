# Multi-Region High Availability Infrastructure with AWS Application Recovery Controller

This infrastructure creates a comprehensive multi-region high availability setup across US-West-2 (primary) and US-East-1 (secondary) regions using the latest AWS features including Application Recovery Controller (ARC) and enhanced Route 53 health checks with zonal shift capabilities.

## Architecture Overview

The solution implements:
- **Multi-Region VPC Setup**: Primary (us-west-2) and secondary (us-east-1) regions with 3 AZs each
- **Load Balanced EC2 Instances**: Auto Scaling Groups with Application Load Balancers in each region
- **Multi-AZ RDS**: Primary database with Multi-AZ deployment and cross-region read replicas
- **Route 53 Health Checks**: DNS failover with Application Recovery Controller integration
- **SNS Notifications**: Monitoring and alerting for failover events
- **AWS ARC Integration**: Zonal shift capabilities and recovery readiness checks
- **Cross-Region Failover**: Automated failover mechanisms with Route 53 ARC

## File Structure

### variables.tf
```hcl
variable "aws_region_primary" {
  description = "Primary AWS region"
  type        = string
  default     = "us-west-2"
}

variable "aws_region_secondary" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "multi-region-ha"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    ManagedBy   = "terraform"
    Project     = "MultiRegionHA"
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 4
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "dbadmin"
}

variable "notification_email" {
  description = "Email for SNS notifications"
  type        = string
  default     = "admin@example.com"
}
```

### providers.tf
```hcl
terraform {
  required_version = ">= 1.4.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.1"
    }
  }
  
  backend "s3" {}
}

# Primary region provider
provider "aws" {
  region = var.aws_region_primary
  alias  = "primary"
}

# Secondary region provider
provider "aws" {
  region = var.aws_region_secondary
  alias  = "secondary"
}

# Default provider (primary region)
provider "aws" {
  region = var.aws_region_primary
}

# Route 53 ARC requires us-west-2 for control plane operations
provider "aws" {
  region = "us-west-2"
  alias  = "arc"
}
```

### data.tf
```hcl
# Get available AZs for primary region
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

# Get available AZs for secondary region
data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "amazon_linux_primary" {
  provider    = aws.primary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get latest Amazon Linux 2 AMI for secondary region
data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Current AWS caller identity
data "aws_caller_identity" "current" {}

# Current AWS region
data "aws_region" "current" {
  provider = aws.primary
}
```

### vpc.tf
```hcl
# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-vpc"
    Region = var.aws_region_primary
  })
}

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-vpc"
    Region = var.aws_region_secondary
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-igw"
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-igw"
  })
}

# Primary Public Subnets
resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = min(3, length(data.aws_availability_zones.primary.names))
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-public-${count.index + 1}"
    Type = "public"
  })
}

# Primary Private Subnets
resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = min(3, length(data.aws_availability_zones.primary.names))
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-private-${count.index + 1}"
    Type = "private"
  })
}

# Secondary Public Subnets
resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = min(3, length(data.aws_availability_zones.secondary.names))
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-public-${count.index + 1}"
    Type = "public"
  })
}

# Secondary Private Subnets
resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = min(3, length(data.aws_availability_zones.secondary.names))
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-private-${count.index + 1}"
    Type = "private"
  })
}

# NAT Gateways for Primary Region
resource "aws_eip" "primary_nat" {
  provider = aws.primary
  count    = min(3, length(data.aws_availability_zones.primary.names))
  domain   = "vpc"

  depends_on = [aws_internet_gateway.primary]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  count         = min(3, length(data.aws_availability_zones.primary.names))
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  depends_on = [aws_internet_gateway.primary]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-nat-${count.index + 1}"
  })
}

# NAT Gateways for Secondary Region
resource "aws_eip" "secondary_nat" {
  provider = aws.secondary
  count    = min(3, length(data.aws_availability_zones.secondary.names))
  domain   = "vpc"

  depends_on = [aws_internet_gateway.secondary]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  count         = min(3, length(data.aws_availability_zones.secondary.names))
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  depends_on = [aws_internet_gateway.secondary]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-nat-${count.index + 1}"
  })
}

# Route Tables for Primary Region
resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-public-rt"
  })
}

resource "aws_route_table" "primary_private" {
  provider = aws.primary
  count    = min(3, length(data.aws_availability_zones.primary.names))
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-private-rt-${count.index + 1}"
  })
}

# Route Tables for Secondary Region
resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-public-rt"
  })
}

resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  count    = min(3, length(data.aws_availability_zones.secondary.names))
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-private-rt-${count.index + 1}"
  })
}

# Route Table Associations for Primary Region
resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = length(aws_subnet.primary_private)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# Route Table Associations for Secondary Region
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = length(aws_subnet.secondary_private)
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}
```

### security-groups.tf
```hcl
# Security Group for ALB - Primary Region
resource "aws_security_group" "primary_alb" {
  provider    = aws.primary
  name        = "${var.project_name}-primary-alb-sg"
  description = "Security group for Primary ALB"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-alb-sg"
  })
}

# Security Group for ALB - Secondary Region
resource "aws_security_group" "secondary_alb" {
  provider    = aws.secondary
  name        = "${var.project_name}-secondary-alb-sg"
  description = "Security group for Secondary ALB"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-alb-sg"
  })
}

# Security Group for EC2 instances - Primary Region
resource "aws_security_group" "primary_ec2" {
  provider    = aws.primary
  name        = "${var.project_name}-primary-ec2-sg"
  description = "Security group for Primary EC2 instances"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.primary.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-ec2-sg"
  })
}

# Security Group for EC2 instances - Secondary Region
resource "aws_security_group" "secondary_ec2" {
  provider    = aws.secondary
  name        = "${var.project_name}-secondary-ec2-sg"
  description = "Security group for Secondary EC2 instances"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.secondary.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-ec2-sg"
  })
}

# Security Group for RDS - Primary Region
resource "aws_security_group" "primary_rds" {
  provider    = aws.primary
  name        = "${var.project_name}-primary-rds-sg"
  description = "Security group for Primary RDS"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-rds-sg"
  })
}

# Security Group for RDS - Secondary Region
resource "aws_security_group" "secondary_rds" {
  provider    = aws.secondary
  name        = "${var.project_name}-secondary-rds-sg"
  description = "Security group for Secondary RDS"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-rds-sg"
  })
}
```

### alb.tf
```hcl
# Application Load Balancer - Primary Region
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "${var.project_name}-primary-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false
  enable_cross_zone_load_balancing = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-alb"
  })
}

# Application Load Balancer - Secondary Region
resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "${var.project_name}-secondary-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false
  enable_cross_zone_load_balancing = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-alb"
  })
}

# Target Group - Primary Region
resource "aws_lb_target_group" "primary" {
  provider = aws.primary
  name     = "${var.project_name}-primary-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-tg"
  })
}

# Target Group - Secondary Region
resource "aws_lb_target_group" "secondary" {
  provider = aws.secondary
  name     = "${var.project_name}-secondary-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-tg"
  })
}

# Listener - Primary Region
resource "aws_lb_listener" "primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-listener"
  })
}

# Listener - Secondary Region
resource "aws_lb_listener" "secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-listener"
  })
}
```

### outputs.tf
```hcl
output "primary_alb_dns" {
  description = "DNS name of the primary Application Load Balancer"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns" {
  description = "DNS name of the secondary Application Load Balancer"
  value       = aws_lb.secondary.dns_name
}

output "route53_zone_name" {
  description = "Route 53 hosted zone name"
  value       = aws_route53_zone.main.name
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "primary_db_endpoint" {
  description = "Primary RDS instance endpoint"
  value       = aws_db_instance.primary.endpoint
  sensitive   = true
}

output "secondary_db_endpoint" {
  description = "Secondary RDS read replica endpoint"
  value       = aws_db_instance.secondary_replica.endpoint
  sensitive   = true
}

output "application_url" {
  description = "Main application URL using Route 53"
  value       = "http://${aws_route53_zone.main.name}"
}

output "secrets_manager_secret_arn" {
  description = "ARN of the database password secret in Secrets Manager"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}
```