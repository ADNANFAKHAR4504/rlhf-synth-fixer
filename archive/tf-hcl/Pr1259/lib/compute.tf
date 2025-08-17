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
      volume_size           = 20
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
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
              yum install -y httpd amazon-cloudwatch-agent
              systemctl start httpd
              systemctl enable httpd
              echo "<html><body><h1>Hello from SecureTF</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p></body></html>" > /var/www/html/index.html
              # Configure CloudWatch agent if config exists
              if [ -f /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json ]; then
                /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
              fi
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
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-target-group"
  }
}

# Self-signed certificate for HTTPS
resource "tls_private_key" "main" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "main" {
  private_key_pem = tls_private_key.main.private_key_pem

  subject {
    common_name  = "securetf.local"
    organization = "SecureTF"
  }

  validity_period_hours = 8760 # 1 year

  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

resource "aws_acm_certificate" "main" {
  private_key      = tls_private_key.main.private_key_pem
  certificate_body = tls_self_signed_cert.main.cert_pem

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-cert"
  }
}

resource "aws_lb_listener" "main" {
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

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}