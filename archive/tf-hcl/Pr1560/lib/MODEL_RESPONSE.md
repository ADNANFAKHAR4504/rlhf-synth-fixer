# Model Response Documentation

## Ideal Response Structure for Multi-Environment AWS Infrastructure

### 1. Project Setup and Organization

#### Directory Structure
```
project/
├── environments/
│   ├── development/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── outputs.tf
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── outputs.tf
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       ├── terraform.tfvars
│       └── outputs.tf
├── modules/
│   ├── networking/
│   ├── compute/
│   ├── database/
│   ├── security/
│   └── monitoring/
├── scripts/
├── tests/
└── docs/
```

#### Module Organization
- **Networking Module**: VPC, subnets, route tables, NAT gateways
- **Compute Module**: EC2 instances, Auto Scaling groups, load balancers
- **Database Module**: RDS instances, parameter groups, subnet groups
- **Security Module**: IAM roles, security groups, KMS keys
- **Monitoring Module**: CloudWatch alarms, logs, dashboards

### 2. Environment-Specific Configurations

#### Development Environment
```hcl
# environments/development/terraform.tfvars
environment = "development"
instance_type = "t3.micro"
db_instance_class = "db.t3.micro"
enable_deletion_protection = false
enable_multi_az = false
vpc_cidr = "10.0.0.0/16"
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
```

#### Staging Environment
```hcl
# environments/staging/terraform.tfvars
environment = "staging"
instance_type = "t3.small"
db_instance_class = "db.t3.small"
enable_deletion_protection = false
enable_multi_az = true
vpc_cidr = "10.1.0.0/16"
public_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
```

#### Production Environment
```hcl
# environments/production/terraform.tfvars
environment = "production"
instance_type = "t3.medium"
db_instance_class = "db.t3.medium"
enable_deletion_protection = true
enable_multi_az = true
vpc_cidr = "10.2.0.0/16"
public_subnet_cidrs = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnet_cidrs = ["10.2.11.0/24", "10.2.12.0/24", "10.2.13.0/24"]
```

### 3. Security Best Practices

#### IAM Role Configuration
```hcl
# modules/security/iam.tf
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-ec2-role"
  
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
  
  tags = var.common_tags
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.environment}-ec2-policy"
  role = aws_iam_role.ec2_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_s3_bucket.data.arn}/*",
          "${aws_cloudwatch_log_group.app.arn}:*"
        ]
      }
    ]
  })
}
```

#### Security Group Configuration
```hcl
# modules/security/security_groups.tf
resource "aws_security_group" "application" {
  name_prefix = "${var.environment}-app-"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-application-sg"
  })
}
```

### 4. Networking Configuration

#### VPC and Subnets
```hcl
# modules/networking/vpc.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-vpc"
  })
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  map_public_ip_on_launch = true
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}
```

#### NAT Gateways and Routing
```hcl
# modules/networking/nat.tf
resource "aws_eip" "nat" {
  count = var.enable_multi_az ? length(var.public_subnet_cidrs) : 1
  vpc   = true
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_multi_az ? length(var.public_subnet_cidrs) : 1
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-nat-gateway-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}
```

### 5. Compute Resources

#### Auto Scaling Group (Production)
```hcl
# modules/compute/asg.tf
resource "aws_autoscaling_group" "main" {
  count               = var.environment == "production" ? 1 : 0
  name                = "${var.environment}-asg"
  desired_capacity    = var.asg_desired_capacity
  max_size            = var.asg_max_size
  min_size            = var.asg_min_size
  target_group_arns   = [aws_lb_target_group.main.arn]
  vpc_zone_identifier = var.private_subnet_ids
  
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "${var.environment}-asg-instance"
    propagate_at_launch = true
  }
  
  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}
```

#### Load Balancer Configuration
```hcl
# modules/compute/alb.tf
resource "aws_lb" "main" {
  name               = "${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids
  
  enable_deletion_protection = var.environment == "production"
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-alb"
  })
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
```

### 6. Database Configuration

#### RDS Instance with Encryption
```hcl
# modules/database/rds.tf
resource "aws_db_instance" "main" {
  identifier = "${var.environment}-db"
  
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 3306
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  
  backup_retention_period = var.db_backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  
  multi_az = var.enable_multi_az
  
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.environment}-db-final-snapshot"
  
  deletion_protection = var.enable_deletion_protection
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-database"
  })
}
```

### 7. Monitoring and Logging

#### CloudWatch Alarms
```hcl
# modules/monitoring/alarms.tf
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count               = var.environment == "production" ? 1 : 0
  alarm_name          = "${var.environment}-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main[0].name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  
  tags = var.common_tags
}
```

#### S3 Logging Configuration
```hcl
# modules/storage/s3.tf
resource "aws_s3_bucket" "data" {
  bucket = "${var.environment}-data-${random_string.bucket_suffix.result}"
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-data-bucket"
  })
}

resource "aws_s3_bucket_logging" "data" {
  bucket = aws_s3_bucket.data.id
  
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "log/"
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}
```

### 8. State Management

#### Remote State Configuration
```hcl
# environments/production/main.tf
terraform {
  required_version = ">= 1.4.0"
  
  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

### 9. Variable Validation

#### Comprehensive Variable Validation
```hcl
# variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.db_password) >= 8
    error_message = "Password must be at least 8 characters long."
  }
}
```

### 10. Outputs and Documentation

#### Comprehensive Outputs
```hcl
# outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.compute.alb_dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.rds_endpoint
  sensitive   = true
}

output "cost_estimation" {
  description = "Estimated monthly costs"
  value = {
    ec2_instances = var.environment == "production" ? 150 : 30
    rds_instance  = var.environment == "production" ? 200 : 50
    alb           = var.environment == "production" ? 20 : 0
    nat_gateway   = var.environment == "production" ? 45 : 0
    total_estimated = var.environment == "production" ? 415 : 80
  }
}
```

This structure provides a comprehensive, production-ready multi-environment AWS infrastructure that follows best practices for security, scalability, and maintainability.
