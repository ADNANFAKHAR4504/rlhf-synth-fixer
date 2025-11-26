# ============================================================================
# VARIABLES
# ============================================================================

variable "primary_region" {
  description = "Primary AWS region for the trading platform"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr_blocks" {
  description = "CIDR blocks for VPCs in primary and secondary regions"
  type = object({
    primary   = string
    secondary = string
  })
  default = {
    primary   = "10.0.0.0/16"
    secondary = "10.1.0.0/16"
  }
}

variable "domain_name" {
  description = "Domain name for Route53 hosted zone"
  type        = string
  default     = "trading-platform-domain-iac.com"
}

variable "rds_instance_class" {
  description = "RDS instance class for database"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "secondary_rds_kms_key_id" {
  description = "KMS key ARN or alias in the secondary region for encrypting the read replica"
  type        = string
  default     = null
}

variable "app_instance_count" {
  description = "Number of application instances per region"
  type        = number
  default     = 1
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "pv2"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "pd"
}

# ============================================================================
# LOCALS
# ============================================================================

resource "random_id" "deployment" {
  byte_length = 4
}

resource "random_password" "db_master" {
  length           = 24
  special          = true
  override_special = "!#$&*()-_=+"
}

locals {
  # Naming convention
  resource_prefix = "${var.project_name}-${var.environment}"
  unique_suffix   = random_id.deployment.hex
  
  # Common tags
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Purpose     = "DR-Architecture"
    Deployment  = local.unique_suffix
    iac-rlhf-amazon = "true"
    team = 2
  }
  
  # Region-specific tags
  primary_tags = merge(local.common_tags, {
    Region = var.primary_region
    Role   = "Primary"
  })
  
  secondary_tags = merge(local.common_tags, {
    Region = var.secondary_region
    Role   = "Secondary"
  })
  
  # Subnet CIDR calculations
  subnets = {
    primary = {
      public = [
        cidrsubnet(var.vpc_cidr_blocks.primary, 4, 0),
        cidrsubnet(var.vpc_cidr_blocks.primary, 4, 1)
      ]
      private = [
        cidrsubnet(var.vpc_cidr_blocks.primary, 4, 2),
        cidrsubnet(var.vpc_cidr_blocks.primary, 4, 3)
      ]
      data = [
        cidrsubnet(var.vpc_cidr_blocks.primary, 4, 4),
        cidrsubnet(var.vpc_cidr_blocks.primary, 4, 5)
      ]
    }
    secondary = {
      public = [
        cidrsubnet(var.vpc_cidr_blocks.secondary, 4, 0),
        cidrsubnet(var.vpc_cidr_blocks.secondary, 4, 1)
      ]
      private = [
        cidrsubnet(var.vpc_cidr_blocks.secondary, 4, 2),
        cidrsubnet(var.vpc_cidr_blocks.secondary, 4, 3)
      ]
      data = [
        cidrsubnet(var.vpc_cidr_blocks.secondary, 4, 4),
        cidrsubnet(var.vpc_cidr_blocks.secondary, 4, 5)
      ]
    }
  }
  
  # Health check configuration
  health_check_config = {
    interval            = 30
    timeout             = 5
    unhealthy_threshold = 2
    healthy_threshold   = 3
    matcher             = "200"
    path                = "/health"
  }
  
  # Failover TTL (low for rapid convergence)
  dns_ttl = 60

  # Application bootstrap templates
  app_user_data_template = "${path.module}/templates/app_user_data.sh.tmpl"
  app_source             = file("${path.module}/templates/example_app.py")
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

data "aws_ami" "app_primary" {
  provider    = aws.primary
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "app_secondary" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# ============================================================================
# VPC - PRIMARY REGION
# ============================================================================

resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_blocks.primary
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-vpc-primary"
  })
}

resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-igw-primary"
  })
}

# Public Subnets - Primary
resource "aws_subnet" "primary_public" {
  count                   = 2
  provider                = aws.primary
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.subnets.primary.public[count.index]
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-subnet-public-primary-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets - Primary (Application Tier)
resource "aws_subnet" "primary_private" {
  count             = 2
  provider          = aws.primary
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.subnets.primary.private[count.index]
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-subnet-private-primary-${count.index + 1}"
    Type = "Private"
  })
}

# Data Subnets - Primary (RDS)
resource "aws_subnet" "primary_data" {
  count             = 2
  provider          = aws.primary
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.subnets.primary.data[count.index]
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-subnet-data-primary-${count.index + 1}"
    Type = "Data"
  })
}

# NAT Gateways - Primary
resource "aws_eip" "primary_nat" {
  count    = 2
  provider = aws.primary
  domain   = "vpc"
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-eip-nat-primary-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "primary" {
  count         = 2
  provider      = aws.primary
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-nat-primary-${count.index + 1}"
  })
}

# Route Tables - Primary
resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-rt-public-primary"
  })
}

resource "aws_route_table" "primary_private" {
  count    = 2
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-rt-private-primary-${count.index + 1}"
  })
}

# Route Table Associations - Primary
resource "aws_route_table_association" "primary_public" {
  count          = 2
  provider       = aws.primary
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  count          = 2
  provider       = aws.primary
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

resource "aws_route_table_association" "primary_data" {
  count          = 2
  provider       = aws.primary
  subnet_id      = aws_subnet.primary_data[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# ============================================================================
# VPC - SECONDARY REGION
# ============================================================================

resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr_blocks.secondary
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-vpc-secondary"
  })
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-igw-secondary"
  })
}

# Public Subnets - Secondary
resource "aws_subnet" "secondary_public" {
  count                   = 2
  provider                = aws.secondary
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.subnets.secondary.public[count.index]
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-subnet-public-secondary-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets - Secondary
resource "aws_subnet" "secondary_private" {
  count             = 2
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.subnets.secondary.private[count.index]
  availability_zone = data.aws_availability_zones.secondary.names[count.index]
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-subnet-private-secondary-${count.index + 1}"
    Type = "Private"
  })
}

# Data Subnets - Secondary
resource "aws_subnet" "secondary_data" {
  count             = 2
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.subnets.secondary.data[count.index]
  availability_zone = data.aws_availability_zones.secondary.names[count.index]
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-subnet-data-secondary-${count.index + 1}"
    Type = "Data"
  })
}

# NAT Gateways - Secondary
resource "aws_eip" "secondary_nat" {
  count    = 2
  provider = aws.secondary
  domain   = "vpc"
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-eip-nat-secondary-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "secondary" {
  count         = 2
  provider      = aws.secondary
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-nat-secondary-${count.index + 1}"
  })
}

# Route Tables - Secondary
resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-rt-public-secondary"
  })
}

resource "aws_route_table" "secondary_private" {
  count    = 2
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-rt-private-secondary-${count.index + 1}"
  })
}

# Route Table Associations - Secondary
resource "aws_route_table_association" "secondary_public" {
  count          = 2
  provider       = aws.secondary
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private" {
  count          = 2
  provider       = aws.secondary
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

resource "aws_route_table_association" "secondary_data" {
  count          = 2
  provider       = aws.secondary
  subnet_id      = aws_subnet.secondary_data[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# ALB Security Group - Primary
resource "aws_security_group" "alb_primary" {
  provider    = aws.primary
  name_prefix = "${local.resource_prefix}-alb-primary-"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
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
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-sg-alb-primary"
  })
}

# Application Security Group - Primary
resource "aws_security_group" "app_primary" {
  provider    = aws.primary
  name_prefix = "${local.resource_prefix}-app-primary-"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_primary.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-sg-app-primary"
  })
}

# Database Security Group - Primary
resource "aws_security_group" "db_primary" {
  provider    = aws.primary
  name_prefix = "${local.resource_prefix}-db-primary-"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_primary.id]
  }

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_blocks.secondary]
    description = "Allow secondary region instances to reach primary DB"
  }
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-sg-db-primary"
  })
}

# ALB Security Group - Secondary
resource "aws_security_group" "alb_secondary" {
  provider    = aws.secondary
  name_prefix = "${local.resource_prefix}-alb-secondary-"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
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
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-sg-alb-secondary"
  })
}

# Application Security Group - Secondary
resource "aws_security_group" "app_secondary" {
  provider    = aws.secondary
  name_prefix = "${local.resource_prefix}-app-secondary-"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_secondary.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-sg-app-secondary"
  })
}

# Database Security Group - Secondary
resource "aws_security_group" "db_secondary" {
  provider    = aws.secondary
  name_prefix = "${local.resource_prefix}-db-secondary-"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_secondary.id]
  }

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_blocks.primary]
    description = "Allow primary region instances to reach secondary DB"
  }
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-sg-db-secondary"
  })
}

# ============================================================================
# IAM ROLES
# ============================================================================

# EC2 Instance Role
resource "aws_iam_role" "app_instance" {
  name = "${local.resource_prefix}-app-instance-role"
  
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
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "app_instance_ssm" {
  role       = aws_iam_role.app_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "app_instance_cw_agent" {
  role       = aws_iam_role.app_instance.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "app" {
  name = "${local.resource_prefix}-app-instance-profile"
  role = aws_iam_role.app_instance.name
}

# ============================================================================
# EC2 INSTANCES - PRIMARY
# ============================================================================

resource "aws_instance" "app_primary" {
  count                  = var.app_instance_count
  provider               = aws.primary
  ami                    = data.aws_ami.app_primary.id
  instance_type          = "t3.medium"
  subnet_id              = aws_subnet.primary_private[count.index % 2].id
  vpc_security_group_ids = [aws_security_group.app_primary.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name
  
  user_data = templatefile(local.app_user_data_template, {
    app_source    = local.app_source
    db_write_host = aws_db_instance.primary.address
    db_read_host  = aws_db_instance.primary.address
    db_password   = replace(random_password.db_master.result, "%", "%%")
    cw_log_group  = aws_cloudwatch_log_group.app_primary.name
    app_log_path  = "/var/log/example-app/app.log"
  })
  user_data_replace_on_change = true

  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-app-primary-${count.index + 1}"
  })
}

# ============================================================================
# EC2 INSTANCES - SECONDARY
# ============================================================================

resource "aws_instance" "app_secondary" {
  count                  = var.app_instance_count
  provider               = aws.secondary
  ami                    = data.aws_ami.app_secondary.id
  instance_type          = "t3.medium"
  subnet_id              = aws_subnet.secondary_private[count.index % 2].id
  vpc_security_group_ids = [aws_security_group.app_secondary.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name
  
  user_data = templatefile(local.app_user_data_template, {
    app_source    = local.app_source
    db_write_host = aws_db_instance.secondary.address
    db_read_host  = aws_db_instance.secondary.address
    db_password   = replace(random_password.db_master.result, "%", "%%")
    cw_log_group  = aws_cloudwatch_log_group.app_secondary.name
    app_log_path  = "/var/log/example-app/app.log"
  })
  user_data_replace_on_change = true

  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-app-secondary-${count.index + 1}"
  })
}

# ============================================================================
# APPLICATION LOAD BALANCER - PRIMARY
# ============================================================================

resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "${local.resource_prefix}-alb-primary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_primary.id]
  subnets            = aws_subnet.primary_public[*].id
  
  enable_deletion_protection = false
  enable_http2               = true
  enable_cross_zone_load_balancing = true
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-alb-primary"
  })
}

resource "aws_lb_target_group" "primary" {
  provider    = aws.primary
  name        = "${local.resource_prefix}-tg-primary"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary.id
  target_type = "instance"
  
  health_check {
    enabled             = true
    healthy_threshold   = local.health_check_config.healthy_threshold
    unhealthy_threshold = local.health_check_config.unhealthy_threshold
    timeout             = local.health_check_config.timeout
    interval            = local.health_check_config.interval
    path                = local.health_check_config.path
    matcher             = local.health_check_config.matcher
  }
  
  deregistration_delay = 30
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-tg-primary"
  })
}

resource "aws_lb_target_group_attachment" "primary" {
  count            = var.app_instance_count
  provider         = aws.primary
  target_group_arn = aws_lb_target_group.primary.arn
  target_id        = aws_instance.app_primary[count.index].id
  port             = 8080
}

resource "aws_lb_listener" "primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}

# ============================================================================
# APPLICATION LOAD BALANCER - SECONDARY
# ============================================================================

resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "${local.resource_prefix}-alb-secondary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_secondary.id]
  subnets            = aws_subnet.secondary_public[*].id
  
  enable_deletion_protection = false
  enable_http2               = true
  enable_cross_zone_load_balancing = true
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-alb-secondary"
  })
}

resource "aws_lb_target_group" "secondary" {
  provider    = aws.secondary
  name        = "${local.resource_prefix}-tg-secondary"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.secondary.id
  target_type = "instance"
  
  health_check {
    enabled             = true
    healthy_threshold   = local.health_check_config.healthy_threshold
    unhealthy_threshold = local.health_check_config.unhealthy_threshold
    timeout             = local.health_check_config.timeout
    interval            = local.health_check_config.interval
    path                = local.health_check_config.path
    matcher             = local.health_check_config.matcher
  }
  
  deregistration_delay = 30
  
  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-tg-secondary"
  })
}

resource "aws_lb_target_group_attachment" "secondary" {
  count            = var.app_instance_count
  provider         = aws.secondary
  target_group_arn = aws_lb_target_group.secondary.arn
  target_id        = aws_instance.app_secondary[count.index].id
  port             = 8080
}

resource "aws_lb_listener" "secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }
}

# ============================================================================
# ROUTE53
# ============================================================================

resource "aws_route53_zone" "main" {
  name = var.domain_name
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-zone"
  })
}

# Health Check for Primary ALB
resource "aws_route53_health_check" "primary" {
  fqdn              = aws_lb.primary.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-healthcheck-primary"
  })
}

# Primary Failover Record
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.domain_name}"
  type    = "A"

  set_identifier = "PRIMARY"
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
  
  health_check_id = aws_route53_health_check.primary.id
}

# Secondary Failover Record
resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.domain_name}"
  type    = "A"

  set_identifier = "SECONDARY"
  
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}

# ============================================================================
# RDS - PRIMARY
# ============================================================================

resource "aws_db_subnet_group" "primary" {
  provider    = aws.primary
  name        = "${local.resource_prefix}-db-subnet-primary"
  subnet_ids  = aws_subnet.primary_data[*].id
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-db-subnet-primary"
  })
}

resource "aws_db_subnet_group" "secondary" {
  provider    = aws.secondary
  name        = "${local.resource_prefix}-db-subnet-secondary"
  subnet_ids  = aws_subnet.secondary_data[*].id

  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-db-subnet-secondary"
  })
}
resource "aws_db_instance" "primary" {
  provider               = aws.primary
  identifier             = "${local.resource_prefix}-db-primary"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = var.rds_instance_class
  allocated_storage      = 100
  storage_encrypted      = true
  storage_type           = "gp3"
  
  db_name  = "tradingdb"
  username = "admin"
  password = random_password.db_master.result
  
  vpc_security_group_ids = [aws_security_group.db_primary.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  
  deletion_protection = false
  skip_final_snapshot = false
  final_snapshot_identifier = "${local.resource_prefix}-db-primary-final-${local.unique_suffix}"
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-db-primary"
  })
}

# ============================================================================
# RDS - SECONDARY (Read Replica)
# ============================================================================

resource "aws_kms_key" "rds_secondary" {
  provider                = aws.secondary
  description             = "KMS key for RDS read replica (secondary region)"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags = merge(local.secondary_tags, { Name = "${local.resource_prefix}-rds-kms" })
}

resource "aws_kms_alias" "rds_secondary" {
  provider      = aws.secondary
  name          = "alias/${local.resource_prefix}-rds"
  target_key_id = aws_kms_key.rds_secondary.key_id
}

resource "aws_db_instance" "secondary" {
  provider                   = aws.secondary
  identifier                 = "${local.resource_prefix}-db-secondary"
  replicate_source_db        = aws_db_instance.primary.arn
  instance_class             = var.rds_instance_class
  storage_encrypted          = true
  kms_key_id                 = aws_kms_alias.rds_secondary.arn
  vpc_security_group_ids     = [aws_security_group.db_secondary.id]
  db_subnet_group_name       = aws_db_subnet_group.secondary.name

  skip_final_snapshot        = true
  deletion_protection        = false

  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-db-secondary"
  })
}

# ============================================================================
# DYNAMODB GLOBAL TABLES
# ============================================================================

resource "aws_dynamodb_table" "primary" {
  provider         = aws.primary
  name             = "${local.resource_prefix}-global-table"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  point_in_time_recovery {
    enabled = true
  }
  
  attribute {
    name = "id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  replica {
    region_name = var.secondary_region
  }

  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-global-table"
  })
}

# ============================================================================
# LAMBDA FAILOVER FUNCTIONS
# ============================================================================

# Lambda IAM Role
resource "aws_iam_role" "lambda_failover" {
  name = "${local.resource_prefix}-lambda-failover-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_failover" {
  name = "${local.resource_prefix}-lambda-failover-policy"
  role = aws_iam_role.lambda_failover.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
          "rds:PromoteReadReplica",
          "rds:ModifyDBInstance",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:GetHealthCheck",
          "route53:ListResourceRecordSets"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:RunInstances",
          "ec2:TerminateInstances",
          "autoscaling:UpdateAutoScalingGroup"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Failover Function Code
resource "aws_lambda_function" "failover" {
  provider         = aws.primary
  filename         = "failover_lambda.zip"
  function_name    = "${local.resource_prefix}-failover"
  role            = aws_iam_role.lambda_failover.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_failover.output_base64sha256
  runtime         = "python3.11"
  timeout         = 300
  memory_size     = 512
  
  environment {
    variables = {
      SECONDARY_REGION     = var.secondary_region
      SECONDARY_DB_ID      = aws_db_instance.secondary.id
      HOSTED_ZONE_ID       = aws_route53_zone.main.zone_id
      DOMAIN_NAME          = var.domain_name
      SECONDARY_ALB_DNS    = aws_lb.secondary.dns_name
      SECONDARY_ALB_ZONE   = aws_lb.secondary.zone_id
    }
  }
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-lambda-failover"
  })
}

# Lambda Function Archive
data "archive_file" "lambda_failover" {
  type        = "zip"
  output_path = "failover_lambda.zip"
  
  source {
    content  = <<-EOF
import json
import boto3
import os
import time
from datetime import datetime

def handler(event, context):
    """
    Orchestrate failover to secondary region
    """
    print(f"Failover initiated at {datetime.utcnow()}")
    print(f"Event: {json.dumps(event)}")
    
    secondary_region = os.environ['SECONDARY_REGION']
    secondary_db_id = os.environ['SECONDARY_DB_ID']
    hosted_zone_id = os.environ['HOSTED_ZONE_ID']
    domain_name = os.environ['DOMAIN_NAME']
    
    # Initialize AWS clients
    rds_client = boto3.client('rds', region_name=secondary_region)
    route53_client = boto3.client('route53')
    cloudwatch = boto3.client('cloudwatch')
    
    response = {
        'statusCode': 200,
        'steps': []
    }
    
    try:
        # Step 1: Promote RDS Read Replica
        print(f"Promoting read replica: {secondary_db_id}")
        rds_response = rds_client.promote_read_replica(
            DBInstanceIdentifier=secondary_db_id,
            BackupRetentionPeriod=30
        )
        response['steps'].append({
            'step': 'RDS Promotion',
            'status': 'Initiated',
            'db_status': rds_response['DBInstance']['DBInstanceStatus']
        })
        
        # Step 2: Wait for promotion to complete
        waiter = rds_client.get_waiter('db_instance_available')
        waiter.wait(
            DBInstanceIdentifier=secondary_db_id,
            WaiterConfig={
                'Delay': 30,
                'MaxAttempts': 20
            }
        )
        response['steps'].append({
            'step': 'RDS Promotion',
            'status': 'Completed'
        })
        
        # Step 3: Update Route53 if needed
        # The failover routing policy should handle this automatically
        # This is a placeholder for additional DNS updates if required
        
        # Step 4: Send CloudWatch metrics
        cloudwatch.put_metric_data(
            Namespace='DisasterRecovery',
            MetricData=[
                {
                    'MetricName': 'FailoverExecuted',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
        
        response['message'] = 'Failover completed successfully'
        
    except Exception as e:
        print(f"Error during failover: {str(e)}")
        response['statusCode'] = 500
        response['error'] = str(e)
        
        # Send failure metric
        cloudwatch.put_metric_data(
            Namespace='DisasterRecovery',
            MetricData=[
                {
                    'MetricName': 'FailoverFailed',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    
    return response
EOF
    filename = "index.py"
  }
}

# CloudWatch Event Rule for Failover Trigger
resource "aws_cloudwatch_event_rule" "failover_trigger" {
  provider    = aws.primary
  name        = "${local.resource_prefix}-failover-trigger"
  description = "Trigger failover on health check failure"
  
  event_pattern = jsonencode({
    source      = ["aws.route53"]
    detail-type = ["Route 53 Health Check Status Change"]
    detail = {
      healthCheckId = [aws_route53_health_check.primary.id]
      newState      = ["UNHEALTHY"]
    }
  })
}

resource "aws_cloudwatch_event_target" "failover_lambda" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.failover_trigger.name
  target_id = "FailoverLambda"
  arn       = aws_lambda_function.failover.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.failover_trigger.arn
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "primary_health" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-primary-health-alarm"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Primary region health check alarm"
  
  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-primary-health-alarm"
  })
}

resource "aws_cloudwatch_log_group" "lambda_failover" {
  provider          = aws.primary
  name              = "/aws/lambda/${aws_lambda_function.failover.function_name}"
  retention_in_days = 7
  
  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-lambda-logs"
  })
}

resource "aws_cloudwatch_log_group" "app_primary" {
  provider          = aws.primary
  name              = "/ec2/${local.resource_prefix}/app-primary"
  retention_in_days = 7

  tags = merge(local.primary_tags, {
    Name = "${local.resource_prefix}-app-primary-logs"
  })
}

resource "aws_cloudwatch_log_group" "app_secondary" {
  provider          = aws.secondary
  name              = "/ec2/${local.resource_prefix}/app-secondary"
  retention_in_days = 7

  tags = merge(local.secondary_tags, {
    Name = "${local.resource_prefix}-app-secondary-logs"
  })
}

# ============================================================================
# OUTPUTS
# ============================================================================

# VPC Outputs
output "vpc_primary_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "vpc_secondary_id" {
  description = "Secondary VPC ID"
  value       = aws_vpc.secondary.id
}

# Subnet Outputs
output "subnets_primary_public" {
  description = "Primary region public subnet IDs"
  value       = aws_subnet.primary_public[*].id
}

output "subnets_primary_private" {
  description = "Primary region private subnet IDs"
  value       = aws_subnet.primary_private[*].id
}

output "subnets_secondary_public" {
  description = "Secondary region public subnet IDs"
  value       = aws_subnet.secondary_public[*].id
}

output "subnets_secondary_private" {
  description = "Secondary region private subnet IDs"
  value       = aws_subnet.secondary_private[*].id
}

# ALB Outputs
output "alb_primary_dns" {
  description = "Primary ALB DNS name"
  value       = aws_lb.primary.dns_name
}

output "alb_secondary_dns" {
  description = "Secondary ALB DNS name"
  value       = aws_lb.secondary.dns_name
}

output "alb_primary_arn" {
  description = "Primary ALB ARN"
  value       = aws_lb.primary.arn
}

output "alb_secondary_arn" {
  description = "Secondary ALB ARN"
  value       = aws_lb.secondary.arn
}

# Route53 Outputs
output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_app_endpoint" {
  description = "Application endpoint with failover"
  value       = "app.${var.domain_name}"
}

output "route53_health_check_id" {
  description = "Primary region health check ID"
  value       = aws_route53_health_check.primary.id
}

# RDS Outputs
output "rds_primary_endpoint" {
  description = "Primary RDS instance endpoint"
  value       = aws_db_instance.primary.endpoint
  sensitive   = true
}

output "rds_primary_arn" {
  description = "Primary RDS instance ARN"
  value       = aws_db_instance.primary.arn
}

output "rds_secondary_endpoint" {
  description = "Secondary RDS read replica endpoint"
  value       = aws_db_instance.secondary.endpoint
  sensitive   = true
}

output "rds_secondary_arn" {
  description = "Secondary RDS read replica ARN"
  value       = aws_db_instance.secondary.arn
}

# DynamoDB Outputs
output "dynamodb_table_arn" {
  description = "DynamoDB global table ARN"
  value       = aws_dynamodb_table.primary.arn
}

output "dynamodb_table_name" {
  description = "DynamoDB global table name"
  value       = aws_dynamodb_table.primary.name
}

output "dynamodb_stream_arn" {
  description = "DynamoDB table stream ARN"
  value       = aws_dynamodb_table.primary.stream_arn
}

# Lambda Outputs
output "lambda_failover_arn" {
  description = "Failover Lambda function ARN"
  value       = aws_lambda_function.failover.arn
}

output "lambda_failover_name" {
  description = "Failover Lambda function name"
  value       = aws_lambda_function.failover.function_name
}

# EC2 Instance Outputs
output "instances_primary_ids" {
  description = "Primary region EC2 instance IDs"
  value       = aws_instance.app_primary[*].id
}

output "instances_secondary_ids" {
  description = "Secondary region EC2 instance IDs"
  value       = aws_instance.app_secondary[*].id
}

# Deployment Info
output "deployment_id" {
  description = "Unique deployment identifier"
  value       = local.unique_suffix
}

output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}
