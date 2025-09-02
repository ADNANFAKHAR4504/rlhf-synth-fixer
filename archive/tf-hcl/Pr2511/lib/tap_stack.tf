# tap_stack.tf - Multi-Region High Availability Infrastructure


# Variables Section
variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "instance_type" {
  description = "EC2 instance type for web servers"
  type        = string
  default     = "t3.medium"
}


variable "min_capacity" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 3
}

variable "max_capacity" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "test-ha-app.com"
}

variable "key_pair_name" {
  description = "EC2 Key Pair name for instances"
  type        = string
  default     = ""
}

variable "resource_suffix" {
  description = "Random suffix for resource names to avoid conflicts"
  type        = string
  default     = ""
}

# Locals Section
locals {
  regions = {
    primary   = "us-east-1"
    secondary = "us-west-2"
  }

  availability_zones = {
    "us-east-1" = ["us-east-1a", "us-east-1b", "us-east-1c"]
    "us-west-2" = ["us-west-2a", "us-west-2b", "us-west-2c"]
  }

  # Generate random suffix if not provided
  resource_suffix = var.resource_suffix != "" ? var.resource_suffix : random_id.suffix.hex

  common_tags = {
    Environment = var.environment
    Project     = "MultiRegion-HA"
    ManagedBy   = "Terraform"
  }
}



# Random ID for resource naming
resource "random_id" "suffix" {
  byte_length = 4
}

# Data Sources
data "aws_ami" "amazon_linux" {
  provider    = aws.primary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_west" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.primary
  name     = var.domain_name

  tags = merge(local.common_tags, {
    Name = "${var.environment}-hosted-zone-${local.resource_suffix}"
  })
}



# SSL Certificate for Primary Region - DISABLED
# resource "aws_acm_certificate" "primary" {
#   provider          = aws.primary
#   domain_name       = var.domain_name
#   validation_method = "DNS"
#
#   subject_alternative_names = [
#     "*.${var.domain_name}"
#   ]
#
#   lifecycle {
#     create_before_destroy = true
#   }
#
#   tags = merge(local.common_tags, {
#     Name = "${var.environment}-cert-primary-${local.resource_suffix}"
#   })
#
#   depends_on = [aws_route53_zone.main]
# }
#
# ACM Certificate Validation - Primary Region
# resource "aws_route53_record" "cert_validation_primary" {
#   provider = aws.primary
#   for_each = {
#     for dvo in aws_acm_certificate.primary.domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       record = dvo.resource_record_value
#       type   = dvo.resource_record_type
#     }
#   }
#
#   allow_overwrite = true
#   name            = each.value.name
#   records         = [each.value.record]
#   ttl             = 60
#   type            = each.value.type
#   zone_id         = aws_route53_zone.main.zone_id
# }
#
# resource "aws_acm_certificate_validation" "primary" {
#   provider                = aws.primary
#   certificate_arn         = aws_acm_certificate.primary.arn
#   validation_record_fqdns = [for record in aws_route53_record.cert_validation_primary : record.fqdn]
#
#   timeouts {
#     create = "2h"
#   }
# }

# SSL Certificate for Secondary Region - DISABLED
# resource "aws_acm_certificate" "secondary" {
#   provider          = aws.secondary
#   domain_name       = var.domain_name
#   validation_method = "DNS"
#
#   subject_alternative_names = [
#     "*.${var.domain_name}"
#   ]
#
#   lifecycle {
#     create_before_destroy = true
#   }
#
#   tags = merge(local.common_tags, {
#     Name = "${var.environment}-cert-secondary-${local.resource_suffix}"
#   })
#
#   depends_on = [aws_route53_zone.main]
# }
#
# ACM Certificate Validation - Secondary Region
# resource "aws_route53_record" "cert_validation_secondary" {
#   provider = aws.primary
#   for_each = {
#     for dvo in aws_acm_certificate.secondary.domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       record = dvo.resource_record_value
#       type   = dvo.resource_record_type
#     }
#   }
#
#   allow_overwrite = true
#   name            = each.value.name
#   records         = [each.value.record]
#   ttl             = 60
#   type            = each.value.type
#   zone_id         = aws_route53_zone.main.zone_id
# }
#
# resource "aws_acm_certificate_validation" "secondary" {
#   provider                = aws.secondary
#   certificate_arn         = aws_acm_certificate.secondary.arn
#   validation_record_fqdns = [for record in aws_route53_record.cert_validation_secondary : record.fqdn]
#
#   timeouts {
#     create = "2h"
#   }
# }


# PRIMARY REGION INFRASTRUCTURE (us-east-1)

# VPC - Primary Region
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-vpc-primary-${local.resource_suffix}"
  })
}

# Internet Gateway - Primary
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-igw-primary"
  })
}

# Public Subnets - Primary Region
resource "aws_subnet" "public_primary" {
  provider                = aws.primary
  count                   = 3
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = local.availability_zones["us-east-1"][count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-public-subnet-primary-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets - Primary Region
resource "aws_subnet" "private_primary" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = local.availability_zones["us-east-1"][count.index]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-private-subnet-primary-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateways - Primary Region
resource "aws_eip" "nat_primary" {
  provider = aws.primary
  count    = 1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-nat-eip-primary-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  count         = 1
  allocation_id = aws_eip.nat_primary[count.index].id
  subnet_id     = aws_subnet.public_primary[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-nat-gateway-primary-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Route Tables - Primary Region
resource "aws_route_table" "public_primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-public-rt-primary"
  })
}

resource "aws_route_table" "private_primary" {
  provider = aws.primary
  count    = 3
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[0].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-private-rt-primary-${count.index + 1}"
  })
}

# Route Table Associations - Primary Region
resource "aws_route_table_association" "public_primary" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.public_primary[count.index].id
  route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "private_primary" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.private_primary[count.index].id
  route_table_id = aws_route_table.private_primary[count.index].id
}

# Security Groups - Primary Region
resource "aws_security_group" "alb_primary" {
  provider    = aws.primary
  name        = "${var.environment}-alb-sg-primary"
  description = "Security group for ALB in primary region"
  vpc_id      = aws_vpc.primary.id

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
    Name = "${var.environment}-alb-sg-primary"
  })
}

resource "aws_security_group" "web_primary" {
  provider    = aws.primary
  name        = "${var.environment}-web-sg-primary"
  description = "Security group for web servers in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_primary.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-web-sg-primary"
  })
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2_role" {
  provider = aws.primary
  name     = "${var.environment}-ec2-role-${local.resource_suffix}"

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

resource "aws_iam_role_policy" "ec2_policy" {
  provider = aws.primary
  name     = "${var.environment}-ec2-policy-${local.resource_suffix}"
  role     = aws_iam_role.ec2_role.id

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
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  provider = aws.primary
  name     = "${var.environment}-ec2-profile-${local.resource_suffix}"
  role     = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# Launch Template - Primary Region
resource "aws_launch_template" "primary" {
  provider      = aws.primary
  name          = "${var.environment}-lt-primary-${local.resource_suffix}"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.key_pair_name != "" ? var.key_pair_name : null

  vpc_security_group_ids = [aws_security_group.web_primary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    
    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent
    
    # Create a simple web page
    cat > /var/www/html/index.html << 'HTML'
    <!DOCTYPE html>
    <html>
    <head>
        <title>Multi-Region HA App - Primary</title>
    </head>
    <body>
        <h1>Welcome to Multi-Region HA Application</h1>
        <h2>Primary Region: us-east-1</h2>
        <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
        <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
        <p>Timestamp: $(date)</p>
    </body>
    </html>
HTML
    
    # Health check endpoint
    cat > /var/www/html/health << 'HEALTH'
    OK
HEALTH
    
    # Configure CloudWatch monitoring
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${var.environment}-web-instance-primary"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-launch-template-primary-${local.resource_suffix}"
  })
}

# Application Load Balancer - Primary Region
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "prod-alb-p-${local.resource_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_primary.id]
  subnets            = aws_subnet.public_primary[*].id

  enable_deletion_protection       = false
  enable_cross_zone_load_balancing = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-alb-primary-${local.resource_suffix}"
  })
}

# Target Group - Primary Region
resource "aws_lb_target_group" "primary" {
  provider = aws.primary
  name     = "${var.environment}-tg-primary-${local.resource_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-target-group-primary-${local.resource_suffix}"
  })
}

# ALB Listeners - Primary Region
resource "aws_lb_listener" "primary_http" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}

# HTTPS listener disabled due to ACM certificate issues
# resource "aws_lb_listener" "primary_https" {
#   provider          = aws.primary
#   load_balancer_arn = aws_lb.primary.arn
#   port              = "443"
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
#   certificate_arn   = aws_acm_certificate_validation.primary.certificate_arn
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.primary.arn
#   }
# }

# Auto Scaling Group - Primary Region
resource "aws_autoscaling_group" "primary" {
  provider                  = aws.primary
  name                      = "${var.environment}-asg-primary-${local.resource_suffix}"
  vpc_zone_identifier       = aws_subnet.private_primary[*].id
  target_group_arns         = [aws_lb_target_group.primary.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_capacity
  max_size         = var.max_capacity
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-asg-primary-${local.resource_suffix}"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }
}

# Auto Scaling Policies - Primary Region
resource "aws_autoscaling_policy" "scale_up_primary" {
  provider               = aws.primary
  name                   = "${var.environment}-scale-up-primary"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

resource "aws_autoscaling_policy" "scale_down_primary" {
  provider               = aws.primary
  name                   = "${var.environment}-scale-down-primary"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# CloudWatch Alarms - Primary Region
resource "aws_cloudwatch_metric_alarm" "cpu_high_primary" {
  provider            = aws.primary
  alarm_name          = "${var.environment}-cpu-high-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up_primary.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low_primary" {
  provider            = aws.primary
  alarm_name          = "${var.environment}-cpu-low-primary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down_primary.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

# SECONDARY REGION INFRASTRUCTURE (us-west-2)

# VPC - Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-vpc-secondary-${local.resource_suffix}"
  })
}

# Internet Gateway - Secondary
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-igw-secondary"
  })
}

# Public Subnets - Secondary Region
resource "aws_subnet" "public_secondary" {
  provider                = aws.secondary
  count                   = 3
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = local.availability_zones["us-west-2"][count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-public-subnet-secondary-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets - Secondary Region
resource "aws_subnet" "private_secondary" {
  provider          = aws.secondary
  count             = 3
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.${count.index + 10}.0/24"
  availability_zone = local.availability_zones["us-west-2"][count.index]

  tags = merge(local.common_tags, {
    Name = "${var.environment}-private-subnet-secondary-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateways - Secondary Region
resource "aws_eip" "nat_secondary" {
  provider = aws.secondary
  count    = 1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-nat-eip-secondary-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  count         = 1
  allocation_id = aws_eip.nat_secondary[count.index].id
  subnet_id     = aws_subnet.public_secondary[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-nat-gateway-secondary-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Route Tables - Secondary Region
resource "aws_route_table" "public_secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-public-rt-secondary"
  })
}

resource "aws_route_table" "private_secondary" {
  provider = aws.secondary
  count    = 3
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[0].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-private-rt-secondary-${count.index + 1}"
  })
}

# Route Table Associations - Secondary Region
resource "aws_route_table_association" "public_secondary" {
  provider       = aws.secondary
  count          = 3
  subnet_id      = aws_subnet.public_secondary[count.index].id
  route_table_id = aws_route_table.public_secondary.id
}

resource "aws_route_table_association" "private_secondary" {
  provider       = aws.secondary
  count          = 3
  subnet_id      = aws_subnet.private_secondary[count.index].id
  route_table_id = aws_route_table.private_secondary[count.index].id
}

# Security Groups - Secondary Region
resource "aws_security_group" "alb_secondary" {
  provider    = aws.secondary
  name        = "${var.environment}-alb-sg-secondary"
  description = "Security group for ALB in secondary region"
  vpc_id      = aws_vpc.secondary.id

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
    Name = "${var.environment}-alb-sg-secondary"
  })
}

resource "aws_security_group" "web_secondary" {
  provider    = aws.secondary
  name        = "${var.environment}-web-sg-secondary"
  description = "Security group for web servers in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_secondary.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-web-sg-secondary"
  })
}

# IAM Role for EC2 Instances - Secondary Region
resource "aws_iam_role" "ec2_role_secondary" {
  provider = aws.secondary
  name     = "${var.environment}-ec2-role-secondary-${local.resource_suffix}"

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

resource "aws_iam_role_policy" "ec2_policy_secondary" {
  provider = aws.secondary
  name     = "${var.environment}-ec2-policy-secondary-${local.resource_suffix}"
  role     = aws_iam_role.ec2_role_secondary.id

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
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile_secondary" {
  provider = aws.secondary
  name     = "${var.environment}-ec2-profile-secondary-${local.resource_suffix}"
  role     = aws_iam_role.ec2_role_secondary.name

  tags = local.common_tags
}

# Launch Template - Secondary Region
resource "aws_launch_template" "secondary" {
  provider      = aws.secondary
  name          = "${var.environment}-lt-secondary-${local.resource_suffix}"
  image_id      = data.aws_ami.amazon_linux_west.id
  instance_type = var.instance_type
  key_name      = var.key_pair_name != "" ? var.key_pair_name : null

  vpc_security_group_ids = [aws_security_group.web_secondary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile_secondary.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    
    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent
    
    # Create a simple web page
    cat > /var/www/html/index.html << 'HTML'
    <!DOCTYPE html>
    <html>
    <head>
        <title>Multi-Region HA App - Secondary</title>
    </head>
    <body>
        <h1>Welcome to Multi-Region HA Application</h1>
        <h2>Secondary Region: us-west-2</h2>
        <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
        <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
        <p>Timestamp: $(date)</p>
    </body>
    </html>
HTML
    
    # Health check endpoint
    cat > /var/www/html/health << 'HEALTH'
    OK
HEALTH
    
    # Configure CloudWatch monitoring
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${var.environment}-web-instance-secondary"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-launch-template-secondary-${local.resource_suffix}"
  })
}

# Application Load Balancer - Secondary Region
resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "prod-alb-s-${local.resource_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_secondary.id]
  subnets            = aws_subnet.public_secondary[*].id

  enable_deletion_protection       = false
  enable_cross_zone_load_balancing = true

  tags = merge(local.common_tags, {
    Name = "${var.environment}-alb-secondary-${local.resource_suffix}"
  })
}

# Target Group - Secondary Region
resource "aws_lb_target_group" "secondary" {
  provider = aws.secondary
  name     = "${var.environment}-tg-secondary-${local.resource_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-target-group-secondary-${local.resource_suffix}"
  })
}

# ALB Listeners - Secondary Region
resource "aws_lb_listener" "secondary_http" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }
}

# HTTPS listener disabled due to ACM certificate issues
# resource "aws_lb_listener" "secondary_https" {
#   provider          = aws.secondary
#   load_balancer_arn = aws_lb.secondary.arn
#   port              = "443"
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
#   certificate_arn   = aws_acm_certificate_validation.secondary.certificate_arn
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.secondary.arn
#   }
# }

# Auto Scaling Group - Secondary Region
resource "aws_autoscaling_group" "secondary" {
  provider                  = aws.secondary
  name                      = "${var.environment}-asg-secondary-${local.resource_suffix}"
  vpc_zone_identifier       = aws_subnet.private_secondary[*].id
  target_group_arns         = [aws_lb_target_group.secondary.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_capacity
  max_size         = var.max_capacity
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-asg-secondary-${local.resource_suffix}"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }
}

# Auto Scaling Policies - Secondary Region
resource "aws_autoscaling_policy" "scale_up_secondary" {
  provider               = aws.secondary
  name                   = "${var.environment}-scale-up-secondary"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

resource "aws_autoscaling_policy" "scale_down_secondary" {
  provider               = aws.secondary
  name                   = "${var.environment}-scale-down-secondary"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# CloudWatch Alarms - Secondary Region
resource "aws_cloudwatch_metric_alarm" "cpu_high_secondary" {
  provider            = aws.secondary
  alarm_name          = "${var.environment}-cpu-high-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up_secondary.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low_secondary" {
  provider            = aws.secondary
  alarm_name          = "${var.environment}-cpu-low-secondary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down_secondary.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

# ROUTE 53 FAILOVER CONFIGURATION

# Route 53 Health Checks
resource "aws_route53_health_check" "primary" {
  provider          = aws.primary
  fqdn              = aws_lb.primary.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-health-check-primary"
  })
}

resource "aws_route53_health_check" "secondary" {
  provider          = aws.secondary
  fqdn              = aws_lb.secondary.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-health-check-secondary"
  })
}

# Route 53 Records with Failover
resource "aws_route53_record" "primary" {
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "app.${var.domain_name}"
  type     = "A"

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "secondary" {
  provider = aws.secondary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "app.${var.domain_name}"
  type     = "A"

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id
}

# MONITORING AND LOGGING

# SNS Topic for Notifications - Primary Region
resource "aws_sns_topic" "alerts" {
  provider = aws.primary
  name     = "${var.environment}-alerts"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-sns-topic"
  })
}

# SNS Topic for Notifications - Secondary Region
resource "aws_sns_topic" "alerts_secondary" {
  provider = aws.secondary
  name     = "${var.environment}-alerts-secondary"

  tags = merge(local.common_tags, {
    Name = "${var.environment}-sns-topic-secondary"
  })
}

# CloudWatch Alarm for ASG Health
resource "aws_cloudwatch_metric_alarm" "asg_health_primary" {
  provider            = aws.primary
  alarm_name          = "${var.environment}-asg-health-primary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ASG health in primary region"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.primary.arn_suffix
    LoadBalancer = aws_lb.primary.arn_suffix
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "asg_health_secondary" {
  provider            = aws.secondary
  alarm_name          = "${var.environment}-asg-health-secondary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ASG health in secondary region"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.secondary.arn_suffix
    LoadBalancer = aws_lb.secondary.arn_suffix
  }

  tags = local.common_tags
}

# VPC Flow Logs
resource "aws_flow_log" "primary" {
  provider        = aws.primary
  iam_role_arn    = aws_iam_role.vpc_flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs_primary.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-flow-log-primary"
  })
}

resource "aws_flow_log" "secondary" {
  provider        = aws.secondary
  iam_role_arn    = aws_iam_role.vpc_flow_log_role_secondary.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs_secondary.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${var.environment}-flow-log-secondary"
  })
}

# CloudWatch Log Groups for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs_primary" {
  provider          = aws.primary
  name              = "/aws/vpc/flowlogs/${var.environment}-primary-${local.resource_suffix}"
  retention_in_days = 365

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_secondary" {
  provider          = aws.secondary
  name              = "/aws/vpc/flowlogs/${var.environment}-secondary-${local.resource_suffix}"
  retention_in_days = 365

  tags = local.common_tags
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_log_role" {
  provider = aws.primary
  name     = "${var.environment}-vpc-flow-log-role-${local.resource_suffix}"

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

  tags = local.common_tags
}

resource "aws_iam_role" "vpc_flow_log_role_secondary" {
  provider = aws.secondary
  name     = "${var.environment}-vpc-flow-log-role-secondary-${local.resource_suffix}"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "vpc_flow_log_policy" {
  provider = aws.primary
  name     = "${var.environment}-vpc-flow-log-policy-${local.resource_suffix}"
  role     = aws_iam_role.vpc_flow_log_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "vpc_flow_log_policy_secondary" {
  provider = aws.secondary
  name     = "${var.environment}-vpc-flow-log-policy-secondary-${local.resource_suffix}"
  role     = aws_iam_role.vpc_flow_log_role_secondary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# OUTPUTS

output "primary_alb_dns_name" {
  description = "DNS name of the primary ALB"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary ALB"
  value       = aws_lb.secondary.dns_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "primary_asg_name" {
  description = "Name of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.name
}

output "secondary_asg_name" {
  description = "Name of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.name
}

output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_arn_secondary" {
  description = "ARN of the secondary SNS topic for alerts"
  value       = aws_sns_topic.alerts_secondary.arn
}

output "app_domain_name" {
  description = "Application domain name"
  value       = "app.${var.domain_name}"
}

output "primary_region" {
  description = "Primary AWS region"
  value       = local.regions.primary
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = local.regions.secondary
}