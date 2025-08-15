# Launch Template with encrypted EBS
resource "aws_launch_template" "main" {
  name_prefix   = "${var.resource_prefix}-${var.environment_suffix}-template"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [
    aws_security_group.web.id,
    aws_security_group.ssh.id
  ]

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type           = "gp3"
      volume_size           = 8
      encrypted             = false
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = var.enable_detailed_monitoring
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<html><body><h1>Hello from SecureTF</h1></body></html>" > /var/www/html/index.html
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.resource_prefix}-${var.environment_suffix}-instance"
    }
  }

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-launch-template"
  }
}

# Random suffix for ASG to avoid naming conflicts
resource "random_string" "asg_suffix" {
  length  = 8
  lower   = true
  upper   = false
  numeric = true
  special = false
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                      = "${var.resource_prefix}-${var.environment_suffix}-asg-${random_string.asg_suffix.result}"
  vpc_zone_identifier       = aws_subnet.public[*].id
  health_check_type         = "EC2"
  health_check_grace_period = 300
  wait_for_capacity_timeout = "15m"
  min_size                  = 1
  max_size                  = 3
  desired_capacity          = 1

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  timeouts {
    update = "20m"
  }

  tag {
    key                 = "Name"
    value               = "${var.resource_prefix}-${var.environment_suffix}-asg"
    propagate_at_launch = false
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Attach target group after ASG is healthy
resource "aws_autoscaling_attachment" "main" {
  autoscaling_group_name = aws_autoscaling_group.main.id
  lb_target_group_arn    = aws_lb_target_group.main.arn

  depends_on = [aws_autoscaling_group.main]
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.resource_prefix}-${var.environment_suffix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-alb"
  }
}

resource "aws_lb_target_group" "main" {
  name     = "${var.resource_prefix}-${var.environment_suffix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 15
    interval            = 90
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-target-group"
  }
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}