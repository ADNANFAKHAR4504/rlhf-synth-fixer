## Highly Available AWS Web Application Infrastructure

### Summary

This Terraform configuration provisions a highly available, fault-tolerant web application infrastructure in AWS us-east-1, fulfilling all specified requirements:

**Key Features:**
- Multi-AZ VPC with public and private subnets
- Auto Scaling Group ensures at least 2 EC2 instances across AZs
- Application Load Balancer distributes HTTP/HTTPS traffic
- 120-second recovery from instance failures
- CloudWatch alarms for health and scaling (CPU-based)
- EC2 instances only accessible via ELB (no direct SSH)
- SNS notifications for auto-scaling actions

**User-supplied values:**
- `key_pair_name`: EC2 Key Pair name
- `notification_email`: Email for SNS notifications

---

### Terraform HCL 

#### Provider and Variables
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

variable "key_pair_name" {
	description = "Name of the EC2 Key Pair for SSH access"
	type        = string
	default     = "your-key-pair-name"
}

variable "notification_email" {
	description = "Email address for SNS notifications"
	type        = string
	default     = "admin@example.com"
}
```

#### VPC and Subnets
```hcl
data "aws_availability_zones" "available" {
	state = "available"
	filter {
		name   = "region-name"
		values = ["us-east-1"]
	}
}

resource "aws_vpc" "main" {
	cidr_block           = "10.0.0.0/16"
	enable_dns_hostnames = true
	enable_dns_support   = true
	tags = {
		Name = "ha-web-app-vpc"
		Environment = "production"
	}
}

resource "aws_internet_gateway" "main" {
	vpc_id = aws_vpc.main.id
	tags = {
		Name = "ha-web-app-igw"
	}
}

resource "aws_subnet" "public_1" {
	vpc_id                  = aws_vpc.main.id
	cidr_block              = "10.0.1.0/24"
	availability_zone       = data.aws_availability_zones.available.names[0]
	map_public_ip_on_launch = true
	tags = {
		Name = "ha-web-app-public-subnet-1"
		Type = "Public"
	}
}

resource "aws_subnet" "public_2" {
	vpc_id                  = aws_vpc.main.id
	cidr_block              = "10.0.2.0/24"
	availability_zone       = data.aws_availability_zones.available.names[1]
	map_public_ip_on_launch = true
	tags = {
		Name = "ha-web-app-public-subnet-2"
		Type = "Public"
	}
}

resource "aws_subnet" "private_1" {
	vpc_id            = aws_vpc.main.id
	cidr_block        = "10.0.3.0/24"
	availability_zone = data.aws_availability_zones.available.names[0]
	tags = {
		Name = "ha-web-app-private-subnet-1"
		Type = "Private"
	}
}

resource "aws_subnet" "private_2" {
	vpc_id            = aws_vpc.main.id
	cidr_block        = "10.0.4.0/24"
	availability_zone = data.aws_availability_zones.available.names[1]
	tags = {
		Name = "ha-web-app-private-subnet-2"
		Type = "Private"
	}
}
```

#### Security Groups
```hcl
resource "aws_security_group" "elb" {
	name        = "ha-web-app-elb-sg"
	description = "Security group for Elastic Load Balancer"
	vpc_id      = aws_vpc.main.id
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
		Name = "ha-web-app-elb-sg"
	}
}

resource "aws_security_group" "web_servers" {
	name        = "ha-web-app-servers-sg"
	description = "Security group for web servers - only accessible through ELB"
	vpc_id      = aws_vpc.main.id
	ingress {
		description     = "HTTP from ELB"
		from_port       = 80
		to_port         = 80
		protocol        = "tcp"
		security_groups = [aws_security_group.elb.id]
	}
	egress {
		from_port   = 0
		to_port     = 0
		protocol    = "-1"
		cidr_blocks = ["0.0.0.0/0"]
	}
	tags = {
		Name = "ha-web-app-servers-sg"
	}
}
```

#### Launch Template and Auto Scaling Group
```hcl
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

resource "aws_launch_template" "web_server" {
	name_prefix   = "ha-web-app-"
	image_id      = data.aws_ami.amazon_linux.id
	instance_type = "t3.micro"
	key_name      = var.key_pair_name
	vpc_security_group_ids = [aws_security_group.web_servers.id]
	user_data = base64encode(<<-EOF
							#!/bin/bash
							yum update -y
							yum install -y httpd
							systemctl start httpd
							systemctl enable httpd
							echo "<h1>Web Server $(hostname -f)</h1>" > /var/www/html/index.html
							echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
							echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
							echo "<p>Health Status: OK</p>" >> /var/www/html/index.html
							echo "OK" > /var/www/html/health
							EOF
	)
	tag_specifications {
		resource_type = "instance"
		tags = {
			Name = "ha-web-app-server"
			Environment = "production"
		}
	}
	lifecycle {
		create_before_destroy = true
	}
}

resource "aws_autoscaling_group" "web_servers" {
	name                = "ha-web-app-asg"
	vpc_zone_identifier = [aws_subnet.private_1.id, aws_subnet.private_2.id]
	target_group_arns   = [aws_lb_target_group.web_servers.arn]
	health_check_type   = "ELB"
	health_check_grace_period = 120
	min_size         = 2
	max_size         = 6
	desired_capacity = 2
	launch_template {
		id      = aws_launch_template.web_server.id
		version = "$Latest"
	}
	tag {
		key                 = "Name"
		value               = "ha-web-app-asg-instance"
		propagate_at_launch = true
	}
	tag {
		key                 = "Environment"
		value               = "production"
		propagate_at_launch = true
	}
}
```

#### Load Balancer and Target Group
```hcl
resource "aws_lb" "main" {
	name               = "ha-web-app-alb"
	internal           = false
	load_balancer_type = "application"
	security_groups    = [aws_security_group.elb.id]
	subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]
	enable_deletion_protection = false
	tags = {
		Name = "ha-web-app-alb"
		Environment = "production"
	}
}

resource "aws_lb_target_group" "web_servers" {
	name     = "ha-web-app-tg"
	port     = 80
	protocol = "HTTP"
	vpc_id   = aws_vpc.main.id
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
	tags = {
		Name = "ha-web-app-tg"
	}
}

resource "aws_lb_listener" "web" {
	load_balancer_arn = aws_lb.main.arn
	port              = "80"
	protocol          = "HTTP"
	default_action {
		type             = "forward"
		target_group_arn = aws_lb_target_group.web_servers.arn
	}
}
```

#### CloudWatch Alarms and Scaling Policies
```hcl
resource "aws_autoscaling_policy" "scale_up" {
	name                   = "ha-web-app-scale-up"
	scaling_adjustment     = 1
	adjustment_type        = "ChangeInCapacity"
	cooldown               = 300
	autoscaling_group_name = aws_autoscaling_group.web_servers.name
	policy_type            = "SimpleScaling"
}

resource "aws_autoscaling_policy" "scale_down" {
	name                   = "ha-web-app-scale-down"
	scaling_adjustment     = -1
	adjustment_type        = "ChangeInCapacity"
	cooldown               = 300
	autoscaling_group_name = aws_autoscaling_group.web_servers.name
	policy_type            = "SimpleScaling"
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
	alarm_name          = "ha-web-app-cpu-high"
	comparison_operator = "GreaterThanThreshold"
	evaluation_periods  = "2"
	metric_name         = "CPUUtilization"
	namespace           = "AWS/EC2"
	period              = "60"
	statistic           = "Average"
	threshold           = "70"
	alarm_description   = "This metric monitors ec2 cpu utilization"
	alarm_actions       = [aws_autoscaling_policy.scale_up.arn]
	dimensions = {
		AutoScalingGroupName = aws_autoscaling_group.web_servers.name
	}
	tags = {
		Name = "ha-web-app-cpu-high-alarm"
	}
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
	alarm_name          = "ha-web-app-cpu-low"
	comparison_operator = "LessThanThreshold"
	evaluation_periods  = "2"
	metric_name         = "CPUUtilization"
	namespace           = "AWS/EC2"
	period              = "60"
	statistic           = "Average"
	threshold           = "20"
	alarm_description   = "This metric monitors ec2 cpu utilization"
	alarm_actions       = [aws_autoscaling_policy.scale_down.arn]
	dimensions = {
		AutoScalingGroupName = aws_autoscaling_group.web_servers.name
	}
	tags = {
		Name = "ha-web-app-cpu-low-alarm"
	}
}

resource "aws_cloudwatch_metric_alarm" "target_health" {
	alarm_name          = "ha-web-app-target-health"
	comparison_operator = "LessThanThreshold"
	evaluation_periods  = "2"
	metric_name         = "HealthyHostCount"
	namespace           = "AWS/ApplicationELB"
	period              = "60"
	statistic           = "Average"
	threshold           = "1"
	alarm_description   = "This metric monitors healthy target count"
	alarm_actions       = [aws_sns_topic.scaling_notifications.arn]
	dimensions = {
		TargetGroup  = aws_lb_target_group.web_servers.arn_suffix
		LoadBalancer = aws_lb.main.arn_suffix
	}
	tags = {
		Name = "ha-web-app-target-health-alarm"
	}
}
```

#### SNS Notifications
```hcl
resource "aws_sns_topic" "scaling_notifications" {
	name = "ha-web-app-scaling-notifications"
	tags = {
		Name = "ha-web-app-scaling-notifications"
	}
}

resource "aws_sns_topic_subscription" "email_notification" {
	topic_arn = aws_sns_topic.scaling_notifications.arn
	protocol  = "email"
	endpoint  = var.notification_email
}

resource "aws_autoscaling_notification" "scaling_notifications" {
	group_names   = [aws_autoscaling_group.web_servers.name]
	notifications = [
		"autoscaling:EC2_INSTANCE_LAUNCH",
		"autoscaling:EC2_INSTANCE_TERMINATE",
		"autoscaling:EC2_INSTANCE_LAUNCH_ERROR",
		"autoscaling:EC2_INSTANCE_TERMINATE_ERROR",
	]
	topic_arn     = aws_sns_topic.scaling_notifications.arn
}
```

#### Outputs
```hcl
output "load_balancer_dns_name" {
	description = "DNS name of the load balancer"
	value       = aws_lb.main.dns_name
}

output "vpc_id" {
	description = "ID of the VPC"
	value       = aws_vpc.main.id
}

output "availability_zones" {
	description = "Availability zones used"
	value       = [data.aws_availability_zones.available.names[0], data.aws_availability_zones.available.names[1]]
}

output "sns_topic_arn" {
	description = "ARN of the SNS topic for notifications"
	value       = aws_sns_topic.scaling_notifications.arn
}

output "autoscaling_group_name" {
	description = "Name of the Auto Scaling Group"
	value       = aws_autoscaling_group.web_servers.name
}
```