data "aws_ami" "amazon_linux2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

resource "aws_launch_template" "main" {
  name_prefix   = "${var.environment_tag}-lt-${random_id.deployment.hex}-"
  image_id      = data.aws_ami.amazon_linux2.id
  instance_type = "t3.micro"
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app.id]
    delete_on_termination       = true
    device_index                = 0
  }
  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Secure Application - ${var.environment_tag}</h1>" > /var/www/html/index.html
              echo "<p>Deployment ID: ${random_id.deployment.hex}</p>" >> /var/www/html/index.html
              EOF
  )
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.environment_tag}-instance-${random_id.deployment.hex}"
      Environment = var.environment_tag
    }
  }
  tags = {
    Name        = "${var.environment_tag}-launch-template-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

resource "aws_autoscaling_group" "main" {
  name                = "${var.environment_tag}-asg-${random_id.deployment.hex}"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  min_size            = 1
  max_size            = 3
  desired_capacity    = 2
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  tag {
    key                 = "Name"
    value               = "${var.environment_tag}-asg-instance-${random_id.deployment.hex}"
    propagate_at_launch = true
  }
  tag {
    key                 = "Environment"
    value               = var.environment_tag
    propagate_at_launch = true
  }
}