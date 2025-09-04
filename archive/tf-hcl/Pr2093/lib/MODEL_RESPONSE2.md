You're absolutely right! Let me continue from where I left off and complete the entire `tap_stack.tf` file:

```hcl
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
  provider          = aws.us
