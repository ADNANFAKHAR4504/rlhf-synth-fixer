```hcl
# terraform/main.tf

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variables
variable "regions" {
  description = "List of AWS regions for deployment"
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "application_name" {
  description = "Name of the application"
  type        = string
  default     = "webapp"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
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

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  default     = "changeme123!"
  sensitive   = true
}

# Data sources
data "aws_availability_zones" "available" {
  for_each = toset(var.regions)
  provider = aws.region[each.key]
  state    = "available"
}

data "aws_ami" "amazon_linux" {
  for_each    = toset(var.regions)
  provider    = aws.region[each.key]
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Provider configuration for multiple regions
provider "aws" {
  alias  = "primary"
  region = var.regions[0]
}

provider "aws" {
  for_each = toset(var.regions)
  alias    = "region.${each.key}"
  region   = each.key
}

# VPC Configuration for each region
resource "aws_vpc" "main" {
  for_each             = toset(var.regions)
  provider             = aws.region[each.key]
  cidr_block           = each.key == var.regions[0] ? "10.0.0.0/16" : "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.application_name}-vpc-${each.key}"
    Environment = var.environment
    Region      = each.key
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  for_each = toset(var.regions)
  provider = aws.region[each.key]
  vpc_id   = aws_vpc.main[each.key].id

  tags = {
    Name        = "${var.application_name}-igw-${each.key}"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each = {
    for idx, region in var.regions : "${region}-${idx % 2}" => {
      region = region
      az_idx = idx % 2
      cidr   = region == var.regions[0] ? "10.0.${idx + 1}.0/24" : "10.1.${idx + 1}.0/24"
    }
  }
  
  provider                = aws.region[each.value.region]
  vpc_id                  = aws_vpc.main[each.value.region].id
  cidr_block              = each.value.cidr
  availability_zone       = data.aws_availability_zones.available[each.value.region].names[each.value.az_idx]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.application_name}-public-${each.value.region}-${each.value.az_idx + 1}"
    Environment = var.environment
    Type        = "Public"
  }
}

# Private Subnets for RDS
resource "aws_subnet" "private" {
  for_each = {
    for idx, region in var.regions : "${region}-${idx % 2}" => {
      region = region
      az_idx = idx % 2
      cidr   = region == var.regions[0] ? "10.0.${idx + 10}.0/24" : "10.1.${idx + 10}.0/24"
    }
  }
  
  provider          = aws.region[each.value.region]
  vpc_id            = aws_vpc.main[each.value.region].id
  cidr_block        = each.value.cidr
  availability_zone = data.aws_availability_zones.available[each.value.region].names[each.value.az_idx]

  tags = {
    Name        = "${var.application_name}-private-${each.value.region}-${each.value.az_idx + 1}"
    Environment = var.environment
    Type        = "Private"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  for_each = toset(var.regions)
  provider = aws.region[each.key]
  vpc_id   = aws_vpc.main[each.key].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[each.key].id
  }

  tags = {
    Name        = "${var.application_name}-public-rt-${each.key}"
    Environment = var.environment
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public
  provider = aws.region[split("-", each.key)[0]]
  
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public[split("-", each.key)[0]].id
}

# Security Groups
resource "aws_security_group" "alb" {
  for_each    = toset(var.regions)
  provider    = aws.region[each.key]
  name        = "${var.application_name}-alb-sg-${each.key}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main[each.key].id

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

  tags = {
    Name        = "${var.application_name}-alb-sg-${each.key}"
    Environment = var.environment
  }
}

resource "aws_security_group" "web" {
  for_each    = toset(var.regions)
  provider    = aws.region[each.key]
  name        = "${var.application_name}-web-sg-${each.key}"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main[each.key].id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb[each.key].id]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main[each.key].cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.application_name}-web-sg-${each.key}"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  for_each    = toset(var.regions)
  provider    = aws.region[each.key]
  name        = "${var.application_name}-rds-sg-${each.key}"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main[each.key].id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web[each.key].id]
  }

  tags = {
    Name        = "${var.application_name}-rds-sg-${each.key}"
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  for_each           = toset(var.regions)
  provider           = aws.region[each.key]
  name               = "${var.application_name}-alb-${replace(each.key, "-", "")}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb[each.key].id]
  subnets = [
    for subnet in aws_subnet.public : subnet.id
    if startswith(subnet.tags.Name, "${var.application_name}-public-${each.key}")
  ]

  enable_deletion_protection = false

  tags = {
    Name        = "${var.application_name}-alb-${each.key}"
    Environment = var.environment
  }
}

# Target Group
resource "aws_lb_target_group" "web" {
  for_each = toset(var.regions)
  provider = aws.region[each.key]
  name     = "${var.application_name}-tg-${replace(each.key, "-", "")}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main[each.key].id

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

  tags = {
    Name        = "${var.application_name}-tg-${each.key}"
    Environment = var.environment
  }
}

# Load Balancer Listener
resource "aws_lb_listener" "web" {
  for_each          = toset(var.regions)
  provider          = aws.region[each.key]
  load_balancer_arn = aws_lb.main[each.key].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web[each.key].arn
  }
}

# Launch Template
resource "aws_launch_template" "web" {
  for_each      = toset(var.regions)
  provider      = aws.region[each.key]
  name          = "${var.application_name}-lt-${each.key}"
  image_id      = data.aws_ami.amazon_linux[each.key].id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.web[each.key].id]

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region = each.key
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.application_name}-instance-${each.key}"
      Environment = var.environment
    }
  }

  tags = {
    Name        = "${var.application_name}-lt-${each.key}"
    Environment = var.environment
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  name                = "${var.application_name}-asg-${each.key}"
  vpc_zone_identifier = [
    for subnet in aws_subnet.public : subnet.id
    if startswith(subnet.tags.Name, "${var.application_name}-public-${each.key}")
  ]
  target_group_arns   = [aws_lb_target_group.web[each.key].arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.web[each.key].id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.application_name}-asg-${each.key}"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  for_each           = toset(var.regions)
  provider           = aws.region[each.key]
  name               = "${var.application_name}-scale-up-${each.key}"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.web[each.key].name
}

resource "aws_autoscaling_policy" "scale_down" {
  for_each           = toset(var.regions)
  provider           = aws.region[each.key]
  name               = "${var.application_name}-scale-down-${each.key}"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.web[each.key].name
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  alarm_name          = "${var.application_name}-cpu-high-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up[each.key].arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web[each.key].name
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  alarm_name          = "${var.application_name}-cpu-low-${each.key}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down[each.key].arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web[each.key].name
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  for_each = toset(var.regions)
  provider = aws.region[each.key]
  name     = "${var.application_name}-db-subnet-group-${replace(each.key, "-", "")}"
  subnet_ids = [
    for subnet in aws_subnet.private : subnet.id
    if startswith(subnet.tags.Name, "${var.application_name}-private-${each.key}")
  ]

  tags = {
    Name        = "${var.application_name}-db-subnet-group-${each.key}"
    Environment = var.environment
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  for_each = toset(var.regions)
  provider = aws.region[each.key]
  
  identifier     = "${var.application_name}-db-${replace(each.key, "-", "")}"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "webapp"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds[each.key].id]
  db_subnet_group_name   = aws_db_subnet_group.main[each.key].name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = {
    Name        = "${var.application_name}-db-${each.key}"
    Environment = var.environment
  }
}

# Route 53 Health Checks and Failover (Primary region setup)
resource "aws_route53_zone" "main" {
  provider = aws.primary
  name     = "${var.application_name}.example.com"

  tags = {
    Name        = "${var.application_name}-zone"
    Environment = var.environment
  }
}

resource "aws_route53_health_check" "main" {
  for_each                        = toset(var.regions)
  provider                        = aws.primary
  fqdn                            = aws_lb.main[each.key].dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = "5"
  request_interval                = "30"
  cloudwatch_logs_region          = var.regions[0]
  cloudwatch_alarm_region         = var.regions[0]
  insufficient_data_health_status = "Failure"

  tags = {
    Name        = "${var.application_name}-health-check-${each.key}"
    Environment = var.environment
  }
}

resource "aws_route53_record" "main" {
  for_each = toset(var.regions)
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = var.application_name
  type     = "A"

  set_identifier = each.key
  
  failover_routing_policy {
    type = each.key == var.regions[0] ? "PRIMARY" : "SECONDARY"
  }
  
  health_check_id = aws_route53_health_check.main[each.key].id

  alias {
    name                   = aws_lb.main[each.key].dns_name
    zone_id                = aws_lb.main[each.key].zone_id
    evaluate_target_health = true
  }
}

# Outputs
output "load_balancer_dns" {
  description = "DNS names of the load balancers"
  value = {
    for region in var.regions : region => aws_lb.main[region].dns_name
  }
}

output "route53_domain" {
  description = "Route53 domain name"
  value       = aws_route53_zone.main.name
}

output "rds_endpoints" {
  description = "RDS instance endpoints"
  value = {
    for region in var.regions : region => aws_db_instance.main[region].endpoint
  }
  sensitive = true
}

output "vpc_ids" {
  description = "VPC IDs for each region"
  value = {
    for region in var.regions : region => aws_vpc.main[region].id
  }
}
```
```bash
#!/bin/bash
# terraform/user_data.sh

yum update -y
yum install -y httpd

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple web page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Region Web App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .region { background: #f0f0f0; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Multi-Region Web Application</h1>
        <div class="region">
            <h2>Server Information</h2>
            <p><strong>Region:</strong> ${region}</p>
            <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            <p><strong>Timestamp:</strong> $(date)</p>
        </div>
        <div style="margin-top: 20px;">
            <h3>Health Check</h3>
            <p>Status: <span style="color: green;">✓ Healthy</span></p>
        </div>
    </div>
</body>
</html>
EOF

# Set proper permissions
chown apache:apache /var/www/html/index.html
chmod 644 /var/www/html/index.html

# Configure Apache to start on boot
systemctl enable httpd
```
```hcl
# terraform/terraform.tfvars

regions          = ["us-east-1", "us-west-2"]
environment      = "production"
application_name = "webapp"
instance_type    = "t3.micro"
min_size         = 2
max_size         = 10
desired_capacity = 2
db_instance_class = "db.t3.micro"
db_username      = "admin"
db_password      = "SecurePassword123!"
```