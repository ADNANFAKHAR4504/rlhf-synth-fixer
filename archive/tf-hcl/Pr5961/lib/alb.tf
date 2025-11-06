resource "aws_lb" "main" {
  name               = "alb-${var.environmentSuffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "alb-${var.environmentSuffix}"
  }
}

resource "aws_lb_target_group" "fraud_detection" {
  name        = "fraud-detection-tg-${var.environmentSuffix}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = {
    Name = "fraud-detection-tg-${var.environmentSuffix}"
  }
}

resource "aws_lb_target_group" "transaction_processor" {
  name        = "transaction-processor-tg-${var.environmentSuffix}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = {
    Name = "transaction-processor-tg-${var.environmentSuffix}"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.fraud_detection.arn
  }
}

resource "aws_lb_listener_rule" "fraud_detection" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.fraud_detection.arn
  }

  condition {
    path_pattern {
      values = ["/fraud-detection/*"]
    }
  }
}

resource "aws_lb_listener_rule" "transaction_processor" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.transaction_processor.arn
  }

  condition {
    path_pattern {
      values = ["/transaction-processor/*"]
    }
  }
}
