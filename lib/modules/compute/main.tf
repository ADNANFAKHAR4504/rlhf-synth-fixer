resource "aws_launch_configuration" "main" {
  name_prefix          = "${var.project_name}-"
  image_id             = var.ami_id
  instance_type        = var.instance_type
  security_groups      = [var.ec2_sg_id]
  iam_instance_profile = var.instance_profile_name
}

resource "aws_autoscaling_group" "main" {
  name                 = "${var.project_name}-asg"
  launch_configuration = aws_launch_configuration.main.id
  min_size             = 1
  max_size             = 3
  desired_capacity     = 2
  vpc_zone_identifier  = var.private_subnet_ids

  tag {
    key                 = "Name"
    value               = "${var.project_name}-instance"
    propagate_at_launch = true
  }
}

resource "aws_lb" "main" {
  name               = "${var.project_name}-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnet_ids
}

resource "aws_lb_target_group" "main" {
  name     = "${var.project_name}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id
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
