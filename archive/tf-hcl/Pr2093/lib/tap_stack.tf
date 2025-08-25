# tap_stack.tf - Complete TAP Stack Infrastructure

# =============================================================================
# VARIABLES
# =============================================================================

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for HTTP/HTTPS traffic"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Common tags
  common_tags = {
    Environment = "Production"
    Project     = "TAP-Stack"
    ManagedBy   = "Terraform"
  }

  # Naming conventions
  name_prefix = "tap-prod"
  
  # Region configurations
  primary_region   = "us-east-1"
  secondary_region = "us-west-2"
  
  # VPC CIDR blocks
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"
  
  # Availability zones
  primary_azs   = ["us-east-1a", "us-east-1b", "us-east-1c"]
  secondary_azs = ["us-west-2a", "us-west-2b", "us-west-2c"]
  
  # Subnet CIDR blocks for primary region
  primary_public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  primary_private_subnets = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  # Subnet CIDR blocks for secondary region
  secondary_public_subnets  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  secondary_private_subnets = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]
}

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "amazon_linux_primary" {
  provider    = aws.us_east_1
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
  provider    = aws.us_west_2
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

# =============================================================================
# RANDOM PASSWORDS FOR RDS
# =============================================================================

resource "random_string" "primary_db_username" {
  length  = 8
  special = false
  numeric = false
  upper   = false
}

resource "random_password" "primary_db_password" {
  length  = 16
  special = true
  override_special = "!#$%&()*+-=:?^_"
}

resource "random_string" "secondary_db_username" {
  length  = 8
  special = false
  numeric = false
  upper   = false
}

resource "random_password" "secondary_db_password" {
  length  = 16
  special = true
  override_special = "!#$%&()*+-=:?^_"
}

# =============================================================================
# KMS KEYS
# =============================================================================

# KMS key for primary region
resource "aws_kms_key" "primary_rds" {
  provider                = aws.us_east_1
  description             = "KMS key for RDS encryption in primary region"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-kms-primary"
  })
}

resource "aws_kms_alias" "primary_rds" {
  provider      = aws.us_east_1
  name          = "alias/${local.name_prefix}-rds-primary"
  target_key_id = aws_kms_key.primary_rds.key_id
}

# KMS key for secondary region
resource "aws_kms_key" "secondary_rds" {
  provider                = aws.us_west_2
  description             = "KMS key for RDS encryption in secondary region"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-kms-secondary"
  })
}

resource "aws_kms_alias" "secondary_rds" {
  provider      = aws.us_west_2
  name          = "alias/${local.name_prefix}-rds-secondary"
  target_key_id = aws_kms_key.secondary_rds.key_id
}

# =============================================================================
# PRIMARY REGION NETWORKING (US-EAST-1)
# =============================================================================

# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.us_east_1
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-primary"
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw-primary"
  })
}

# Primary Public Subnets
resource "aws_subnet" "primary_public" {
  provider                = aws.us_east_1
  count                   = length(local.primary_azs)
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnets[count.index]
  availability_zone       = local.primary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}-primary"
    Type = "Public"
  })
}

# Primary Private Subnets
resource "aws_subnet" "primary_private" {
  provider          = aws.us_east_1
  count             = length(local.primary_azs)
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnets[count.index]
  availability_zone = local.primary_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}-primary"
    Type = "Private"
  })
}

# Primary Elastic IPs for NAT Gateways
resource "aws_eip" "primary_nat" {
  provider = aws.us_east_1
  count    = length(local.primary_azs)
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eip-nat-${count.index + 1}-primary"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Primary NAT Gateways
resource "aws_nat_gateway" "primary" {
  provider      = aws.us_east_1
  count         = length(local.primary_azs)
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}-primary"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Primary Public Route Table
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-public-primary"
  })
}

# Primary Private Route Tables
resource "aws_route_table" "primary_private" {
  provider = aws.us_east_1
  count    = length(local.primary_azs)
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-private-${count.index + 1}-primary"
  })
}

# Primary Public Route Table Associations
resource "aws_route_table_association" "primary_public" {
  provider       = aws.us_east_1
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Primary Private Route Table Associations
resource "aws_route_table_association" "primary_private" {
  provider       = aws.us_east_1
  count          = length(aws_subnet.primary_private)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# =============================================================================
# SECONDARY REGION NETWORKING (US-WEST-2)
# =============================================================================

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider             = aws.us_west_2
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-secondary"
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw-secondary"
  })
}

# Secondary Public Subnets
resource "aws_subnet" "secondary_public" {
  provider                = aws.us_west_2
  count                   = length(local.secondary_azs)
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnets[count.index]
  availability_zone       = local.secondary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}-secondary"
    Type = "Public"
  })
}

# Secondary Private Subnets
resource "aws_subnet" "secondary_private" {
  provider          = aws.us_west_2
  count             = length(local.secondary_azs)
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnets[count.index]
  availability_zone = local.secondary_azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}-secondary"
    Type = "Private"
  })
}

# Secondary Elastic IPs for NAT Gateways
resource "aws_eip" "secondary_nat" {
  provider = aws.us_west_2
  count    = length(local.secondary_azs)
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eip-nat-${count.index + 1}-secondary"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Secondary NAT Gateways
resource "aws_nat_gateway" "secondary" {
  provider      = aws.us_west_2
  count         = length(local.secondary_azs)
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}-secondary"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Secondary Public Route Table
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-public-secondary"
  })
}

# Secondary Private Route Tables
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_2
  count    = length(local.secondary_azs)
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-private-${count.index + 1}-secondary"
  })
}

# Secondary Public Route Table Associations
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.us_west_2
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Secondary Private Route Table Associations
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.us_west_2
  count          = length(aws_subnet.secondary_private)
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# Primary ALB Security Group
resource "aws_security_group" "primary_alb" {
  provider    = aws.us_east_1
  name        = "${local.name_prefix}-alb-sg-primary"
  description = "Security group for ALB in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg-primary"
  })
}

# Primary EC2 Security Group
resource "aws_security_group" "primary_ec2" {
  provider    = aws.us_east_1
  name        = "${local.name_prefix}-ec2-sg-primary"
  description = "Security group for EC2 instances in primary region"
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-sg-primary"
  })
}

# Primary RDS Security Group
resource "aws_security_group" "primary_rds" {
  provider    = aws.us_east_1
  name        = "${local.name_prefix}-rds-sg-primary"
  description = "Security group for RDS in primary region"
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg-primary"
  })
}

# Secondary ALB Security Group
resource "aws_security_group" "secondary_alb" {
  provider    = aws.us_west_2
  name        = "${local.name_prefix}-alb-sg-secondary"
  description = "Security group for ALB in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg-secondary"
  })
}

# Secondary EC2 Security Group
resource "aws_security_group" "secondary_ec2" {
  provider    = aws.us_west_2
  name        = "${local.name_prefix}-ec2-sg-secondary"
  description = "Security group for EC2 instances in secondary region"
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-sg-secondary"
  })
}

# Secondary RDS Security Group
resource "aws_security_group" "secondary_rds" {
  provider    = aws.us_west_2
  name        = "${local.name_prefix}-rds-sg-secondary"
  description = "Security group for RDS in secondary region"
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg-secondary"
  })
}

# =============================================================================
# IAM ROLES AND POLICIES
# =============================================================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-role"
  })
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_policy" "cloudwatch_logs" {
  name        = "${local.name_prefix}-cloudwatch-logs-policy"
  description = "Policy for CloudWatch Logs access"

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
      }
    ]
  })

  tags = local.common_tags
}

# Attach CloudWatch policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# =============================================================================
# CLOUDWATCH LOG GROUPS
# =============================================================================

# CloudWatch Log Group for primary region
resource "aws_cloudwatch_log_group" "primary_app_logs" {
  provider          = aws.us_east_1
  name              = "/aws/ec2/${local.name_prefix}-primary"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-primary"
  })
}

# CloudWatch Log Group for secondary region
resource "aws_cloudwatch_log_group" "secondary_app_logs" {
  provider          = aws.us_west_2
  name              = "/aws/ec2/${local.name_prefix}-secondary"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-secondary"
  })
}

# =============================================================================
# LAUNCH TEMPLATES
# =============================================================================

# Primary Launch Template
resource "aws_launch_template" "primary" {
  provider      = aws.us_east_1
  name          = "${local.name_prefix}-lt-primary"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.primary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd awslogs
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Primary Region (${local.primary_region})</h1>" > /var/www/html/index.html
    
    # Configure CloudWatch Logs
    cat > /etc/awslogs/awslogs.conf << 'EOL'
    [general]
    state_file = /var/lib/awslogs/agent-state
    
    [/var/log/messages]
    file = /var/log/messages
    log_group_name = ${aws_cloudwatch_log_group.primary_app_logs.name}
    log_stream_name = {instance_id}/messages
    datetime_format = %b %d %H:%M:%S
    EOL
    
    sed -i 's/region = us-east-1/region = ${local.primary_region}/' /etc/awslogs/awscli.conf
    systemctl start awslogsd
    systemctl enable awslogsd
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance-primary"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lt-primary"
  })
}

# Secondary Launch Template
resource "aws_launch_template" "secondary" {
  provider      = aws.us_west_2
  name          = "${local.name_prefix}-lt-secondary"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd awslogs
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Secondary Region (${local.secondary_region})</h1>" > /var/www/html/index.html
    
    # Configure CloudWatch Logs
    cat > /etc/awslogs/awslogs.conf << 'EOL'
    [general]
    state_file = /var/lib/awslogs/agent-state
    
    [/var/log/messages]
    file = /var/log/messages
    log_group_name = ${aws_cloudwatch_log_group.secondary_app_logs.name}
    log_stream_name = {instance_id}/messages
    datetime_format = %b %d %H:%M:%S
    EOL
    
    sed -i 's/region = us-east-1/region = ${local.secondary_region}/' /etc/awslogs/awscli.conf
    systemctl start awslogsd
    systemctl enable awslogsd
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance-secondary"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lt-secondary"
  })
}

# =============================================================================
# APPLICATION LOAD BALANCERS
# =============================================================================

# Primary ALB
resource "aws_lb" "primary" {
  provider           = aws.us_east_1
  name               = "${local.name_prefix}-alb-primary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-primary"
  })
}

# Primary ALB Target Group
resource "aws_lb_target_group" "primary" {
  provider = aws.us_east_1
  name     = "${local.name_prefix}-tg-primary"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg-primary"
  })
}

# Primary ALB Listener
resource "aws_lb_listener" "primary" {
  provider          = aws.us_east_1
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = local.common_tags
}

# Secondary ALB
resource "aws_lb" "secondary" {
  provider           = aws.us_west_2
  name               = "${local.name_prefix}-alb-secondary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-secondary"
  })
}

# Secondary ALB Target Group
resource "aws_lb_target_group" "secondary" {
  provider = aws.us_west_2
  name     = "${local.name_prefix}-tg-secondary"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg-secondary"
  })
}
# Secondary ALB Listener
resource "aws_lb_listener" "secondary" {
  provider          = aws.us_west_2
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }

  tags = local.common_tags
}

# =============================================================================
# AUTO SCALING GROUPS
# =============================================================================

# Primary Auto Scaling Group
resource "aws_autoscaling_group" "primary" {
  provider            = aws.us_east_1
  name                = "${local.name_prefix}-asg-primary"
  vpc_zone_identifier = aws_subnet.primary_private[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 3
  desired_capacity = 1

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-primary"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

# Secondary Auto Scaling Group
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.us_west_2
  name                = "${local.name_prefix}-asg-secondary"
  vpc_zone_identifier = aws_subnet.secondary_private[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 3
  desired_capacity = 1

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-secondary"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

# =============================================================================
# AUTO SCALING POLICIES
# =============================================================================

# Primary Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "primary_scale_up" {
  provider           = aws.us_east_1
  name               = "${local.name_prefix}-scale-up-primary"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# Primary Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "primary_scale_down" {
  provider           = aws.us_east_1
  name               = "${local.name_prefix}-scale-down-primary"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# Secondary Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "secondary_scale_up" {
  provider           = aws.us_west_2
  name               = "${local.name_prefix}-scale-up-secondary"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# Secondary Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "secondary_scale_down" {
  provider           = aws.us_west_2
  name               = "${local.name_prefix}-scale-down-secondary"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# =============================================================================
# CLOUDWATCH ALARMS FOR AUTO SCALING
# =============================================================================

# Primary CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "primary_high_cpu" {
  provider            = aws.us_east_1
  alarm_name          = "${local.name_prefix}-high-cpu-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

# Primary CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "primary_low_cpu" {
  provider            = aws.us_east_1
  alarm_name          = "${local.name_prefix}-low-cpu-primary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

# Secondary CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "secondary_high_cpu" {
  provider            = aws.us_west_2
  alarm_name          = "${local.name_prefix}-high-cpu-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

# Secondary CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "secondary_low_cpu" {
  provider            = aws.us_west_2
  alarm_name          = "${local.name_prefix}-low-cpu-secondary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

# =============================================================================
# RDS SUBNET GROUPS
# =============================================================================

# Primary RDS Subnet Group
resource "aws_db_subnet_group" "primary" {
  provider   = aws.us_east_1
  name       = "${local.name_prefix}-db-subnet-group-primary"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group-primary"
  })
}

# Secondary RDS Subnet Group
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.us_west_2
  name       = "${local.name_prefix}-db-subnet-group-secondary"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group-secondary"
  })
}

# =============================================================================
# RDS INSTANCES
# =============================================================================

# Primary RDS Instance
resource "aws_db_instance" "primary" {
  provider               = aws.us_east_1
  identifier             = "${local.name_prefix}-db-primary"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp2"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = var.db_instance_class
  db_name                = "tapdb"
  username               = random_string.primary_db_username.result
  password               = random_password.primary_db_password.result
  parameter_group_name   = "default.mysql8.0"
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  vpc_security_group_ids = [aws_security_group.primary_rds.id]

  # Encryption
  storage_encrypted = true
  kms_key_id       = aws_kms_key.primary_rds.arn

  # Backup and maintenance
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Other settings
  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-primary"
  })
}

# Secondary RDS Instance
resource "aws_db_instance" "secondary" {
  provider               = aws.us_west_2
  identifier             = "${local.name_prefix}-db-secondary"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp2"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = var.db_instance_class
  db_name                = "tapdb"
  username               = random_string.secondary_db_username.result
  password               = random_password.secondary_db_password.result
  parameter_group_name   = "default.mysql8.0"
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  vpc_security_group_ids = [aws_security_group.secondary_rds.id]

  # Encryption
  storage_encrypted = true
  kms_key_id       = aws_kms_key.secondary_rds.arn

  # Backup and maintenance
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Other settings
  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-secondary"
  })
}

# =============================================================================
# RDS MONITORING IAM ROLE
# =============================================================================

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-monitoring-role"
  })
}

# Attach AWS managed policy for RDS Enhanced Monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# =============================================================================
# S3 BUCKET (PRIMARY REGION ONLY)
# =============================================================================

# S3 Bucket for static content
resource "aws_s3_bucket" "static_content" {
  provider = aws.us_east_1
  bucket   = "${local.name_prefix}-static-content-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-static-content"
  })
}

# Random suffix for S3 bucket name uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "static_content" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.static_content.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static_content" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.static_content.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "static_content" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.static_content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "static_content" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.static_content.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static_content.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.static_content.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.static_content]
}

# =============================================================================
# CLOUDFRONT DISTRIBUTION
# =============================================================================

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "static_content" {
  name                              = "${local.name_prefix}-oac"
  description                       = "Origin Access Control for S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "static_content" {
  origin {
    domain_name              = aws_s3_bucket.static_content.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.static_content.id
    origin_id                = "S3-${aws_s3_bucket.static_content.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_content.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudfront"
  })
}

# =============================================================================
# SAMPLE S3 OBJECTS
# =============================================================================

# Sample index.html file
resource "aws_s3_object" "index_html" {
  provider     = aws.us_east_1
  bucket       = aws_s3_bucket.static_content.id
  key          = "index.html"
  content_type = "text/html"
  content = <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>TAP Stack Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to TAP Stack Application</h1>
            <p>Multi-region deployment with high availability</p>
        </div>
        <h2>Architecture Features:</h2>
        <ul>
            <li>Multi-region deployment (us-east-1 and us-west-2)</li>
            <li>Auto Scaling Groups with Load Balancers</li>
            <li>RDS with encryption at rest</li>
            <li>CloudFront CDN for global content delivery</li>
            <li>CloudWatch monitoring and logging</li>
        </ul>
    </div>
</body>
</html>
EOF

  tags = local.common_tags
}

# =============================================================================
# OUTPUTS
# =============================================================================

# VPC Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

# Subnet Outputs
output "primary_public_subnet_ids" {
  description = "IDs of the primary public subnets"
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of the primary private subnets"
  value       = aws_subnet.primary_private[*].id
}

output "secondary_public_subnet_ids" {
  description = "IDs of the secondary public subnets"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of the secondary private subnets"
  value       = aws_subnet.secondary_private[*].id
}

# Load Balancer Outputs
output "primary_alb_dns_name" {
  description = "DNS name of the primary ALB"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary ALB"
  value       = aws_lb.secondary.dns_name
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary ALB"
  value       = aws_lb.primary.zone_id
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary ALB"
  value       = aws_lb.secondary.zone_id
}

# RDS Outputs
output "primary_rds_endpoint" {
  description = "RDS instance endpoint for primary region"
  value       = aws_db_instance.primary.endpoint
}

output "secondary_rds_endpoint" {
  description = "RDS instance endpoint for secondary region"
  value       = aws_db_instance.secondary.endpoint
}

output "primary_rds_port" {
  description = "RDS instance port for primary region"
  value       = aws_db_instance.primary.port
}

output "secondary_rds_port" {
  description = "RDS instance port for secondary region"
  value       = aws_db_instance.secondary.port
}

# S3 and CloudFront Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.static_content.bucket
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.static_content.bucket_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_content.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_content.domain_name
}

# AMI Outputs
output "primary_ami_id" {
  description = "AMI ID used in primary region"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "secondary_ami_id" {
  description = "AMI ID used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.id
}

# IAM Role Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS monitoring IAM role"
  value       = aws_iam_role.rds_monitoring.arn
}

# Auto Scaling Group Outputs
output "primary_asg_name" {
  description = "Name of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.name
}

output "secondary_asg_name" {
  description = "Name of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.name
}

# Security Group Outputs
output "primary_alb_security_group_id" {
  description = "ID of the primary ALB security group"
  value       = aws_security_group.primary_alb.id
}

output "primary_ec2_security_group_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.primary_ec2.id
}

output "primary_rds_security_group_id" {
  description = "ID of the primary RDS security group"
  value       = aws_security_group.primary_rds.id
}

output "secondary_alb_security_group_id" {
  description = "ID of the secondary ALB security group"
  value       = aws_security_group.secondary_alb.id
}

output "secondary_ec2_security_group_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.secondary_ec2.id
}

output "secondary_rds_security_group_id" {
  description = "ID of the secondary RDS security group"
  value       = aws_security_group.secondary_rds.id
}

# KMS Key Outputs
output "primary_kms_key_id" {
  description = "ID of the primary KMS key"
  value       = aws_kms_key.primary_rds.key_id
}

output "secondary_kms_key_id" {
  description = "ID of the secondary KMS key"
  value       = aws_kms_key.secondary_rds.key_id
}

# CloudWatch Log Group Outputs
output "primary_log_group_name" {
  description = "Name of the primary CloudWatch log group"
  value       = aws_cloudwatch_log_group.primary_app_logs.name
}

output "secondary_log_group_name" {
  description = "Name of the secondary CloudWatch log group"
  value       = aws_cloudwatch_log_group.secondary_app_logs.name
}

# Launch Template Outputs
output "primary_launch_template_id" {
  description = "ID of the primary launch template"
  value       = aws_launch_template.primary.id
}

output "secondary_launch_template_id" {
  description = "ID of the secondary launch template"
  value       = aws_launch_template.secondary.id
}

# NAT Gateway Outputs
output "primary_nat_gateway_ids" {
  description = "IDs of the primary NAT gateways"
  value       = aws_nat_gateway.primary[*].id
}

output "secondary_nat_gateway_ids" {
  description = "IDs of the secondary NAT gateways"
  value       = aws_nat_gateway.secondary[*].id
}

# Elastic IP Outputs
output "primary_eip_addresses" {
  description = "Elastic IP addresses for primary NAT gateways"
  value       = aws_eip.primary_nat[*].public_ip
}

output "secondary_eip_addresses" {
  description = "Elastic IP addresses for secondary NAT gateways"
  value       = aws_eip.secondary_nat[*].public_ip
}
