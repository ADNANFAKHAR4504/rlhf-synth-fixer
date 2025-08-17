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

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

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
