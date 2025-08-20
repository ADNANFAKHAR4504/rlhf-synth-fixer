# Environment-specific configurations
locals {
  # Environment-specific settings
  env_config = {
    staging = {
      instance_type     = "t3.micro"
      min_size          = 1
      max_size          = 2
      desired_capacity  = 1
      vpc_cidr          = "10.0.0.0/16"
      db_instance_class = "db.t3.micro"
    }
    production = {
      instance_type     = "t3.small"
      min_size          = 2
      max_size          = 6
      desired_capacity  = 3
      vpc_cidr          = "10.1.0.0/16"
      db_instance_class = "db.t3.small"
    }
  }

  # Current environment settings
  current_config = local.env_config[local.environment]
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
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

# ========================================
# VPC Resources (Previously vpc module)
# ========================================

resource "aws_vpc" "main" {
  cidr_block           = local.current_config.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-vpc"
    }
  )
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-igw"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = min(2, length(data.aws_availability_zones.available.names))

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
      Type = "Public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = min(2, length(data.aws_availability_zones.available.names))

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
      Type = "Private"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = min(2, length(data.aws_availability_zones.available.names))
  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-eip-${count.index + 1}"
    }
  )
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = min(2, length(data.aws_availability_zones.available.names))

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-nat-${count.index + 1}"
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
      Name = "${local.name_prefix}-public-rt"
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = min(2, length(data.aws_availability_zones.available.names))

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-private-rt-${count.index + 1}"
    }
  )
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ========================================
# Security Groups (Previously security module)
# ========================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-sg-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
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

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alb-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name_prefix = "${local.name_prefix}-ec2-sg-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Explicit outbound HTTP/HTTPS for yum install and general internet access
  egress {
    description = "Allow HTTP outbound"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "Allow HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "Allow all other outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-ec2-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-sg-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL/Aurora from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-rds-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# ========================================
# Application Load Balancer (Previously alb module)
# ========================================

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alb"
    }
  )
}

resource "aws_lb_target_group" "main" {
  name     = "${local.name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 10
    path                = "/"
    matcher             = "200-399"
    port                = "traffic-port"
  }

  deregistration_delay = 30

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-tg"
    }
  )
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ========================================
# Auto Scaling Group (Previously asg module)
# ========================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = local.current_config.instance_type
  network_interfaces {
    security_groups = [aws_security_group.ec2.id]
  }
  # vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -euxo pipefail

    # Create directory first
    mkdir -p /var/www/html
    echo "<h1>Hello from ${local.name_prefix} - $(hostname -f)</h1>" > /var/www/html/index.html

    # Start immediate HTTP server for health checks
    nohup python3 -m http.server 80 --directory /var/www/html >/var/log/pyhttp.log 2>&1 &

    # Wait a moment for server to start
    sleep 3

    # Test that our server is working
    curl -f http://localhost:80/ || exit 1

    # Try to install Apache in background (optional)
    (
      yum update -y && 
      yum install -y httpd && 
      systemctl enable httpd &&
      systemctl start httpd &&
      # Only kill Python server after Apache is confirmed running
      systemctl is-active httpd && pkill -f "python3 -m http.server"
    ) &
  EOF
  )


  tag_specifications {
    resource_type = "instance"
    tags = merge(
      local.common_tags,
      {
        Name = "${local.name_prefix}-instance"
      }
    )
  }

  tags = local.common_tags
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                      = "${local.name_prefix}-asg"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 180
  min_size                  = local.current_config.min_size
  max_size                  = local.current_config.max_size
  desired_capacity          = local.current_config.desired_capacity
  depends_on                = [aws_lb_listener.main] # ensure LB path is ready
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-instance"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# ========================================
# RDS Database (Previously rds module)
# ========================================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-db-subnet-group"
    }
  )
}

# Random password for RDS
resource "random_password" "db" {
  length           = 16
  special          = true
  override_special = "!#$%^&*()-_=+[]{}<>?:"
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = local.current_config.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "tapdb"
  username = "admin"
  password = random_password.db.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-db"
    }
  )
}

# Store DB password in SSM Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name      = "/${local.name_prefix}/db/password"
  type      = "SecureString"
  value     = random_password.db.result
  overwrite = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-db-password"
    }
  )
}

# ========================================
# Outputs for sharing between environments
# ========================================

output "environment_info" {
  description = "Environment configuration information"
  value = {
    workspace          = terraform.workspace
    environment        = local.environment
    environment_suffix = local.environment_suffix
    region             = local.region
    name_prefix        = local.name_prefix
  }
}

output "vpc_info" {
  description = "VPC information for sharing"
  value = {
    vpc_id              = aws_vpc.main.id
    vpc_cidr            = aws_vpc.main.cidr_block
    public_subnet_ids   = aws_subnet.public[*].id
    private_subnet_ids  = aws_subnet.private[*].id
    internet_gateway_id = aws_internet_gateway.main.id
    nat_gateway_ids     = aws_nat_gateway.main[*].id
  }
}

output "security_group_info" {
  description = "Security group information for sharing"
  value = {
    alb_security_group_id = aws_security_group.alb.id
    ec2_security_group_id = aws_security_group.ec2.id
    rds_security_group_id = aws_security_group.rds.id
  }
}

output "load_balancer_info" {
  description = "Load balancer information for sharing"
  value = {
    alb_dns_name     = aws_lb.main.dns_name
    alb_zone_id      = aws_lb.main.zone_id
    alb_arn          = aws_lb.main.arn
    target_group_arn = aws_lb_target_group.main.arn
  }
}

output "auto_scaling_info" {
  description = "Auto Scaling Group information for sharing"
  value = {
    asg_name           = aws_autoscaling_group.main.name
    asg_arn            = aws_autoscaling_group.main.arn
    launch_template_id = aws_launch_template.main.id
  }
}

output "database_info" {
  description = "RDS database information for sharing"
  value = {
    db_endpoint           = aws_db_instance.main.endpoint
    db_address            = aws_db_instance.main.address
    db_port               = aws_db_instance.main.port
    db_name               = aws_db_instance.main.db_name
    db_password_ssm_param = aws_ssm_parameter.db_password.name
  }
  sensitive = true
}

output "shared_config" {
  description = "Configuration that can be shared across environments"
  value = {
    account_id         = data.aws_caller_identity.current.account_id
    region             = data.aws_region.current.name
    environment        = local.environment
    environment_suffix = local.environment_suffix
    workspace          = terraform.workspace
    resource_prefix    = local.name_prefix
    common_tags        = local.common_tags
  }
}

output "deployment_endpoints" {
  description = "Endpoints for deployment processes"
  value = {
    load_balancer_url = "http://${aws_lb.main.dns_name}"
    health_check_url  = "http://${aws_lb.main.dns_name}/"
    environment       = local.environment
    region            = local.region
  }
}

output "resource_summary" {
  description = "Summary of deployed resources"
  value = {
    vpc_count                = 1
    subnet_count             = length(aws_subnet.public) + length(aws_subnet.private)
    security_group_count     = 3
    load_balancer_count      = 1
    auto_scaling_group_count = 1
    database_count           = 1
    nat_gateway_count        = length(aws_nat_gateway.main)
    environment              = local.environment
    region                   = local.region
  }
}
