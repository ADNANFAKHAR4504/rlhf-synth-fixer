# Get latest Amazon Linux AMI
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

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-vpc-${var.environment_suffix}"
    Environment = var.environment
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-igw-${var.environment_suffix}"
    Environment = var.environment
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Type        = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Type        = "private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.public_subnet_cidrs)

  domain = "vpc"

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-eip-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-nat-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-rt-${var.environment_suffix}"
    Environment = var.environment
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-rt-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Network ACLs - Public
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 22
    to_port    = 22
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-public-nacl-${var.environment_suffix}"
    Environment = var.environment
  })
}

# Network ACLs - Private
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Deny rules for cross-environment traffic
  dynamic "ingress" {
    for_each = var.environment == "prod" ? [
      { cidr = "10.0.0.0/16", rule_no = 90 }, # Deny dev traffic
      { cidr = "10.1.0.0/16", rule_no = 91 }  # Deny staging traffic
      ] : var.environment == "staging" ? [
      { cidr = "10.0.0.0/16", rule_no = 90 } # Deny dev traffic
    ] : []

    content {
      protocol   = "-1"
      rule_no    = ingress.value.rule_no
      action     = "deny"
      cidr_block = ingress.value.cidr
      from_port  = 0
      to_port    = 0
    }
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 22
    to_port    = 22
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 80
    to_port    = 80
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 443
    to_port    = 443
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-private-nacl-${var.environment_suffix}"
    Environment = var.environment
  })
}

# Security Group for Web Servers
resource "aws_security_group" "web" {
  name        = "${var.environment}-web-sg-${var.environment_suffix}"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web servers in ${var.environment} environment"

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

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-web-sg-${var.environment_suffix}"
    Environment = var.environment
  })
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-ec2-role-${var.environment_suffix}"

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

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-ec2-role-${var.environment_suffix}"
    Environment = var.environment
  })
}

# IAM Policy for CloudWatch and SSM
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.environment}-ec2-policy-${var.environment_suffix}"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:PutParameter"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-ec2-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2_role.name

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-ec2-profile-${var.environment_suffix}"
    Environment = var.environment
  })
}

# VPC Flow Logs (conditional for LocalStack compatibility)
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  count             = var.enable_flow_logs ? 1 : 0
  name              = "/aws/vpc/flowlogs/${var.environment}-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-vpc-flow-logs-${var.environment_suffix}"
    Environment = var.environment
  })
}

resource "aws_iam_role" "flow_logs_role" {
  count = var.enable_flow_logs ? 1 : 0
  name  = "${var.environment}-flow-logs-role-${var.environment_suffix}"

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

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-flow-logs-role-${var.environment_suffix}"
    Environment = var.environment
  })
}

resource "aws_iam_role_policy" "flow_logs_policy" {
  count = var.enable_flow_logs ? 1 : 0
  name  = "${var.environment}-flow-logs-policy-${var.environment_suffix}"
  role  = aws_iam_role.flow_logs_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_flow_log" "vpc_flow_logs" {
  count                = var.enable_flow_logs ? 1 : 0
  iam_role_arn         = aws_iam_role.flow_logs_role[0].arn
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs[0].arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-vpc-flow-logs-${var.environment_suffix}"
    Environment = var.environment
  })
}

# EC2 Instances for testing (conditional for LocalStack compatibility)
resource "aws_instance" "web" {
  count = var.enable_ec2_instances ? length(var.public_subnet_cidrs) : 0

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.private[count.index].id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data_base64 = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ${var.environment} environment - Instance ${count.index + 1}</h1>" > /var/www/html/index.html
              EOF
  )

  depends_on = [aws_iam_instance_profile.ec2_profile]

  timeouts {
    create = "5m"
    update = "5m"
    delete = "5m"
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-webserver-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
  })
}
