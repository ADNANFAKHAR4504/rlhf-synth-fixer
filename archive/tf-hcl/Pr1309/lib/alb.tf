# Application Load Balancer - Primary Region
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = substr("${local.resource_prefix}-p-alb", 0, 32)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection       = false
  enable_cross_zone_load_balancing = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-alb"
  })
}

# Application Load Balancer - Secondary Region
resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = substr("${local.resource_prefix}-s-alb", 0, 32)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection       = false
  enable_cross_zone_load_balancing = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-alb"
  })
}

# Target Group - Primary Region
resource "aws_lb_target_group" "primary" {
  provider = aws.primary
  name     = substr("${local.resource_prefix}-p-tg", 0, 32)
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-tg"
  })
}

# Target Group - Secondary Region
resource "aws_lb_target_group" "secondary" {
  provider = aws.secondary
  name     = substr("${local.resource_prefix}-s-tg", 0, 32)
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-tg"
  })
}

# Listener - Primary Region
resource "aws_lb_listener" "primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-listener"
  })
}

# Listener - Secondary Region
resource "aws_lb_listener" "secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-listener"
  })
}