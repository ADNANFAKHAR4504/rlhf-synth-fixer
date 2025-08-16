# Data sources for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# KMS Keys for encryption
resource "aws_kms_key" "financial_app_primary" {
  provider                = aws.primary
  description             = "KMS key for financial app encryption - primary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "financial-app-kms-primary"
  }
}

resource "aws_kms_key" "financial_app_secondary" {
  provider                = aws.secondary
  description             = "KMS key for financial app encryption - secondary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "financial-app-kms-secondary"
  }
}

resource "aws_kms_alias" "financial_app_primary" {
  provider      = aws.primary
  name          = "alias/financial-app-primary"
  target_key_id = aws_kms_key.financial_app_primary.key_id
}

resource "aws_kms_alias" "financial_app_secondary" {
  provider      = aws.secondary
  name          = "alias/financial-app-secondary"
  target_key_id = aws_kms_key.financial_app_secondary.key_id
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# VPC - Primary Region
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "financial-app-vpc-primary"
  }
}

# VPC - Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "financial-app-vpc-secondary"
  }
}

# Internet Gateways
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name = "financial-app-igw-primary"
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name = "financial-app-igw-secondary"
  }
}

# Public Subnets - Primary Region
resource "aws_subnet" "public_primary" {
  count                   = 2
  provider                = aws.primary
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "financial-app-public-subnet-primary-${count.index + 1}"
    Type = "public"
  }
}

# Private Subnets - Primary Region
resource "aws_subnet" "private_primary" {
  count             = 2
  provider          = aws.primary
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name = "financial-app-private-subnet-primary-${count.index + 1}"
    Type = "private"
  }
}

# Public Subnets - Secondary Region
resource "aws_subnet" "public_secondary" {
  count                   = 2
  provider                = aws.secondary
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "financial-app-public-subnet-secondary-${count.index + 1}"
    Type = "public"
  }
}

# Private Subnets - Secondary Region
resource "aws_subnet" "private_secondary" {
  count             = 2
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = {
    Name = "financial-app-private-subnet-secondary-${count.index + 1}"
    Type = "private"
  }
}

# NAT Gateways for private subnets
resource "aws_eip" "nat_primary" {
  count    = 2
  provider = aws.primary
  domain   = "vpc"

  tags = {
    Name = "financial-app-nat-eip-primary-${count.index + 1}"
  }
}

resource "aws_eip" "nat_secondary" {
  count    = 2
  provider = aws.secondary
  domain   = "vpc"

  tags = {
    Name = "financial-app-nat-eip-secondary-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "primary" {
  count         = 2
  provider      = aws.primary
  allocation_id = aws_eip.nat_primary[count.index].id
  subnet_id     = aws_subnet.public_primary[count.index].id

  tags = {
    Name = "financial-app-nat-primary-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_nat_gateway" "secondary" {
  count         = 2
  provider      = aws.secondary
  allocation_id = aws_eip.nat_secondary[count.index].id
  subnet_id     = aws_subnet.public_secondary[count.index].id

  tags = {
    Name = "financial-app-nat-secondary-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.secondary]
}

# Route Tables - Primary Region
resource "aws_route_table" "public_primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name = "financial-app-public-rt-primary"
  }
}

resource "aws_route_table" "private_primary" {
  count    = 2
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = {
    Name = "financial-app-private-rt-primary-${count.index + 1}"
  }
}

# Route Tables - Secondary Region
resource "aws_route_table" "public_secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = {
    Name = "financial-app-public-rt-secondary"
  }
}

resource "aws_route_table" "private_secondary" {
  count    = 2
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = {
    Name = "financial-app-private-rt-secondary-${count.index + 1}"
  }
}

# Route Table Associations - Primary Region
resource "aws_route_table_association" "public_primary" {
  count          = 2
  provider       = aws.primary
  subnet_id      = aws_subnet.public_primary[count.index].id
  route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "private_primary" {
  count          = 2
  provider       = aws.primary
  subnet_id      = aws_subnet.private_primary[count.index].id
  route_table_id = aws_route_table.private_primary[count.index].id
}

# Route Table Associations - Secondary Region
resource "aws_route_table_association" "public_secondary" {
  count          = 2
  provider       = aws.secondary
  subnet_id      = aws_subnet.public_secondary[count.index].id
  route_table_id = aws_route_table.public_secondary.id
}

resource "aws_route_table_association" "private_secondary" {
  count          = 2
  provider       = aws.secondary
  subnet_id      = aws_subnet.private_secondary[count.index].id
  route_table_id = aws_route_table.private_secondary[count.index].id
}

# IAM Roles and Policies
resource "aws_iam_role" "financial_app_role" {
  name = "financial-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["ec2.amazonaws.com", "lambda.amazonaws.com", "ecs-tasks.amazonaws.com"]
        }
      }
    ]
  })

  tags = {
    Name = "financial-app-role"
  }
}

resource "aws_iam_policy" "financial_app_policy" {
  name        = "financial-app-policy"
  description = "Policy for financial app with minimal required permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.financial_app_primary.arn,
          aws_kms_key.financial_app_secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "financial_app_policy_attachment" {
  role       = aws_iam_role.financial_app_role.name
  policy_arn = aws_iam_policy.financial_app_policy.arn
}

resource "aws_iam_instance_profile" "financial_app_profile" {
  name = "financial-app-profile"
  role = aws_iam_role.financial_app_role.name
}

# CloudWatch Log Groups - Primary Region
resource "aws_cloudwatch_log_group" "financial_app_primary" {
  provider          = aws.primary
  name              = "/aws/financial-app/primary"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.financial_app_primary.arn

  tags = {
    Name = "financial-app-logs-primary"
  }
}

# CloudWatch Log Groups - Secondary Region
resource "aws_cloudwatch_log_group" "financial_app_secondary" {
  provider          = aws.secondary
  name              = "/aws/financial-app/secondary"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.financial_app_secondary.arn

  tags = {
    Name = "financial-app-logs-secondary"
  }
}

# CloudWatch Alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "high_cpu_primary" {
  provider            = aws.primary
  alarm_name          = "financial-app-high-cpu-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts_primary.arn]

  tags = {
    Name = "financial-app-cpu-alarm-primary"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_cpu_secondary" {
  provider            = aws.secondary
  alarm_name          = "financial-app-high-cpu-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]

  tags = {
    Name = "financial-app-cpu-alarm-secondary"
  }
}

# SNS Topics for alerts
resource "aws_sns_topic" "alerts_primary" {
  provider          = aws.primary
  name              = "financial-app-alerts-primary"
  kms_master_key_id = aws_kms_key.financial_app_primary.id

  tags = {
    Name = "financial-app-alerts-primary"
  }
}

resource "aws_sns_topic" "alerts_secondary" {
  provider          = aws.secondary
  name              = "financial-app-alerts-secondary"
  kms_master_key_id = aws_kms_key.financial_app_secondary.id

  tags = {
    Name = "financial-app-alerts-secondary"
  }
}

# Security Groups
resource "aws_security_group" "financial_app_primary" {
  provider    = aws.primary
  name        = "financial-app-sg-primary"
  description = "Security group for financial app - primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "financial-app-sg-primary"
  }
}

resource "aws_security_group" "financial_app_secondary" {
  provider    = aws.secondary
  name        = "financial-app-sg-secondary"
  description = "Security group for financial app - secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "financial-app-sg-secondary"
  }
}
