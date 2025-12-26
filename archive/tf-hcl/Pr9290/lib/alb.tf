# Application Load Balancer
# LocalStack Community has limited ELBv2 support - ModifyLoadBalancerAttributes API fails
resource "aws_lb" "main" {
  count              = local.is_localstack ? 0 : 1
  name               = "${var.project_name}-${var.environment_suffix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  # Note: access_logs configuration removed for LocalStack compatibility
  # LocalStack Community doesn't support ALB access logs (health_check_logs.s3.enabled error)
  # For AWS deployments, configure access_logs in terraform.tfvars or via backend config

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-alb"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Target Group
# LocalStack Community has limited ELBv2 support
resource "aws_lb_target_group" "main" {
  count    = local.is_localstack ? 0 : 1
  name     = "${var.project_name}-${var.environment_suffix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

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

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-tg"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ALB Listener
# LocalStack Community has limited ELBv2 support
resource "aws_lb_listener" "main" {
  count             = local.is_localstack ? 0 : 1
  load_balancer_arn = aws_lb.main[0].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main[0].arn
  }
}