```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# VPC
resource "aws_vpc" "prod_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "ProdVPC"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "prod_igw" {
  vpc_id = aws_vpc.prod_vpc.id

  tags = {
    Name        = "ProdIGW"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Public Subnets
resource "aws_subnet" "public_subnets" {
  count                   = 2
  vpc_id                  = aws_vpc.prod_vpc.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "ProdPublicSubnet-${count.index + 1}"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# Private Subnets
resource "aws_subnet" "private_subnets" {
  count             = 2
  vpc_id            = aws_vpc.prod_vpc.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "ProdPrivateSubnet-${count.index + 1}"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat_eips" {
  count  = 2
  domain = "vpc"

  tags = {
    Name        = "ProdNATEIP-${count.index + 1}"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "prod_nat_gateways" {
  count         = 2
  allocation_id = aws_eip.nat_eips[count.index].id
  subnet_id     = aws_subnet.public_subnets[count.index].id

  tags = {
    Name        = "ProdNATGateway-${count.index + 1}"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }

  depends_on = [aws_internet_gateway.prod_igw]
}

# Public Route Table
resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.prod_igw.id
  }

  tags = {
    Name        = "ProdPublicRouteTable"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# Public Subnet Associations
resource "aws_route_table_association" "public_subnet_associations" {
  count          = 2
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_route_table.id
}

# Private Route Tables
resource "aws_route_table" "private_route_tables" {
  count  = 2
  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.prod_nat_gateways[count.index].id
  }

  tags = {
    Name        = "ProdPrivateRouteTable-${count.index + 1}"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# Private Subnet Associations
resource "aws_route_table_association" "private_subnet_associations" {
  count          = 2
  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private_route_tables[count.index].id
}

# VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "ProdVPCFlowLogs"
  retention_in_days = 7

  tags = {
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

resource "aws_iam_role" "vpc_flow_log_role" {
  name = "ProdVPCFlowLogRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })

  tags = {
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

resource "aws_iam_role_policy" "vpc_flow_log_policy" {
  name = "ProdVPCFlowLogPolicy"
  role = aws_iam_role.vpc_flow_log_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_flow_log" "prod_vpc_flow_log" {
  iam_role_arn         = aws_iam_role.vpc_flow_log_role.arn
  log_destination_arn  = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.prod_vpc.id

  tags = {
    Name        = "ProdVPCFlowLog"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# EC2 IAM Role
resource "aws_iam_role" "ec2_role" {
  name = "ProdEC2Role"

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

  tags = {
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

resource "aws_iam_role_policy_attachment" "ec2_s3_readonly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
  role       = aws_iam_role.ec2_role.name
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ProdEC2InstanceProfile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# EC2 Security Group
resource "aws_security_group" "ec2_sg" {
  name        = "ProdEC2SecurityGroup"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.prod_vpc.id

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

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["203.0.113.0/24"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ProdEC2SecurityGroup"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# Launch Template
resource "aws_launch_template" "prod_launch_template" {
  name_prefix   = "ProdLaunchTemplate"
  image_id      = "ami-0abcdef1234567890"
  instance_type = "t2.micro"

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from AWS EC2</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "ProdEC2Instance"
      Environment = "Production"
      Project     = "BusinessCriticalVPC"
    }
  }

  tags = {
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "prod_asg" {
  name                = "ProdAutoScalingGroup"
  vpc_zone_identifier = aws_subnet.private_subnets[*].id
  min_size            = 2
  max_size            = 6
  desired_capacity    = 2

  launch_template {
    id      = aws_launch_template.prod_launch_template.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "ProdASGInstance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "Production"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = "BusinessCriticalVPC"
    propagate_at_launch = true
  }
}

# RDS Security Group
resource "aws_security_group" "rds_sg" {
  name        = "ProdRDSSecurityGroup"
  description = "Security group for RDS instance"
  vpc_id      = aws_vpc.prod_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ProdRDSSecurityGroup"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "prod_db_subnet_group" {
  name       = "prod-db-subnet-group"
  subnet_ids = aws_subnet.private_subnets[*].id

  tags = {
    Name        = "ProdDBSubnetGroup"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# RDS Instance
resource "aws_db_instance" "prod_rds" {
  identifier     = "prod-rds-instance"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "proddb"
  username = "admin"
  password = "ChangeMe123!" # TODO: Use AWS Secrets Manager in production
  
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.prod_db_subnet_group.name
  
  publicly_accessible = false
  skip_final_snapshot = true
  
  tags = {
    Name        = "ProdRDSInstance"
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# SNS Topic
resource "aws_sns_topic" "prod_alert_topic" {
  name = "ProdAlertTopic"

  tags = {
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "alert_email" {
  topic_arn = aws_sns_topic.prod_alert_topic.arn
  protocol  = "email"
  endpoint  = "alerts@company.com"
}

# CloudWatch Alarm
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "ProdHighCPUAlarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.prod_alert_topic.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.prod_asg.name
  }

  tags = {
    Environment = "Production"
    Project     = "BusinessCriticalVPC"
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.prod_vpc.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public_subnets[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private_subnets[*].id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.prod_asg.name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.prod_rds.endpoint
  sensitive   = true
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic"
  value       = aws_sns_topic.prod_alert_topic.arn
}

output "cloudwatch_alarm_name" {
  description = "Name of the CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.high_cpu.alarm_name
}
```