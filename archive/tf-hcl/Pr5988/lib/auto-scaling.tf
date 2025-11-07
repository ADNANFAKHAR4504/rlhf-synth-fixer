data "aws_ami" "amazon_linux_2" {
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

resource "aws_iam_role" "instance" {
  name_prefix = "instance-role-${terraform.workspace}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name = "instance-role-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "instance" {
  name_prefix = "instance-profile-${terraform.workspace}-"
  role        = aws_iam_role.instance.name

  tags = merge(local.common_tags, {
    Name = "instance-profile-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_launch_template" "app" {
  name_prefix   = "app-lt-${terraform.workspace}-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = local.config.instance_type

  iam_instance_profile {
    arn = aws_iam_instance_profile.instance.arn
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app.id]
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker
              systemctl start docker
              systemctl enable docker
              docker run -d -p 8080:8080 --name app nginx
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "app-instance-${terraform.workspace}-${var.environment_suffix}"
    })
  }

  tags = merge(local.common_tags, {
    Name = "app-lt-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_autoscaling_group" "app" {
  name                = "asg-${terraform.workspace}-${var.environment_suffix}"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]

  desired_capacity = 2
  min_size         = 1
  max_size         = 4

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  health_check_type         = "ELB"
  health_check_grace_period = 300

  tag {
    key                 = "Name"
    value               = "asg-instance-${terraform.workspace}-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Workspace"
    value               = terraform.workspace
    propagate_at_launch = true
  }
}
