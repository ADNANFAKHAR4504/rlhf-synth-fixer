# ------------------------------------------------------------------------------
# VARIABLES
# ------------------------------------------------------------------------------

variable "is_localstack" {
  description = "Set to true when deploying to LocalStack"
  type        = bool
  default     = false
}

variable "fallback_ami_id" {
  description = "Fallback AMI ID for LocalStack"
  type        = string
  default     = "ami-00000000000000000"
}

variable "enable_secondary_region" {
  description = "Enable secondary region resources (disable for LocalStack)"
  type        = bool
  default     = true
}

variable "enable_rds" {
  description = "Enable RDS resources"
  type        = bool
  default     = true
}

variable "enable_asg" {
  description = "Enable Auto Scaling Group resources"
  type        = bool
  default     = true
}

variable "enable_route53" {
  description = "Enable Route 53 resources"
  type        = bool
  default     = true
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway resources"
  type        = bool
  default     = true
}

variable "db_username" {
  description = "Username for the RDS PostgreSQL database."
  type        = string
  default     = "novaadmin"
}

variable "domain_name" {
  description = "A domain name you own, to be used for Route 53."
  type        = string
  default     = "meerio.com"
}

variable "allowed_ssh_cidr" {
  description = "The CIDR block allowed to SSH into the EC2 instances. Should be your IP."
  type        = list(string)
  default     = ["10.0.0.0/8"] # More restrictive than 0.0.0.0/0 for production
}

# ------------------------------------------------------------------------------
# LOCALS
# ------------------------------------------------------------------------------

locals {
  # A unique suffix for resource naming to avoid collisions.
  deployment_suffix = 291295

  common_tags = {
    Project     = "IaC - AWS Nova Model Breaking"
    Environment = "Production"
    Owner       = "DevOps-Team"
    ManagedBy   = "terraform"
  }
  key_name = "nova-key-${local.deployment_suffix}"
}

# ------------------------------------------------------------------------------
# GLOBAL & SHARED RESOURCES
# ------------------------------------------------------------------------------

# Generate a random suffix for unique resource naming.
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Generate a secure password for the RDS database.
resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Generate an RSA key for SSH access.
resource "tls_private_key" "nova_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Save the private key locally for SSH access.
resource "local_file" "nova_key_pem" {
  content         = tls_private_key.nova_key.private_key_pem
  filename        = "${path.module}/${local.key_name}.pem"
  file_permission = "0400"
}

# Data source to get the current AWS Account ID for peering.
data "aws_caller_identity" "current" {}

# Data source for available AZs in the primary region.
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

# Data source for available AZs in the secondary region.
data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# Data source for the latest Amazon Linux 2 AMI in the primary region.
data "aws_ami" "amazon_linux_2_primary" {
  count       = var.is_localstack ? 0 : 1
  provider    = aws.primary
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Data source for the latest Amazon Linux 2 AMI in the secondary region.
data "aws_ami" "amazon_linux_2_secondary" {
  count       = var.is_localstack || !var.enable_secondary_region ? 0 : 1
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

locals {
  primary_ami_id   = var.is_localstack ? var.fallback_ami_id : data.aws_ami.amazon_linux_2_primary[0].id
  secondary_ami_id = var.is_localstack || !var.enable_secondary_region ? var.fallback_ami_id : data.aws_ami.amazon_linux_2_secondary[0].id
}

# ------------------------------------------------------------------------------
# PRIMARY REGION (us-east-1) RESOURCES
# ------------------------------------------------------------------------------

# --- Core Networking ---

resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.common_tags, { Name = "vpc-primary-${local.deployment_suffix}" })
}

resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(aws_vpc.primary.cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "subnet-public-primary-${count.index + 1}-${local.deployment_suffix}" })
}

resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(aws_vpc.primary.cidr_block, 8, count.index + 2)
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  tags              = merge(local.common_tags, { Name = "subnet-private-primary-${count.index + 1}-${local.deployment_suffix}" })
}

resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  tags     = merge(local.common_tags, { Name = "igw-primary-${local.deployment_suffix}" })
}

resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  tags = merge(local.common_tags, { Name = "rt-public-primary-${local.deployment_suffix}" })
}

resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_eip" "primary_nat" {
  count    = var.enable_nat_gateway ? 1 : 0
  provider = aws.primary
  domain   = "vpc"
  tags     = merge(local.common_tags, { Name = "eip-nat-primary-${local.deployment_suffix}" })
}

resource "aws_nat_gateway" "primary" {
  count         = var.enable_nat_gateway ? 1 : 0
  provider      = aws.primary
  allocation_id = aws_eip.primary_nat[0].id
  subnet_id     = aws_subnet.primary_public[0].id
  tags          = merge(local.common_tags, { Name = "nat-primary-${local.deployment_suffix}" })
  depends_on    = [aws_internet_gateway.primary]
}

resource "aws_route_table" "primary_private" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.primary[0].id
    }
  }

  # Route for VPC Peering (only when secondary region is enabled)
  dynamic "route" {
    for_each = var.enable_secondary_region ? [1] : []
    content {
      cidr_block                = aws_vpc.secondary[0].cidr_block
      vpc_peering_connection_id = aws_vpc_peering_connection.peer[0].id
    }
  }

  tags = merge(local.common_tags, { Name = "rt-private-primary-${local.deployment_suffix}" })
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = length(aws_subnet.primary_private)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

# --- Security ---

resource "aws_key_pair" "primary" {
  provider   = aws.primary
  key_name   = local.key_name
  public_key = tls_private_key.nova_key.public_key_openssh
}

resource "aws_security_group" "primary_alb" {
  provider    = aws.primary
  name_prefix = "alb-primary-"
  description = "Allow HTTP/HTTPS inbound traffic to ALB"
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
  tags = merge(local.common_tags, { Name = "sg-alb-primary-${local.deployment_suffix}" })
}

resource "aws_security_group" "primary_ec2" {
  provider    = aws.primary
  name_prefix = "ec2-primary-"
  description = "Allow web and SSH traffic"
  vpc_id      = aws_vpc.primary.id
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.common_tags, { Name = "sg-ec2-primary-${local.deployment_suffix}" })
}

resource "aws_security_group" "primary_rds" {
  provider    = aws.primary
  name_prefix = "rds-primary-"
  description = "Allow PostgreSQL traffic from EC2 instances"
  vpc_id      = aws_vpc.primary.id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ec2.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, { Name = "sg-rds-primary-${local.deployment_suffix}" })
}

# --- Compute ---

resource "aws_launch_template" "primary_app" {
  provider      = aws.primary
  name_prefix   = "lt-app-primary-${local.deployment_suffix}-"
  image_id      = local.primary_ami_id
  instance_type = "t2.micro"
  key_name      = aws_key_pair.primary.key_name

  # INLINED USER DATA SCRIPT
  # This removes the dependency on an external file.
  user_data = base64encode(<<-EOT
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Primary Region (us-east-1) - Deployment ${local.deployment_suffix}</h1>" > /var/www/html/index.html
    EOT
  )

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 10
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  vpc_security_group_ids = [aws_security_group.primary_ec2.id]
  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = "ec2-app-primary-${local.deployment_suffix}" })
  }
  tags = merge(local.common_tags, { Name = "lt-app-primary-${local.deployment_suffix}" })
}

resource "aws_autoscaling_group" "primary_app" {
  count               = var.enable_asg ? 1 : 0
  provider            = aws.primary
  name_prefix         = "asg-app-primary-${local.deployment_suffix}-"
  desired_capacity    = 2
  max_size            = 4
  min_size            = 1
  vpc_zone_identifier = [for subnet in aws_subnet.primary_private : subnet.id]
  launch_template {
    id      = aws_launch_template.primary_app.id
    version = "$Latest"
  }
  target_group_arns         = [aws_lb_target_group.primary_app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  tag {
    key                 = "Name"
    value               = "asg-primary-${local.deployment_suffix}"
    propagate_at_launch = true
  }
}

resource "aws_lb" "primary_app" {
  provider                   = aws.primary
  name_prefix                = "p-"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.primary_alb.id]
  subnets                    = [for subnet in aws_subnet.primary_public : subnet.id]
  enable_deletion_protection = false
  tags                       = merge(local.common_tags, { Name = "alb-app-primary-${local.deployment_suffix}" })
}

resource "aws_lb_target_group" "primary_app" {
  provider    = aws.primary
  name_prefix = "tprim-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary.id
  health_check {
    path                = "/"
    matcher             = "200"
    interval            = 30
    timeout             = 10
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
  tags = merge(local.common_tags, { Name = "tg-app-primary-${local.deployment_suffix}" })
}

resource "aws_lb_listener" "primary_app_http" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary_app.arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary_app.arn
  }
}

# --- Database ---

resource "aws_db_subnet_group" "primary_rds" {
  count       = var.enable_rds ? 1 : 0
  provider    = aws.primary
  name_prefix = "sng-rds-primary-"
  subnet_ids  = [for subnet in aws_subnet.primary_private : subnet.id]
  tags        = merge(local.common_tags, { Name = "sng-rds-primary-${local.deployment_suffix}" })

  # Add this lifecycle block
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_instance" "primary_db_new" {
  count                   = var.enable_rds ? 1 : 0
  provider                = aws.primary
  identifier              = "rds-postgres-primary-v2-${local.deployment_suffix}"
  allocated_storage       = 20
  storage_type            = "gp3"
  storage_encrypted       = true
  engine                  = "postgres"
  engine_version          = "17.4"
  instance_class          = "db.t3.micro"
  db_name                 = "novadb"
  username                = var.db_username
  password                = random_password.db_password.result
  db_subnet_group_name    = aws_db_subnet_group.primary_rds[0].name
  vpc_security_group_ids  = [aws_security_group.primary_rds.id]
  multi_az                = var.is_localstack ? false : true
  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false
  publicly_accessible     = false
  tags                    = merge(local.common_tags, { Name = "rds-postgres-primary-${local.deployment_suffix}" })

  depends_on = [aws_db_subnet_group.primary_rds]
}


# ------------------------------------------------------------------------------
# SECONDARY REGION (us-west-2) RESOURCES
# ------------------------------------------------------------------------------

# --- Core Networking ---

resource "aws_vpc" "secondary" {
  count                = var.enable_secondary_region ? 1 : 0
  provider             = aws.secondary
  cidr_block           = "10.2.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.common_tags, { Name = "vpc-secondary-${local.deployment_suffix}" })
}

resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = var.enable_secondary_region ? 2 : 0
  vpc_id                  = aws_vpc.secondary[0].id
  cidr_block              = cidrsubnet(aws_vpc.secondary[0].cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "subnet-public-secondary-${count.index + 1}-${local.deployment_suffix}" })
}

resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = var.enable_secondary_region ? 2 : 0
  vpc_id            = aws_vpc.secondary[0].id
  cidr_block        = cidrsubnet(aws_vpc.secondary[0].cidr_block, 8, count.index + 2)
  availability_zone = data.aws_availability_zones.secondary.names[count.index]
  tags              = merge(local.common_tags, { Name = "subnet-private-secondary-${count.index + 1}-${local.deployment_suffix}" })
}

resource "aws_internet_gateway" "secondary" {
  count    = var.enable_secondary_region ? 1 : 0
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary[0].id
  tags     = merge(local.common_tags, { Name = "igw-secondary-${local.deployment_suffix}" })
}

resource "aws_route_table" "secondary_public" {
  count    = var.enable_secondary_region ? 1 : 0
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary[0].id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary[0].id
  }
  tags = merge(local.common_tags, { Name = "rt-public-secondary-${local.deployment_suffix}" })
}

resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = var.enable_secondary_region ? length(aws_subnet.secondary_public) : 0
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public[0].id
}

resource "aws_eip" "secondary_nat" {
  count    = var.enable_secondary_region && var.enable_nat_gateway ? 1 : 0
  provider = aws.secondary
  domain   = "vpc"
  tags     = merge(local.common_tags, { Name = "eip-nat-secondary-${local.deployment_suffix}" })
}

resource "aws_nat_gateway" "secondary" {
  count         = var.enable_secondary_region && var.enable_nat_gateway ? 1 : 0
  provider      = aws.secondary
  allocation_id = aws_eip.secondary_nat[0].id
  subnet_id     = aws_subnet.secondary_public[0].id
  tags          = merge(local.common_tags, { Name = "nat-secondary-${local.deployment_suffix}" })
  depends_on    = [aws_internet_gateway.secondary]
}

resource "aws_route_table" "secondary_private" {
  count    = var.enable_secondary_region ? 1 : 0
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary[0].id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.secondary[0].id
    }
  }

  # Route for VPC Peering
  route {
    cidr_block                = aws_vpc.primary.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.peer[0].id
  }
  tags = merge(local.common_tags, { Name = "rt-private-secondary-${local.deployment_suffix}" })
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = var.enable_secondary_region ? length(aws_subnet.secondary_private) : 0
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[0].id
}

# --- Security ---

resource "aws_key_pair" "secondary" {
  count      = var.enable_secondary_region ? 1 : 0
  provider   = aws.secondary
  key_name   = local.key_name
  public_key = tls_private_key.nova_key.public_key_openssh
}

resource "aws_security_group" "secondary_alb" {
  count       = var.enable_secondary_region ? 1 : 0
  provider    = aws.secondary
  name_prefix = "alb-secondary-"
  description = "Allow HTTP/HTTPS inbound traffic to ALB"
  vpc_id      = aws_vpc.secondary[0].id
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
  tags = merge(local.common_tags, { Name = "sg-alb-secondary-${local.deployment_suffix}" })
}

resource "aws_security_group" "secondary_ec2" {
  count       = var.enable_secondary_region ? 1 : 0
  provider    = aws.secondary
  name_prefix = "ec2-secondary-"
  description = "Allow web and SSH traffic"
  vpc_id      = aws_vpc.secondary[0].id
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb[0].id]
  }
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.common_tags, { Name = "sg-ec2-secondary-${local.deployment_suffix}" })
}

# --- Compute ---

resource "aws_launch_template" "secondary_app" {
  count         = var.enable_secondary_region ? 1 : 0
  provider      = aws.secondary
  name_prefix   = "lt-app-secondary-${local.deployment_suffix}-"
  image_id      = local.secondary_ami_id
  instance_type = "t2.micro"
  key_name      = aws_key_pair.secondary[0].key_name

  # INLINED USER DATA SCRIPT
  user_data = base64encode(<<-EOT
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Secondary Region (us-west-2) - Deployment ${local.deployment_suffix}</h1>" > /var/www/html/index.html
    EOT
  )

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 10
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  vpc_security_group_ids = [aws_security_group.secondary_ec2[0].id]
  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = "ec2-app-secondary-${local.deployment_suffix}" })
  }
  tags = merge(local.common_tags, { Name = "lt-app-secondary-${local.deployment_suffix}" })
}

resource "aws_autoscaling_group" "secondary_app" {
  count               = var.enable_secondary_region && var.enable_asg ? 1 : 0
  provider            = aws.secondary
  name_prefix         = "asg-app-secondary-${local.deployment_suffix}-"
  desired_capacity    = 2
  max_size            = 4
  min_size            = 1
  vpc_zone_identifier = [for subnet in aws_subnet.secondary_private : subnet.id]
  launch_template {
    id      = aws_launch_template.secondary_app[0].id
    version = "$Latest"
  }
  target_group_arns         = [aws_lb_target_group.secondary_app[0].arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  tag {
    key                 = "Name"
    value               = "asg-secondary-${local.deployment_suffix}"
    propagate_at_launch = true
  }
}

resource "aws_lb" "secondary_app" {
  count                      = var.enable_secondary_region ? 1 : 0
  provider                   = aws.secondary
  name_prefix                = "s-"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.secondary_alb[0].id]
  subnets                    = [for subnet in aws_subnet.secondary_public : subnet.id]
  enable_deletion_protection = false
  tags                       = merge(local.common_tags, { Name = "alb-app-secondary-${local.deployment_suffix}" })
}

resource "aws_lb_target_group" "secondary_app" {
  count       = var.enable_secondary_region ? 1 : 0
  provider    = aws.secondary
  name_prefix = "tsec-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.secondary[0].id
  health_check {
    path    = "/"
    matcher = "200"
  }
  tags = merge(local.common_tags, { Name = "tg-app-secondary-${local.deployment_suffix}" })
}

resource "aws_lb_listener" "secondary_app_http" {
  count             = var.enable_secondary_region ? 1 : 0
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary_app[0].arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary_app[0].arn
  }
}

# ------------------------------------------------------------------------------
# CROSS-REGION & GLOBAL RESOURCES
# ------------------------------------------------------------------------------

# --- VPC Peering ---

resource "aws_vpc_peering_connection" "peer" {
  count         = var.enable_secondary_region ? 1 : 0
  provider      = aws.primary
  peer_owner_id = data.aws_caller_identity.current.account_id
  peer_vpc_id   = aws_vpc.secondary[0].id
  vpc_id        = aws_vpc.primary.id
  peer_region   = "us-west-2"
  tags          = merge(local.common_tags, { Name = "vpc-peering-${local.deployment_suffix}" })
}

resource "aws_vpc_peering_connection_accepter" "peer" {
  count                     = var.enable_secondary_region ? 1 : 0
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.peer[0].id
  auto_accept               = true
  tags                      = merge(local.common_tags, { Name = "vpc-peering-accepter-${local.deployment_suffix}" })
}

# --- IAM (Global) ---

resource "aws_iam_role" "ec2_role" {
  name_prefix = "iam-role-ec2-nova-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "ec2_policy" {
  name_prefix = "iam-policy-ec2-nova-"
  description = "Policy for EC2 instances to access S3 and CloudWatch"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
        Effect = "Allow",
        Resource = [
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      },
      {
        Action = ["logs:CreateLogStream", "logs:PutLogEvents", "logs:CreateLogGroup"],
        Effect = "Allow",
        Resource = var.enable_secondary_region ? [
          "${aws_cloudwatch_log_group.app_logs.arn}:*",
          "${aws_cloudwatch_log_group.app_logs_secondary[0].arn}:*"
          ] : [
          "${aws_cloudwatch_log_group.app_logs.arn}:*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name_prefix = "iam-instance-profile-ec2-nova-"
  role        = aws_iam_role.ec2_role.name
}

# --- S3 Storage (Global) ---

resource "aws_s3_bucket" "artifacts" {
  bucket_prefix = "nova-artifacts-${local.deployment_suffix}-"
  tags          = merge(local.common_tags, { Name = "s3-artifacts-${local.deployment_suffix}" })
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- Route 53 DNS (Global) ---

resource "aws_route53_zone" "main" {
  count = var.enable_route53 ? 1 : 0
  name  = var.domain_name
  tags  = merge(local.common_tags, { Name = "dns-zone-${var.domain_name}" })
}

resource "aws_route53_health_check" "primary" {
  count             = var.enable_route53 ? 1 : 0
  fqdn              = aws_lb.primary_app.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = 30
  tags              = merge(local.common_tags, { Name = "hc-primary-alb-${local.deployment_suffix}" })
}

resource "aws_route53_health_check" "secondary" {
  count             = var.enable_route53 && var.enable_secondary_region ? 1 : 0
  fqdn              = aws_lb.secondary_app[0].dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = 30
  tags              = merge(local.common_tags, { Name = "hc-secondary-alb-${local.deployment_suffix}" })
}

resource "aws_route53_record" "failover_primary" {
  count   = var.enable_route53 ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "app.${var.domain_name}"
  type    = "A"
  failover_routing_policy {
    type = "PRIMARY"
  }
  set_identifier  = "primary-alb-failover-${local.deployment_suffix}"
  health_check_id = aws_route53_health_check.primary[0].id
  alias {
    name                   = aws_lb.primary_app.dns_name
    zone_id                = aws_lb.primary_app.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "failover_secondary" {
  count   = var.enable_route53 && var.enable_secondary_region ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "app.${var.domain_name}"
  type    = "A"
  failover_routing_policy {
    type = "SECONDARY"
  }
  set_identifier  = "secondary-alb-failover-${local.deployment_suffix}"
  health_check_id = aws_route53_health_check.secondary[0].id
  alias {
    name                   = aws_lb.secondary_app[0].dns_name
    zone_id                = aws_lb.secondary_app[0].zone_id
    evaluate_target_health = true
  }
}

# --- Monitoring & Logging (Regional) ---

resource "aws_cloudwatch_log_group" "app_logs" {
  provider          = aws.primary
  name_prefix       = "/app/nova-project-logs-"
  retention_in_days = 14
  tags              = merge(local.common_tags, { Name = "cw-log-group-app-${local.deployment_suffix}" })
}

resource "aws_cloudwatch_log_group" "app_logs_secondary" {
  count             = var.enable_secondary_region ? 1 : 0
  provider          = aws.secondary
  name_prefix       = "/app/nova-project-logs-secondary-"
  retention_in_days = 14
  tags              = merge(local.common_tags, { Name = "cw-log-group-app-secondary-${local.deployment_suffix}" })
}

resource "aws_cloudwatch_metric_alarm" "primary_cpu_high" {
  count               = var.enable_asg ? 1 : 0
  provider            = aws.primary
  alarm_name          = "alarm-primary-cpu-high-${local.deployment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary_app[0].name
  }
  tags = merge(local.common_tags, { Name = "cw-alarm-cpu-primary-${local.deployment_suffix}" })
}

# --- Cost Optimization Lambda (Regional) ---

# This data source packages the inline python code into a zip file for the Lambda function.
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/cost_saver_lambda.zip"
  source {
    # INLINED LAMBDA CODE
    content  = <<-EOT
    import boto3
    import os

    def lambda_handler(event, context):
        # This is a placeholder. In a real scenario, you would add logic
        # to find resources by tag and stop/scale them down.
        # e.g., stop non-production EC2 and RDS instances.
        print("Cost optimization Lambda triggered. No actions taken in this example.")

        # Example of how you might stop tagged instances:
        # ec2 = boto3.client('ec2', region_name='us-east-1')
        # instances = ec2.describe_instances(
        #     Filters=[{'Name': 'tag:Environment', 'Values': ['Testing']}]
        # )
        # for reservation in instances['Reservations']:
        #     for instance in reservation['Instances']:
        #         if instance['State']['Name'] == 'running':
        #             print(f"Stopping instance: {instance['InstanceId']}")
        #             ec2.stop_instances(InstanceIds=[instance['InstanceId']])

        return { 'statusCode': 200, 'body': 'OK' }
    EOT
    filename = "index.py"
  }
}

resource "aws_iam_role" "lambda_role" {
  name_prefix = "iam-role-lambda-cost-saver-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "lambda_policy" {
  name_prefix = "iam-policy-lambda-cost-saver-"
  description = "Policy for Lambda to manage resources for cost savings."
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        Effect   = "Allow",
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        # Permissions to stop EC2 and RDS instances
        Action   = ["ec2:StopInstances", "ec2:DescribeInstances", "rds:StopDBInstance", "rds:DescribeDBInstances"],
        Effect   = "Allow",
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_lambda_function" "cost_saver" {
  provider         = aws.primary
  function_name    = "lambda-cost-saver-nova-${local.deployment_suffix}"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.lambda_handler"
  runtime          = "python3.9"
  timeout          = 60
  tags             = merge(local.common_tags, { Name = "lambda-cost-saver-${local.deployment_suffix}" })
}

resource "aws_cloudwatch_event_rule" "daily_shutdown" {
  provider            = aws.primary
  name_prefix         = "rule-daily-shutdown-"
  description         = "Triggers cost saver Lambda every night at midnight UTC"
  schedule_expression = "cron(0 0 * * ? *)"
  tags                = merge(local.common_tags, { Name = "cw-rule-daily-shutdown-${local.deployment_suffix}" })
}

resource "aws_cloudwatch_event_target" "invoke_lambda" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.daily_shutdown.name
  target_id = "invoke-cost-saver-lambda-${local.deployment_suffix}"
  arn       = aws_lambda_function.cost_saver.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromCloudWatchEvents"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cost_saver.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_shutdown.arn
}


# ------------------------------------------------------------------------------
# OUTPUTS
# ------------------------------------------------------------------------------

output "application_url" {
  description = "The Route 53 URL for the application."
  value       = var.enable_route53 ? "http://app.${var.domain_name}" : "route53-disabled"
}

output "primary_alb_dns" {
  description = "DNS name of the primary ALB in us-east-1"
  value       = aws_lb.primary_app.dns_name
}

output "secondary_alb_dns" {
  description = "DNS name of the secondary ALB in us-west-2"
  value       = var.enable_secondary_region ? aws_lb.secondary_app[0].dns_name : "secondary-region-disabled"
}

output "rds_endpoint" {
  description = "RDS endpoint for the PostgreSQL database"
  value       = var.enable_rds ? aws_db_instance.primary_db_new[0].endpoint : "rds-disabled"
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for artifacts"
  value       = aws_s3_bucket.artifacts.bucket
}

output "private_key_path" {
  description = "Path to the private key file for SSH access"
  value       = local_file.nova_key_pem.filename
}

output "lambda_function_name" {
  description = "Name of the cost-saving Lambda function"
  value       = aws_lambda_function.cost_saver.function_name
}

output "primary_alb_name" {
  description = "Name of the primary ALB"
  value       = aws_lb.primary_app.name
}

output "secondary_alb_name" {
  description = "Name of the secondary ALB"
  value       = var.enable_secondary_region ? aws_lb.secondary_app[0].name : "secondary-region-disabled"
}

output "primary_alb_arn" {
  description = "ARN of the primary ALB"
  value       = aws_lb.primary_app.arn
}

output "secondary_alb_arn" {
  description = "ARN of the secondary ALB"
  value       = var.enable_secondary_region ? aws_lb.secondary_app[0].arn : "secondary-region-disabled"
}

output "primary_asg_name" {
  description = "Name of the primary Auto Scaling Group"
  value       = var.enable_asg ? aws_autoscaling_group.primary_app[0].name : "asg-disabled"
}

output "secondary_asg_name" {
  description = "Name of the secondary Auto Scaling Group"
  value       = var.enable_secondary_region && var.enable_asg ? aws_autoscaling_group.secondary_app[0].name : "secondary-asg-disabled"
}

output "primary_db_identifier" {
  description = "Identifier of the primary RDS instance"
  value       = var.enable_rds ? aws_db_instance.primary_db_new[0].identifier : "rds-disabled"
}

output "event_rule_name" {
  description = "Name of the CloudWatch Event Rule"
  value       = aws_cloudwatch_event_rule.daily_shutdown.name
}

output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = var.enable_secondary_region ? aws_vpc.secondary[0].id : "secondary-region-disabled"
}

output "vpc_peering_connection_id" {
  description = "ID of the VPC peering connection"
  value       = var.enable_secondary_region ? aws_vpc_peering_connection.peer[0].id : "vpc-peering-disabled"
}

output "primary_vpc_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary.cidr_block
}

output "secondary_vpc_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = var.enable_secondary_region ? aws_vpc.secondary[0].cidr_block : "secondary-region-disabled"
}

output "s3_bucket_versioning_status" {
  description = "Versioning status of the S3 bucket"
  value       = aws_s3_bucket_versioning.artifacts.versioning_configuration[0].status
}

output "rds_multi_az" {
  description = "Multi-AZ status of the RDS instance"
  value       = var.enable_rds ? aws_db_instance.primary_db_new[0].multi_az : false
}

output "rds_backup_retention_period" {
  description = "Backup retention period for RDS"
  value       = var.enable_rds ? aws_db_instance.primary_db_new[0].backup_retention_period : 0
}

output "rds_storage_encrypted" {
  description = "Storage encryption status of the RDS instance"
  value       = var.enable_rds ? aws_db_instance.primary_db_new[0].storage_encrypted : false
}

output "iam_ec2_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "iam_lambda_role_name" {
  description = "Name of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = var.enable_route53 ? aws_route53_zone.main[0].zone_id : "route53-disabled"
}

output "primary_health_check_id" {
  description = "Primary Route 53 health check ID"
  value       = var.enable_route53 ? aws_route53_health_check.primary[0].id : "route53-disabled"
}

output "secondary_health_check_id" {
  description = "Secondary Route 53 health check ID"
  value       = var.enable_route53 && var.enable_secondary_region ? aws_route53_health_check.secondary[0].id : "route53-or-secondary-disabled"
}

output "db_subnet_group_name" {
  description = "Name of the RDS DB subnet group"
  value       = var.enable_rds ? aws_db_subnet_group.primary_rds[0].name : "rds-disabled"
}
