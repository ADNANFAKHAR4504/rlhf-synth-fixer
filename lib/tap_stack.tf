########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}
# lib/tap_stack.tf

# Data sources for availability zones
data "aws_availability_zones" "west" {
  provider = aws.west
  state    = "available"
}

data "aws_availability_zones" "east" {
  provider = aws.east
  state    = "available"
}

# Local values for common configurations
locals {
  common_tags = {
    Environment = "Production"
    Project     = "Migration"
  }
  
  vpc_cidr_west = "10.0.0.0/16"
  vpc_cidr_east = "10.1.0.0/16"
  
  # Subnet CIDRs for us-west-2
  public_subnet_cidrs_west = [
    "10.0.1.0/24",
    "10.0.2.0/24"
  ]
  private_subnet_cidrs_west = [
    "10.0.10.0/24",
    "10.0.20.0/24"
  ]
  
  # Subnet CIDRs for us-east-2
  public_subnet_cidrs_east = [
    "10.1.1.0/24",
    "10.1.2.0/24"
  ]
  private_subnet_cidrs_east = [
    "10.1.10.0/24",
    "10.1.20.0/24"
  ]
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# KMS Keys for encryption
resource "aws_kms_key" "west" {
  provider                = aws.west
  description             = "KMS key for encryption in us-west-2"
  deletion_window_in_days = 7
  
  tags = local.common_tags
}

resource "aws_kms_alias" "west" {
  provider      = aws.west
  name          = "alias/tap-migration-west"
  target_key_id = aws_kms_key.west.key_id
}

resource "aws_kms_key" "east" {
  provider                = aws.east
  description             = "KMS key for encryption in us-east-2"
  deletion_window_in_days = 7
  
  tags = local.common_tags
}

resource "aws_kms_alias" "east" {
  provider      = aws.east
  name          = "alias/tap-migration-east"
  target_key_id = aws_kms_key.east.key_id
}

# Secrets Manager - Database credentials
resource "aws_secretsmanager_secret" "db_credentials_west" {
  provider                = aws.west
  name                    = "tap-migration/db-credentials"
  description             = "Database credentials for TAP migration"
  kms_key_id              = aws_kms_key.west.arn
  recovery_window_in_days = 7
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_credentials_west" {
  provider  = aws.west
  secret_id = aws_secretsmanager_secret.db_credentials_west.id
  secret_string = jsonencode({
    username = "tapuser"
    password = random_password.db_password.result
  })
}

resource "aws_secretsmanager_secret" "db_credentials_east" {
  provider                = aws.east
  name                    = "tap-migration/db-credentials"
  description             = "Database credentials for TAP migration"
  kms_key_id              = aws_kms_key.east.arn
  recovery_window_in_days = 7
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_credentials_east" {
  provider  = aws.east
  secret_id = aws_secretsmanager_secret.db_credentials_east.id
  secret_string = jsonencode({
    username = "tapuser"
    password = random_password.db_password.result
  })
}

# VPC Configuration - us-west-2
resource "aws_vpc" "west" {
  provider             = aws.west
  cidr_block           = local.vpc_cidr_west
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "tap-vpc-west"
  })
}

# Internet Gateway - us-west-2
resource "aws_internet_gateway" "west" {
  provider = aws.west
  vpc_id   = aws_vpc.west.id
  
  tags = merge(local.common_tags, {
    Name = "tap-igw-west"
  })
}

# Public Subnets - us-west-2
resource "aws_subnet" "public_west" {
  provider                = aws.west
  count                   = length(local.public_subnet_cidrs_west)
  vpc_id                  = aws_vpc.west.id
  cidr_block              = local.public_subnet_cidrs_west[count.index]
  availability_zone       = data.aws_availability_zones.west.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "tap-public-subnet-west-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets - us-west-2
resource "aws_subnet" "private_west" {
  provider          = aws.west
  count             = length(local.private_subnet_cidrs_west)
  vpc_id            = aws_vpc.west.id
  cidr_block        = local.private_subnet_cidrs_west[count.index]
  availability_zone = data.aws_availability_zones.west.names[count.index]
  
  tags = merge(local.common_tags, {
    Name = "tap-private-subnet-west-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateway - us-west-2
resource "aws_eip" "nat_west" {
  provider = aws.west
  count    = length(local.public_subnet_cidrs_west)
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "tap-nat-eip-west-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "west" {
  provider      = aws.west
  count         = length(local.public_subnet_cidrs_west)
  allocation_id = aws_eip.nat_west[count.index].id
  subnet_id     = aws_subnet.public_west[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "tap-nat-west-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.west]
}

# Route Tables - us-west-2
resource "aws_route_table" "public_west" {
  provider = aws.west
  vpc_id   = aws_vpc.west.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.west.id
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-public-rt-west"
  })
}

resource "aws_route_table" "private_west" {
  provider = aws.west
  count    = length(local.private_subnet_cidrs_west)
  vpc_id   = aws_vpc.west.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.west[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-private-rt-west-${count.index + 1}"
  })
}

# Route Table Associations - us-west-2
resource "aws_route_table_association" "public_west" {
  provider       = aws.west
  count          = length(aws_subnet.public_west)
  subnet_id      = aws_subnet.public_west[count.index].id
  route_table_id = aws_route_table.public_west.id
}

resource "aws_route_table_association" "private_west" {
  provider       = aws.west
  count          = length(aws_subnet.private_west)
  subnet_id      = aws_subnet.private_west[count.index].id
  route_table_id = aws_route_table.private_west[count.index].id
}

# VPC Configuration - us-east-2
resource "aws_vpc" "east" {
  provider             = aws.east
  cidr_block           = local.vpc_cidr_east
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "tap-vpc-east"
  })
}

# Internet Gateway - us-east-2
resource "aws_internet_gateway" "east" {
  provider = aws.east
  vpc_id   = aws_vpc.east.id
  
  tags = merge(local.common_tags, {
    Name = "tap-igw-east"
  })
}

# Public Subnets - us-east-2
resource "aws_subnet" "public_east" {
  provider                = aws.east
  count                   = length(local.public_subnet_cidrs_east)
  vpc_id                  = aws_vpc.east.id
  cidr_block              = local.public_subnet_cidrs_east[count.index]
  availability_zone       = data.aws_availability_zones.east.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "tap-public-subnet-east-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets - us-east-2
resource "aws_subnet" "private_east" {
  provider          = aws.east
  count             = length(local.private_subnet_cidrs_east)
  vpc_id            = aws_vpc.east.id
  cidr_block        = local.private_subnet_cidrs_east[count.index]
  availability_zone = data.aws_availability_zones.east.names[count.index]
  
  tags = merge(local.common_tags, {
    Name = "tap-private-subnet-east-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateway - us-east-2
resource "aws_eip" "nat_east" {
  provider = aws.east
  count    = length(local.public_subnet_cidrs_east)
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "tap-nat-eip-east-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "east" {
  provider      = aws.east
  count         = length(local.public_subnet_cidrs_east)
  allocation_id = aws_eip.nat_east[count.index].id
  subnet_id     = aws_subnet.public_east[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "tap-nat-east-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.east]
}

# Route Tables - us-east-2
resource "aws_route_table" "public_east" {
  provider = aws.east
  vpc_id   = aws_vpc.east.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.east.id
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-public-rt-east"
  })
}

resource "aws_route_table" "private_east" {
  provider = aws.east
  count    = length(local.private_subnet_cidrs_east)
  vpc_id   = aws_vpc.east.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.east[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-private-rt-east-${count.index + 1}"
  })
}

# Route Table Associations - us-east-2
resource "aws_route_table_association" "public_east" {
  provider       = aws.east
  count          = length(aws_subnet.public_east)
  subnet_id      = aws_subnet.public_east[count.index].id
  route_table_id = aws_route_table.public_east.id
}

resource "aws_route_table_association" "private_east" {
  provider       = aws.east
  count          = length(aws_subnet.private_east)
  subnet_id      = aws_subnet.private_east[count.index].id
  route_table_id = aws_route_table.private_east[count.index].id
}

# Security Groups
resource "aws_security_group" "rds_west" {
  provider    = aws.west
  name        = "tap-rds-sg-west"
  description = "Security group for RDS instances in us-west-2"
  vpc_id      = aws_vpc.west.id
  
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr_west]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-rds-sg-west"
  })
}

resource "aws_security_group" "rds_east" {
  provider    = aws.east
  name        = "tap-rds-sg-east"
  description = "Security group for RDS instances in us-east-2"
  vpc_id      = aws_vpc.east.id
  
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr_east]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-rds-sg-east"
  })
}

resource "aws_security_group" "alb_west" {
  provider    = aws.west
  name        = "tap-alb-sg-west"
  description = "Security group for Application Load Balancer in us-west-2"
  vpc_id      = aws_vpc.west.id
  
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
  
  tags = merge(local.common_tags, {
    Name = "tap-alb-sg-west"
  })
}

resource "aws_security_group" "alb_east" {
  provider    = aws.east
  name        = "tap-alb-sg-east"
  description = "Security group for Application Load Balancer in us-east-2"
  vpc_id      = aws_vpc.east.id
  
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
  
  tags = merge(local.common_tags, {
    Name = "tap-alb-sg-east"
  })
}

# IAM Roles and Policies
resource "aws_iam_role" "ec2_role" {
  name = "tap-ec2-role"
  
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

resource "aws_iam_policy" "ec2_policy" {
  name        = "tap-ec2-policy"
  description = "Policy for EC2 instances with least privilege access"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials_west.arn,
          aws_secretsmanager_secret.db_credentials_east.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.west.arn,
          aws_kms_key.east.arn
        ]
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
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "tap-ec2-profile"
  role = aws_iam_role.ec2_role.name
  
  tags = local.common_tags
}

# RDS Subnet Groups
resource "aws_db_subnet_group" "west" {
  provider   = aws.west
  name       = "tap-db-subnet-group-west"
  subnet_ids = aws_subnet.private_west[*].id
  
  tags = merge(local.common_tags, {
    Name = "tap-db-subnet-group-west"
  })
}

resource "aws_db_subnet_group" "east" {
  provider   = aws.east
  name       = "tap-db-subnet-group-east"
  subnet_ids = aws_subnet.private_east[*].id
  
  tags = merge(local.common_tags, {
    Name = "tap-db-subnet-group-east"
  })
}

# RDS Instances with automated backups
resource "aws_db_instance" "west" {
  provider                = aws.west
  identifier              = "tap-db-west"
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_type            = "gp2"
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.west.arn
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  db_name                 = "tapdb"
  username                = jsondecode(aws_secretsmanager_secret_version.db_credentials_west.secret_string)["username"]
  password                = jsondecode(aws_secretsmanager_secret_version.db_credentials_west.secret_string)["password"]
  vpc_security_group_ids  = [aws_security_group.rds_west.id]
  db_subnet_group_name    = aws_db_subnet_group.west.name
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  skip_final_snapshot    = false
  final_snapshot_identifier = "tap-db-west-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  deletion_protection    = true
  multi_az              = true
  
  tags = merge(local.common_tags, {
    Name = "tap-db-west"
  })
  
  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}

resource "aws_db_instance" "east" {
  provider                = aws.east
  identifier              = "tap-db-east"
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_type            = "gp2"
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.east.arn
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  db_name                 = "tapdb"
  username                = jsondecode(aws_secretsmanager_secret_version.db_credentials_east.secret_string)["username"]
  password                = jsondecode(aws_secretsmanager_secret_version.db_credentials_east.secret_string)["password"]
  vpc_security_group_ids  = [aws_security_group.rds_east.id]
  db_subnet_group_name    = aws_db_subnet_group.east.name
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  skip_final_snapshot    = false
  final_snapshot_identifier = "tap-db-east-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  deletion_protection    = true
  multi_az              = true
  
  tags = merge(local.common_tags, {
    Name = "tap-db-east"
  })
  
  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}

# Application Load Balancers
resource "aws_lb" "west" {
  provider           = aws.west
  name               = "tap-alb-west"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_west.id]
  subnets            = aws_subnet.public_west[*].id
  
  enable_deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "tap-alb-west"
  })
}

resource "aws_lb" "east" {
  provider           = aws.east
  name               = "tap-alb-east"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_east.id]
  subnets            = aws_subnet.public_east[*].id
  
  enable_deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "tap-alb-east"
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "app_logs_west" {
  provider          = aws.west
  name              = "/tap/application/west"
  retention_in_days = 7
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "app_logs_east" {
  provider          = aws.east
  name              = "/tap/application/east"
  retention_in_days = 7
  
  tags = local.common_tags
}

# CloudWatch Alarms for RDS
resource "aws_cloudwatch_metric_alarm" "rds_cpu_west" {
  provider            = aws.west
  alarm_name          = "tap-rds-cpu-utilization-west"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization in us-west-2"
  alarm_actions       = []
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.west.id
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_east" {
  provider            = aws.east
  alarm_name          = "tap-rds-cpu-utilization-east"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization in us-east-2"
  alarm_actions       = []
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.east.id
  }
  
  tags = local.common_tags
}

# CloudWatch Alarms for ALB Health Checks (for Route53 failover)
resource "aws_cloudwatch_metric_alarm" "alb_health_west" {
  provider            = aws.west
  alarm_name          = "tap-alb-health-west"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors ALB 5XX errors in us-west-2"
  alarm_actions       = []
  
  dimensions = {
    LoadBalancer = aws_lb.west.arn_suffix
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_health_east" {
  provider            = aws.east
  alarm_name          = "tap-alb-health-east"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors ALB 5XX errors in us-east-2"
  alarm_actions       = []
  
  dimensions = {
    LoadBalancer = aws_lb.east.arn_suffix
  }
  
  tags = local.common_tags
}

# Route53 Health Checks for failover (CloudWatch Alarm-based)
resource "aws_route53_health_check" "west" {
  type                            = "CLOUDWATCH_METRIC"
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.alb_health_west.alarm_name
  cloudwatch_alarm_region         = "us-west-2"
  insufficient_data_health_status = "Unhealthy"
  
  tags = merge(local.common_tags, {
    Name = "tap-health-check-west"
  })
}

resource "aws_route53_health_check" "east" {
  type                            = "CLOUDWATCH_METRIC"
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.alb_health_east.alarm_name
  cloudwatch_alarm_region         = "us-east-2"
  insufficient_data_health_status = "Unhealthy"
  
  tags = merge(local.common_tags, {
    Name = "tap-health-check-east"
  })
}

# Outputs for reference
output "vpc_ids" {
  description = "VPC IDs for both regions"
  value = {
    west = aws_vpc.west.id
    east = aws_vpc.east.id
  }
}

output "rds_endpoints" {
  description = "RDS endpoints for both regions"
  value = {
    west = aws_db_instance.west.endpoint
    east = aws_db_instance.east.endpoint
  }
  sensitive = true
}

output "load_balancer_dns" {
  description = "Load balancer DNS names"
  value = {
    west = aws_lb.west.dns_name
    east = aws_lb.east.dns_name
  }
}

output "secrets_manager_arns" {
  description = "Secrets Manager ARNs"
  value = {
    west = aws_secretsmanager_secret.db_credentials_west.arn
    east = aws_secretsmanager_secret.db_credentials_east.arn
  }
}

output "kms_key_arns" {
  description = "KMS Key ARNs for both regions"
  value = {
    west = aws_kms_key.west.arn
    east = aws_kms_key.east.arn
  }
}