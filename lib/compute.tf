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
              exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
              echo "Starting user-data script at $(date)"
              
              # Update system
              yum update -y
              
              # Install packages
              yum install -y amazon-cloudwatch-agent httpd
              
              # Start and enable Apache
              systemctl start httpd
              systemctl enable httpd
              
              # Wait for Apache to start
              sleep 10
              
              # Create a simple index page
              echo "<html><body><h1>Hello from SecureTF Instance</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p><p>Started at: $(date)</p></body></html>" > /var/www/html/index.html
              
              # Ensure Apache is serving content
              systemctl status httpd
              curl -I http://localhost/
              
              # Configure CloudWatch agent (optional, may fail without config file)
              if [ -f /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json ]; then
                /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
              fi
              
              echo "User-data script completed at $(date)"
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

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                      = "${var.resource_prefix}-${var.environment_suffix}-asg"
  vpc_zone_identifier       = aws_subnet.public[*].id
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "EC2"
  health_check_grace_period = 600
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