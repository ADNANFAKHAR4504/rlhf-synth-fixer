# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_primary" {
  provider    = aws.primary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Primary Region ALB
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "alb-primary-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "alb-primary-${var.environment_suffix}"
  }
}

resource "aws_lb_target_group" "primary" {
  provider = aws.primary
  name     = "tg-primary-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

  health_check {
    enabled             = true
    path                = var.health_check_path
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "tg-primary-${var.environment_suffix}"
  }
}

resource "aws_lb_listener" "primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}

# Secondary Region ALB
resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "alb-secondary-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "alb-secondary-${var.environment_suffix}"
  }
}

resource "aws_lb_target_group" "secondary" {
  provider = aws.secondary
  name     = "tg-secondary-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

  health_check {
    enabled             = true
    path                = var.health_check_path
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "tg-secondary-${var.environment_suffix}"
  }
}

resource "aws_lb_listener" "secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }
}

# Launch Template Primary
resource "aws_launch_template" "primary" {
  provider      = aws.primary
  name          = "lt-primary-${var.environment_suffix}"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.primary_instances.id]

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    region = var.primary_region
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "instance-primary-${var.environment_suffix}"
    }
  }
}

# Launch Template Secondary
resource "aws_launch_template" "secondary" {
  provider      = aws.secondary
  name          = "lt-secondary-${var.environment_suffix}"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.secondary_instances.id]

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    region = var.secondary_region
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "instance-secondary-${var.environment_suffix}"
    }
  }
}

# Auto Scaling Group Primary
resource "aws_autoscaling_group" "primary" {
  provider            = aws.primary
  name                = "asg-primary-${var.environment_suffix}"
  vpc_zone_identifier = aws_subnet.primary_public[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  min_size            = 2
  max_size            = 6
  desired_capacity    = 2

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-primary-${var.environment_suffix}"
    propagate_at_launch = true
  }
}

# Auto Scaling Group Secondary
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.secondary
  name                = "asg-secondary-${var.environment_suffix}"
  vpc_zone_identifier = aws_subnet.secondary_public[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  min_size            = 2
  max_size            = 6
  desired_capacity    = 2

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-secondary-${var.environment_suffix}"
    propagate_at_launch = true
  }
}
