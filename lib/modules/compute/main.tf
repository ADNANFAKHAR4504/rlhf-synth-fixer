data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_launch_template" "main" {
  name_prefix   = "lt-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.security_group_id]

  iam_instance_profile {
    name = var.instance_profile_name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region        = var.region
    environment   = var.environment
    unique_suffix = var.common_tags.UniqueSuffix
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "instance-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"
    })
  }

  lifecycle {
    create_before_destroy = true
    # Add lifecycle rule to handle tag inconsistencies
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_autoscaling_group" "main" {
  name                      = "asg-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"
  vpc_zone_identifier       = var.subnet_ids
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.main.id
        version            = "$Latest"
      }

      override {
        instance_type     = var.instance_type
        weighted_capacity = "1"
      }
    }

    instances_distribution {
      on_demand_base_capacity                  = 0
      on_demand_percentage_above_base_capacity = 0
      spot_allocation_strategy                 = "price-capacity-optimized"
      # Removed spot_instance_pools as it's only compatible with lowest-price strategy
    }
  }

  tag {
    key                 = "Name"
    value               = "asg-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = merge(var.common_tags, {
    Name = "alb-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-tg-${var.region}-${var.common_tags.UniqueSuffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

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

  tags = merge(var.common_tags, {
    Name = "${var.environment}-tg-${var.region}-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
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

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}
