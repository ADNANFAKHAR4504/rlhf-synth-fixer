# tap_stack.tf - Secure, Highly Available Web Application Infrastructure

# Variable definitions
variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-west-2"
}

variable "db_password" {
  description = "RDS database master password. Use AWS Secrets Manager or environment variables in production."
  type        = string
  sensitive   = true
  default     = null # Must be provided via terraform.tfvars or environment variable
}

# Data source to get available AZs in the region
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Configuration - Creating a secure VPC with proper CIDR block
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "webapp-vpc"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# Internet Gateway - Required for public subnet internet connectivity
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "webapp-igw"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# Public Subnet 1 - For EC2 instances, ALB, and NAT Gateway in AZ1
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "webapp-public-subnet-1"
    Environment = "Production"
    Project     = "WebApp"
    Type        = "Public"
  }
}

# Public Subnet 2 - For EC2 instances, ALB, and NAT Gateway in AZ2
resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "webapp-public-subnet-2"
    Environment = "Production"
    Project     = "WebApp"
    Type        = "Public"
  }
}

# Private Subnet 1 - For RDS and backend components in AZ1
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "webapp-private-subnet-1"
    Environment = "Production"
    Project     = "WebApp"
    Type        = "Private"
  }
}

# Private Subnet 2 - For RDS and backend components in AZ2
resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "webapp-private-subnet-2"
    Environment = "Production"
    Project     = "WebApp"
    Type        = "Private"
  }
}

# Elastic IPs for NAT Gateways - Static IPs required for NAT Gateway
resource "aws_eip" "nat_1" {
  domain = "vpc"

  tags = {
    Name        = "webapp-nat-eip-1"
    Environment = "Production"
    Project     = "WebApp"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_eip" "nat_2" {
  domain = "vpc"

  tags = {
    Name        = "webapp-nat-eip-2"
    Environment = "Production"
    Project     = "WebApp"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway 1 - Enables private subnet internet access in AZ1
resource "aws_nat_gateway" "nat_1" {
  allocation_id = aws_eip.nat_1.id
  subnet_id     = aws_subnet.public_1.id

  tags = {
    Name        = "webapp-nat-gateway-1"
    Environment = "Production"
    Project     = "WebApp"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway 2 - Enables private subnet internet access in AZ2
resource "aws_nat_gateway" "nat_2" {
  allocation_id = aws_eip.nat_2.id
  subnet_id     = aws_subnet.public_2.id

  tags = {
    Name        = "webapp-nat-gateway-2"
    Environment = "Production"
    Project     = "WebApp"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "webapp-public-rt"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# Route Table for Private Subnet 1
resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_1.id
  }

  tags = {
    Name        = "webapp-private-rt-1"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# Route Table for Private Subnet 2
resource "aws_route_table" "private_2" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_2.id
  }

  tags = {
    Name        = "webapp-private-rt-2"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private_1.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private_2.id
}

# Security Group for EC2 instances - Following principle of least privilege
resource "aws_security_group" "ec2" {
  name        = "webapp-ec2-sg"
  description = "Security group for web application EC2 instances"
  vpc_id      = aws_vpc.main.id

  # Ingress rule for HTTP - Consider adding HTTPS (443) for production
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Ingress rule for SSH - Consider restricting to specific IPs in production
  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress rule - Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "webapp-ec2-sg"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# Security Group for RDS - Only allows access from EC2 instances
resource "aws_security_group" "rds" {
  name        = "webapp-rds-sg"
  description = "Security group for RDS database instances"
  vpc_id      = aws_vpc.main.id

  # Ingress rule for MySQL/PostgreSQL from EC2 security group only
  ingress {
    description     = "Database access from EC2 instances"
    from_port       = 3306 # Change to 5432 for PostgreSQL
    to_port         = 3306 # Change to 5432 for PostgreSQL
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  # Egress rule - Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "webapp-rds-sg"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# S3 Bucket for storing templates and logs - Block all public access
resource "aws_s3_bucket" "webapp_storage" {
  bucket_prefix = "webapp-storage-"

  tags = {
    Name        = "webapp-storage-bucket"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# S3 Bucket Public Access Block - Security best practice
resource "aws_s3_bucket_public_access_block" "webapp_storage" {
  bucket = aws_s3_bucket.webapp_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Versioning - Enable for backup and recovery
resource "aws_s3_bucket_versioning" "webapp_storage" {
  bucket = aws_s3_bucket.webapp_storage.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-side Encryption - Encrypt data at rest
resource "aws_s3_bucket_server_side_encryption_configuration" "webapp_storage" {
  bucket = aws_s3_bucket.webapp_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "webapp-ec2-role"

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

  tags = {
    Name        = "webapp-ec2-role"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# IAM Policy for S3 read access - Following principle of least privilege
resource "aws_iam_role_policy" "ec2_s3_policy" {
  name = "webapp-ec2-s3-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.webapp_storage.arn,
          "${aws_s3_bucket.webapp_storage.arn}/*"
        ]
      }
    ]
  })
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "webapp-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "webapp_logs" {
  name              = "/aws/webapp/application"
  retention_in_days = 7

  tags = {
    Name        = "webapp-log-group"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# Attach CloudWatch monitoring policies to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
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

# EC2 Instance in Public Subnet 1
resource "aws_instance" "webapp_1" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_1.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  # Enable detailed monitoring for CloudWatch
  monitoring = true

  # User data script to install CloudWatch agent
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    
    # Install and start web server
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    
    echo "<h1>WebApp Server 1</h1>" > /var/www/html/index.html
  EOF

  tags = {
    Name        = "webapp-ec2-1"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# EC2 Instance in Public Subnet 2
resource "aws_instance" "webapp_2" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_2.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  # Enable detailed monitoring for CloudWatch
  monitoring = true

  # User data script to install CloudWatch agent
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    
    # Install and start web server
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    
    echo "<h1>WebApp Server 2</h1>" > /var/www/html/index.html
  EOF

  tags = {
    Name        = "webapp-ec2-2"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# RDS Subnet Group - Required for Multi-AZ deployment
resource "aws_db_subnet_group" "rds" {
  name       = "webapp-rds-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name        = "webapp-rds-subnet-group"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# RDS Instance - Multi-AZ MySQL deployment for high availability
resource "aws_db_instance" "webapp_db" {
  identifier     = "webapp-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  # Storage configuration
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true # Encryption at rest for security

  # Database configuration
  db_name  = "webapp"
  username = "admin"
  password = var.db_password # Provide via terraform.tfvars, environment variable, or AWS Secrets Manager

  # Multi-AZ for high availability
  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Backup configuration
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Security settings
  publicly_accessible = false
  skip_final_snapshot = true  # Set to false in production
  deletion_protection = false # Set to true in production

  # Enable enhanced monitoring
  enabled_cloudwatch_logs_exports       = ["error", "general", "slowquery"]
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = {
    Name        = "webapp-rds"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# CloudWatch Alarm for EC2 Instance 1 CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ec2_cpu_1" {
  alarm_name          = "webapp-ec2-1-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 cpu utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    InstanceId = aws_instance.webapp_1.id
  }

  tags = {
    Name        = "webapp-ec2-1-cpu-alarm"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# CloudWatch Alarm for EC2 Instance 2 CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ec2_cpu_2" {
  alarm_name          = "webapp-ec2-2-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 cpu utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    InstanceId = aws_instance.webapp_2.id
  }

  tags = {
    Name        = "webapp-ec2-2-cpu-alarm"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# CloudWatch Alarm for EC2 Instance 1 Status Check
resource "aws_cloudwatch_metric_alarm" "ec2_health_1" {
  alarm_name          = "webapp-ec2-1-health-check"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors EC2 instance health"
  treat_missing_data  = "breaching"

  dimensions = {
    InstanceId = aws_instance.webapp_1.id
  }

  tags = {
    Name        = "webapp-ec2-1-health-alarm"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# CloudWatch Alarm for EC2 Instance 2 Status Check
resource "aws_cloudwatch_metric_alarm" "ec2_health_2" {
  alarm_name          = "webapp-ec2-2-health-check"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors EC2 instance health"
  treat_missing_data  = "breaching"

  dimensions = {
    InstanceId = aws_instance.webapp_2.id
  }

  tags = {
    Name        = "webapp-ec2-2-health-alarm"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# CloudWatch Alarm for RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "webapp-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS cpu utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.webapp_db.identifier
  }

  tags = {
    Name        = "webapp-rds-cpu-alarm"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# CloudWatch Alarm for RDS Storage Space
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "webapp-rds-free-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2147483648" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.webapp_db.identifier
  }

  tags = {
    Name        = "webapp-rds-storage-alarm"
    Environment = "Production"
    Project     = "WebApp"
  }
}

# Outputs for reference
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "The ID of the VPC"
}

output "ec2_instance_1_public_ip" {
  value       = aws_instance.webapp_1.public_ip
  description = "Public IP of EC2 instance 1"
}

output "ec2_instance_2_public_ip" {
  value       = aws_instance.webapp_2.public_ip
  description = "Public IP of EC2 instance 2"
}

output "rds_endpoint" {
  value       = aws_db_instance.webapp_db.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.webapp_storage.id
  description = "Name of the S3 bucket"
}