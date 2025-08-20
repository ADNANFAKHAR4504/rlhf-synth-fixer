```hcl
########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging/production)"
  type        = string
  default     = "staging"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "myapp"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "default-cost-center"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "terraform-admin"
}

# Variables for SSL/TLS configuration (optional)
variable "domain_name" {
  description = "Domain name for SSL certificate (required for HTTPS)"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for DNS validation"
  type        = string
  default     = ""
}

# Database configuration variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0"
}

variable "allocated_storage" {
  description = "Allocated storage for RDS instance in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for RDS instance in GB"
  type        = number
  default     = 100
}

########################
# Data Sources
########################
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

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

########################
# Locals
########################
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    CostCenter  = var.cost_center
    Owner       = var.owner
    ManagedBy   = "Terraform"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }

  name_prefix = "${var.project_name}-${var.environment}"
}

########################
# Networking Module
########################
module "networking" {
  source             = "./modules/networking"
  name_prefix        = local.name_prefix
  common_tags        = local.common_tags
  environment        = var.environment
  availability_zones = data.aws_availability_zones.available.names
  vpc_cidr           = "10.0.0.0/16"
  az_count           = 3
}

########################
# IAM Module
########################
module "iam" {
  source = "./modules/iam"

  name_prefix = local.name_prefix
  common_tags = local.common_tags
}

########################
# Compute Module
########################
module "compute" {
  source = "./modules/compute"

  name_prefix           = local.name_prefix
  environment           = var.environment
  project_name          = var.project_name
  vpc_id                = module.networking.vpc_id
  vpc_cidr              = module.networking.vpc_cidr
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  instance_profile_name = module.iam.ec2_instance_profile_name
  ami_id                = data.aws_ami.amazon_linux_2.id
  instance_type         = "t3.micro"
  min_size              = 1
  max_size              = 10
  desired_capacity      = 2
  common_tags           = local.common_tags
}

########################
# Database Module
########################
module "database" {
  source                    = "./modules/database"
  name_prefix               = local.name_prefix
  common_tags               = local.common_tags
  vpc_id                    = module.networking.vpc_id
  vpc_cidr                  = module.networking.vpc_cidr
  db_subnet_group_name      = module.networking.db_subnet_group_name
  db_instance_class         = var.db_instance_class
  db_engine_version         = var.db_engine_version
  allocated_storage         = var.allocated_storage
  max_allocated_storage     = var.max_allocated_storage
  database_username         = "admin"
  database_name             = "myappdb"
  environment               = var.environment
  kms_key_arn               = "" # Database module will create its own KMS key if needed
  app_security_group_id     = module.compute.app_security_group_id
  bastion_security_group_id = "" # Optional - can be added later
  monitoring_role_arn       = module.iam.rds_monitoring_role_arn
}

########################
# SSL/TLS Module (Production only)
########################
module "ssl" {
  count  = var.environment == "production" && var.domain_name != "" ? 1 : 0
  source = "./modules/ssl"

  name_prefix                     = local.name_prefix
  common_tags                     = local.common_tags
  domain_name                     = var.domain_name
  route53_zone_id                 = var.route53_zone_id
  load_balancer_arn               = module.compute.load_balancer_arn
  target_group_arn                = module.compute.target_group_arn
  load_balancer_security_group_id = module.compute.load_balancer_security_group_id
}

########################
# Outputs
########################
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.networking.vpc_cidr
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = module.networking.database_subnet_ids
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.compute.load_balancer_dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = module.compute.load_balancer_zone_id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling group"
  value       = module.compute.autoscaling_group_name
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = module.iam.ec2_instance_profile_name
}

output "ec2_role_arn" {
  description = "ARN of the EC2 role"
  value       = module.iam.ec2_role_arn
}

output "autoscaling_role_arn" {
  description = "ARN of the Auto Scaling role"
  value       = module.iam.autoscaling_role_arn
}

output "database_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = module.database.database_endpoint
}

output "database_id" {
  description = "ID of the RDS instance"
  value       = module.database.database_id
}

output "database_password" {
  description = "The generated database password (sensitive)"
  value       = module.database.database_password
  sensitive   = true
}

output "ssm_parameter_name" {
  description = "SSM parameter name for the database password"
  value       = module.database.ssm_parameter_name
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for database encryption"
  value       = module.database.kms_key_arn
}

output "application_url" {
  description = "URL to access the application"
  value       = var.environment == "production" && var.domain_name != "" ? "https://${var.domain_name}" : "http://${module.compute.load_balancer_dns_name}"
}

# SSL/TLS outputs
output "ssl_certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = var.environment == "production" && var.domain_name != "" ? module.ssl[0].certificate_arn : null
}

# Additional outputs for integration tests
output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = module.compute.load_balancer_arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.compute.target_group_arn
}

output "ec2_role_name" {
  description = "Name of the EC2 role"
  value       = module.iam.ec2_role_name
}

output "autoscaling_role_name" {
  description = "Name of the Auto Scaling role"
  value       = module.iam.autoscaling_role_name
}

output "high_cpu_alarm_name" {
  description = "Name of the high CPU alarm"
  value       = module.compute.high_cpu_alarm_name
}

output "low_cpu_alarm_name" {
  description = "Name of the low CPU alarm"
  value       = module.compute.low_cpu_alarm_name
}

```

```hcl
# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-alb-sg"
    Type = "security-group"
  })
}

# Security Group for EC2 instances
# Note: SSH access removed for security - use AWS Systems Manager Session Manager instead
resource "aws_security_group" "ec2" {
  name        = "${var.name_prefix}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # SSH access removed - use Systems Manager Session Manager instead
  # ingress {
  #   description = "SSH"
  #   from_port   = 22
  #   to_port     = 22
  #   protocol    = "tcp"
  #   cidr_blocks = [var.vpc_cidr]
  # }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-ec2-sg"
    Type = "security-group"
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.environment == "production" ? true : false

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-alb"
    Type = "load-balancer"
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-tg"
    Type = "target-group"
  })
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-listener"
    Type = "load-balancer-listener"
  })
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${var.name_prefix}-lt"
  image_id      = var.ami_id
  instance_type = var.instance_type

  user_data = base64encode(data.template_file.user_data.rendered)

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = var.instance_profile_name
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "${var.name_prefix}-instance"
      Type = "compute"
    })
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-launch-template"
    Type = "compute"
  })
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                      = "${var.name_prefix}-asg"
  vpc_zone_identifier       = var.private_subnet_ids
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  # Instance refresh configuration
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.name_prefix}-asg"
    propagate_at_launch = false
  }

  tag {
    key                 = "Type"
    value               = "auto-scaling-group"
    propagate_at_launch = false
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.name_prefix}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.name_prefix}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.name_prefix}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-high-cpu-alarm"
    Type = "cloudwatch-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${var.name_prefix}-low-cpu"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-low-cpu-alarm"
    Type = "cloudwatch-alarm"
  })
}

# User data script for EC2 instances
data "template_file" "user_data" {
  template = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              
              # Install SSM Agent
              yum install -y amazon-ssm-agent
              systemctl enable amazon-ssm-agent
              systemctl start amazon-ssm-agent
              
              # Install CloudWatch agent
              yum install -y amazon-cloudwatch-agent
              
              # Create CloudWatch config
              cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'CWCONFIG'
              {
                "agent": {
                  "metrics_collection_interval": 60,
                  "run_as_user": "cwagent"
                },
                "metrics": {
                  "metrics_collected": {
                    "cpu": {
                      "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                      "metrics_collection_interval": 60,
                      "totalcpu": false
                    },
                    "disk": {
                      "measurement": ["used_percent"],
                      "metrics_collection_interval": 60,
                      "resources": ["*"]
                    },
                    "diskio": {
                      "measurement": ["io_time"],
                      "metrics_collection_interval": 60,
                      "resources": ["*"]
                    },
                    "mem": {
                      "measurement": ["mem_used_percent"],
                      "metrics_collection_interval": 60
                    },
                    "netstat": {
                      "measurement": ["tcp_established", "tcp_time_wait"],
                      "metrics_collection_interval": 60
                    },
                    "swap": {
                      "measurement": ["swap_used_percent"],
                      "metrics_collection_interval": 60
                    }
                  }
                }
              }
              CWCONFIG
              
              # Start CloudWatch agent
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
              systemctl enable amazon-cloudwatch-agent
              systemctl start amazon-cloudwatch-agent
              
              # Create a simple web page
              echo "<h1>Hello from ${var.name_prefix}!</h1>" > /var/www/html/index.html
              echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
              echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
              echo "<p>Environment: ${var.environment}</p>" >> /var/www/html/index.html
              EOF
}

```

```hcl
output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling group"
  value       = aws_autoscaling_group.main.name
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "load_balancer_security_group_id" {
  description = "ID of the load balancer security group"
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.ec2.id
}

output "high_cpu_alarm_name" {
  description = "Name of the high CPU alarm"
  value       = aws_cloudwatch_metric_alarm.high_cpu.alarm_name
}

output "low_cpu_alarm_name" {
  description = "Name of the low CPU alarm"
  value       = aws_cloudwatch_metric_alarm.low_cpu.alarm_name
}

```

```bash
#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent

# Install your application here
# Example: Install nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Create a simple health check endpoint
echo "OK" > /var/www/html/health

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "metrics": {
        "namespace": "${project}/${environment}",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

```

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "instance_profile_name" {
  description = "IAM instance profile name"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

```hcl
# Generate secure random password for database
resource "random_password" "database" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

# KMS Key for database encryption
resource "aws_kms_key" "database" {
  description             = "KMS key for database encryption"
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
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SSM to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ssm.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database-kms-key"
    Type = "kms-key"
  })
}

# KMS Alias for easier key management
resource "aws_kms_alias" "database" {
  name          = "alias/${var.name_prefix}-database"
  target_key_id = aws_kms_key.database.key_id
}

# Store password in SSM Parameter Store for secure access
resource "aws_ssm_parameter" "database_password" {
  name        = "/${var.name_prefix}/database/password"
  description = "Database password for ${var.name_prefix}"
  type        = "SecureString"
  value       = random_password.database.result
  key_id      = aws_kms_key.database.arn

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database-password-param"
    Type = "ssm-parameter"
  })
}

# RDS Parameter Group with SSL/TLS configuration
resource "aws_db_parameter_group" "main" {
  family = var.db_engine_version == "8.0" ? "mysql8.0" : "mysql${replace(var.db_engine_version, ".", "")}"
  name   = "${var.name_prefix}-db-params"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  # Force SSL connections (requires reboot)
  parameter {
    name         = "require_secure_transport"
    value        = "ON"
    apply_method = "pending-reboot"
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-db-parameter-group"
    Type = "database"
  })
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.name_prefix}-rds-sg"
  vpc_id      = var.vpc_id

  # Allow MySQL traffic from application security group
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }

  # Allow MySQL traffic from bastion host (if exists)
  dynamic "ingress" {
    for_each = var.bastion_security_group_id != "" ? [1] : []
    content {
      from_port       = 3306
      to_port         = 3306
      protocol        = "tcp"
      security_groups = [var.bastion_security_group_id]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-rds-sg"
    Type = "security-group"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Instance with SSL/TLS and encryption
resource "aws_db_instance" "main" {
  identifier = "${var.name_prefix}-db"

  # Database configuration
  engine         = "mysql"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.database.arn

  # Database credentials - using generated password
  username = var.database_username
  password = random_password.database.result
  db_name  = var.database_name

  # Network configuration
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = var.db_subnet_group_name

  # Backup and maintenance
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  multi_az                = var.environment == "production"

  # Performance and monitoring
  parameter_group_name = aws_db_parameter_group.main.name
  monitoring_interval  = var.environment == "production" ? 60 : 0
  monitoring_role_arn  = var.environment == "production" ? var.monitoring_role_arn : null

  # Security
  deletion_protection       = var.environment == "production"
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # SSL/TLS configuration
  ca_cert_identifier = "rds-ca-rsa2048-g1"

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database"
    Type = "database"
  })
}

# RDS Read Replica for production
resource "aws_db_instance" "read_replica" {
  count = var.environment == "production" ? 1 : 0

  identifier = "${var.name_prefix}-db-read-replica"

  # Replica configuration
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = var.db_instance_class

  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.database.arn

  # Network configuration
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = var.db_subnet_group_name

  # Backup and maintenance
  backup_retention_period = 7
  backup_window           = "03:30-04:30"
  maintenance_window      = "sun:04:30-sun:05:30"

  # Performance and monitoring
  monitoring_interval = 60
  monitoring_role_arn = var.monitoring_role_arn

  # Security
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name_prefix}-read-replica-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # SSL/TLS configuration
  ca_cert_identifier = "rds-ca-rsa2048-g1"

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database-read-replica"
    Type = "database"
  })
}

# Data sources for current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

```hcl
output "database_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "database_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "database_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "database_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "database_parameter_group_name" {
  description = "Name of the RDS parameter group"
  value       = aws_db_parameter_group.main.name
}

output "database_password" {
  description = "The generated database password (sensitive)"
  value       = random_password.database.result
  sensitive   = true
}

output "ssm_parameter_arn" {
  description = "ARN of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.arn
}

output "ssm_parameter_name" {
  description = "Name of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.name
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for database encryption"
  value       = aws_kms_key.database.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for database encryption"
  value       = aws_kms_key.database.key_id
}

output "read_replica_endpoint" {
  description = "Endpoint of the RDS read replica (if exists)"
  value       = var.environment == "production" ? aws_db_instance.read_replica[0].endpoint : null
}

output "read_replica_id" {
  description = "ID of the RDS read replica (if exists)"
  value       = var.environment == "production" ? aws_db_instance.read_replica[0].id : null
}

```

```hcl

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "vpc_id" {
  description = "VPC ID where the database will be created"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0"
  validation {
    condition     = contains(["8.0", "8.0.35", "8.0.34", "8.0.33", "8.0.32"], var.db_engine_version)
    error_message = "Engine version must be a valid MySQL 8.0 version."
  }
}

variable "allocated_storage" {
  description = "Allocated storage for RDS instance in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for RDS instance in GB"
  type        = number
  default     = 100
}

variable "database_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for database encryption"
  type        = string
  default     = ""
}

variable "app_security_group_id" {
  description = "Security group ID of the application instances"
  type        = string
}

variable "bastion_security_group_id" {
  description = "Security group ID of the bastion host (optional)"
  type        = string
  default     = ""
}

variable "monitoring_role_arn" {
  description = "ARN of the IAM role for RDS enhanced monitoring"
  type        = string
  default     = ""
}

```

```hcl
# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${var.name_prefix}-ec2-role"

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
    Name = "${var.name_prefix}-ec2-role"
    Type = "iam-role"
  })
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-ec2-profile"
    Type = "iam-profile"
  })
}

# IAM Policy for EC2 instances
# Note: Permissions have been tightened with additional conditions for security
resource "aws_iam_policy" "ec2_policy" {
  name        = "${var.name_prefix}-ec2-policy"
  description = "Policy for EC2 instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["cloudwatch:PutMetricData"]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = ["${var.name_prefix}"]
          }
        }
      },
      {
        Effect   = "Allow"
        Action   = ["ec2:DescribeVolumes", "ec2:DescribeTags"]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/Project" = [var.name_prefix]
          }
          StringLike = {
            "aws:RequestTag/Environment" = ["*"]
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:${var.name_prefix}*",
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:${var.name_prefix}*:log-stream:*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.name_prefix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/Project" = [var.name_prefix]
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-ec2-policy"
    Type = "iam-policy"
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# Attach AWS managed policies with scoped permissions
resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Auto Scaling Service Role
resource "aws_iam_role" "autoscaling_role" {
  name = "${var.name_prefix}-autoscaling-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "autoscaling.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-autoscaling-role"
    Type = "iam-role"
  })
}

resource "aws_iam_role_policy_attachment" "autoscaling_policy" {
  role       = aws_iam_role.autoscaling_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AutoScalingNotificationAccessRole"
}

# RDS Enhanced Monitoring Role
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.name_prefix}-rds-monitoring-role"

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

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-rds-monitoring-role"
    Type = "iam-role"
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Data sources for current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

```hcl
output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_role_arn" {
  description = "ARN of the EC2 role"
  value       = aws_iam_role.ec2_role.arn
}

output "autoscaling_role_arn" {
  description = "ARN of the Auto Scaling role"
  value       = aws_iam_role.autoscaling_role.arn
}

output "ec2_role_name" {
  description = "Name of the EC2 role"
  value       = aws_iam_role.ec2_role.name
}

output "autoscaling_role_name" {
  description = "Name of the Auto Scaling role"
  value       = aws_iam_role.autoscaling_role.name
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS monitoring role"
  value       = aws_iam_role.rds_monitoring.arn
}

```

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

```

```hcl
# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", var.autoscaling_group_name],
            [".", "NetworkIn", ".", "."],
            [".", "NetworkOut", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "EC2 Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.database_identifier],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeableMemory", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "RDS Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.load_balancer_name],
            [".", "RequestCount", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Load Balancer Metrics"
        }
      }
    ]
  })
}

# High CPU Alarm
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.name_prefix}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = var.autoscaling_group_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-high-cpu-alarm"
    Type = "alarm"
  })
}

# High Memory Alarm
resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${var.name_prefix}-high-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000000000" # 1GB in bytes
  alarm_description   = "This metric monitors EC2 freeable memory"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = var.autoscaling_group_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-high-memory-alarm"
    Type = "alarm"
  })
}

# Database CPU Alarm
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.name_prefix}-database-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.database_identifier
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database-cpu-alarm"
    Type = "alarm"
  })
}

# Load Balancer 5XX Errors Alarm
resource "aws_cloudwatch_metric_alarm" "lb_5xx_errors" {
  alarm_name          = "${var.name_prefix}-lb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors load balancer 5XX errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-lb-5xx-errors-alarm"
    Type = "alarm"
  })
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.name_prefix}-alerts"

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-alerts-topic"
    Type = "sns-topic"
  })
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# Data sources
data "aws_region" "current" {}


```

```hcl
output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "alerts_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "high_cpu_alarm_name" {
  description = "Name of the high CPU alarm"
  value       = aws_cloudwatch_metric_alarm.high_cpu.alarm_name
}

output "high_memory_alarm_name" {
  description = "Name of the high memory alarm"
  value       = aws_cloudwatch_metric_alarm.high_memory.alarm_name
}

output "database_cpu_alarm_name" {
  description = "Name of the database CPU alarm"
  value       = aws_cloudwatch_metric_alarm.database_cpu.alarm_name
}

output "lb_5xx_errors_alarm_name" {
  description = "Name of the load balancer 5XX errors alarm"
  value       = aws_cloudwatch_metric_alarm.lb_5xx_errors.alarm_name
}
```

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "autoscaling_group_name" {
  description = "Name of the Auto Scaling group"
  type        = string
}

variable "database_identifier" {
  description = "Identifier of the RDS database instance"
  type        = string
}

variable "load_balancer_name" {
  description = "Name of the Application Load Balancer"
  type        = string
}
```

```hcl
# Get available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-vpc"
    Type = "networking"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-igw"
    Type = "networking"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = var.az_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-public-subnet-${count.index + 1}"
    Type = "public-subnet"
    Tier = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + var.az_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private-subnet"
    Tier = "private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + (var.az_count * 2))
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-db-subnet-${count.index + 1}"
    Type = "database-subnet"
    Tier = "database"
  })
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = var.az_count

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-nat-eip-${count.index + 1}"
    Type = "networking"
  })
}

# NAT Gateways for private subnets (conditional based on environment)
resource "aws_nat_gateway" "main" {
  count = var.environment == "production" ? length(var.availability_zones) : 1

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-nat-gw-${count.index + 1}"
    Type = "networking"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-public-rt"
    Type = "networking"
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = var.environment == "production" ? length(var.availability_zones) : 1
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-private-rt-${count.index + 1}"
    Type = "networking"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = var.az_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Subnet Route Table Associations
resource "aws_route_table_association" "private" {
  count = var.environment == "production" ? length(var.availability_zones) : 1

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-db-subnet-group"
    Type = "database"
  })
}
```

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

```

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3
}
```

```hcl
# Generate secure random password for database
resource "random_password" "database" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

# Store password in SSM Parameter Store for secure access
resource "aws_ssm_parameter" "database_password" {
  name        = "/${var.name_prefix}/database/password"
  description = "Database password for ${var.name_prefix}"
  type        = "SecureString"
  value       = random_password.database.result
  key_id      = aws_kms_key.secrets.arn

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database-password-param"
    Type = "ssm-parameter"
  })
}

# Secrets Manager Secret for database credentials
resource "aws_secretsmanager_secret" "database" {
  name        = "${var.name_prefix}-database-credentials"
  description = "Database credentials for ${var.name_prefix}"
  kms_key_id  = aws_kms_key.secrets.arn

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database-secret"
    Type = "secret"
  })
}

# Secrets Manager Secret Version with generated password
resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username = var.database_username
    password = random_password.database.result
    engine   = "mysql"
    host     = var.database_host
    port     = 3306
    dbname   = var.database_name
  })
}

# IAM Policy for Secrets Manager and SSM access
resource "aws_iam_policy" "secrets_access" {
  name        = "${var.name_prefix}-secrets-access-policy"
  description = "Policy for accessing Secrets Manager and SSM"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.database.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = aws_ssm_parameter.database_password.arn
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-secrets-access-policy"
    Type = "iam-policy"
  })
}

# KMS Key for encryption
resource "aws_kms_key" "secrets" {
  description             = "KMS key for Secrets Manager and SSM encryption"
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
      },
      {
        Sid    = "Allow Secrets Manager to use the key"
        Effect = "Allow"
        Principal = {
          Service = "secretsmanager.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SSM to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ssm.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-secrets-kms-key"
    Type = "kms-key"
  })
}

# KMS Alias for easier key management
resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.name_prefix}-secrets"
  target_key_id = aws_kms_key.secrets.key_id
}

# Data sources for current account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

```

```hcl
output "database_secret_arn" {
  description = "ARN of the Secrets Manager secret for database credentials"
  value       = aws_secretsmanager_secret.database.arn
}

output "database_secret_name" {
  description = "Name of the Secrets Manager secret for database credentials"
  value       = aws_secretsmanager_secret.database.name
}

output "secrets_access_policy_arn" {
  description = "ARN of the IAM policy for accessing secrets"
  value       = aws_iam_policy.secrets_access.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.secrets.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.secrets.key_id
}

output "ssm_parameter_arn" {
  description = "ARN of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.arn
}

output "ssm_parameter_name" {
  description = "Name of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.name
}

output "database_password" {
  description = "The generated database password (sensitive)"
  value       = random_password.database.result
  sensitive   = true
}
```

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "database_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "database_host" {
  description = "Database host (will be set after RDS creation)"
  type        = string
  default     = ""
}

variable "database_name" {
  description = "Database name"
  type        = string
}

```

```hcl
# ACM Certificate for HTTPS/TLS
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-ssl-certificate"
    Type = "certificate"
  })
}

# Certificate validation
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Route53 records for certificate validation
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.route53_zone_id
}

# Application Load Balancer Listener with HTTPS
resource "aws_lb_listener" "https" {
  load_balancer_arn = var.load_balancer_arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = var.target_group_arn
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-https-listener"
    Type = "listener"
  })
}

# HTTP to HTTPS redirect
resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = var.load_balancer_arn
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

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-http-redirect-listener"
    Type = "listener"
  })
}

# Security Group for HTTPS
resource "aws_security_group_rule" "https_ingress" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = var.load_balancer_security_group_id
}

```

```hcl
output "certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.main.arn
}

output "certificate_domain_name" {
  description = "Domain name of the certificate"
  value       = aws_acm_certificate.main.domain_name
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener"
  value       = aws_lb_listener.https.arn
}

output "http_redirect_listener_arn" {
  description = "ARN of the HTTP redirect listener"
  value       = aws_lb_listener.http_redirect.arn
}

```

```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "domain_name" {
  description = "Domain name for the SSL certificate"
  type        = string
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for certificate validation"
  type        = string
}

variable "load_balancer_arn" {
  description = "ARN of the Application Load Balancer"
  type        = string
}

variable "target_group_arn" {
  description = "ARN of the target group"
  type        = string
}

variable "load_balancer_security_group_id" {
  description = "Security group ID of the load balancer"
  type        = string
}

```
