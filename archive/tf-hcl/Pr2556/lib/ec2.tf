# EC2 infrastructure with Auto Scaling Group in private subnets
# Implements security best practices: no public IPs, SSM access only, IMDSv2

# Get latest Amazon Linux 2 AMI
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

# Launch template for EC2 instances with security hardening
resource "aws_launch_template" "app_servers" {
  name_prefix   = "${var.project_name}-${var.environment}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  # Security: Disable IMDSv1, require IMDSv2 only
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # Security: No public IP assignment
  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app_instances.id]
    delete_on_termination       = true
  }

  # IAM instance profile for SSM access
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_instance.name
  }

  # Enable detailed monitoring for better observability
  monitoring {
    enabled = true
  }

  # User data script for basic configuration
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent
    
    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent
    
    # Basic application setup (replace with your application)
    yum install -y httpd
    systemctl enable httpd
    systemctl start httpd
    
    # Configure httpd to listen on port 8080
    sed -i 's/Listen 80/Listen 8080/' /etc/httpd/conf/httpd.conf
    systemctl restart httpd
    
    # Create a simple health check page
    echo "<html><body><h1>Application Server Ready</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p></body></html>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-${var.environment}-app-server"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group for high availability and automatic scaling
resource "aws_autoscaling_group" "app_servers" {
  name                      = "${var.project_name}-${var.environment}-asg"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.app_servers.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.app_servers.id
    version = "$Latest"
  }

  # Ensure instances are distributed across AZs
  availability_zones = data.aws_availability_zones.available.names

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-asg"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  # Lifecycle hook for graceful shutdowns
  initial_lifecycle_hook {
    name                 = "instance-terminating"
    default_result       = "ABANDON"
    heartbeat_timeout    = 300
    lifecycle_transition = "autoscaling:EC2_INSTANCE_TERMINATING"
  }
}

# Application Load Balancer for distributing traffic
resource "aws_lb" "app_lb" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false # Set to true for production

  # Access logs to S3
  access_logs {
    bucket  = aws_s3_bucket.logging.id
    prefix  = "alb-access-logs"
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb"
  }
}

# Target group for application servers
resource "aws_lb_target_group" "app_servers" {
  name     = "${var.project_name}-${var.environment}-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

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
    Name = "${var.project_name}-${var.environment}-tg"
  }
}

# ALB Listener for HTTPS traffic
resource "aws_lb_listener" "app_https" {
  load_balancer_arn = aws_lb.app_lb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.app_cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_servers.arn
  }
}

# ALB Listener for HTTP traffic (redirect to HTTPS)
resource "aws_lb_listener" "app_http" {
  load_balancer_arn = aws_lb.app_lb.arn
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

# Self-signed certificate for ALB (replace with real certificate in production)
resource "aws_acm_certificate" "app_cert" {
  domain_name       = "app.${var.project_name}.local"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.project_name}.local"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cert"
  }
}
