// Module: compute
// Contains security groups, launch template, auto scaling group

resource "aws_security_group" "ec2" {
  name   = "${var.project_name}-${var.environment_suffix}-ec2-sg"
  vpc_id = var.vpc_id
  tags   = merge(var.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-ec2-sg" })

  dynamic "ingress" {
    for_each = length(var.allowed_ssh_cidrs) > 0 ? [1] : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.allowed_ssh_cidrs
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_launch_template" "main" {
  name          = "${var.project_name}-${var.environment_suffix}-lt"
  image_id      = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  iam_instance_profile {
    name = var.ec2_instance_profile_name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -euxo pipefail
    dnf -y update || true
    # AL2023 includes SSM agent; ensure it is enabled and running
    systemctl enable --now amazon-ssm-agent || true
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags          = merge(var.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-instance" })
  }

  tags = var.common_tags
}

resource "aws_autoscaling_group" "main" {
  name                      = "${var.project_name}-${var.environment_suffix}-asg"
  vpc_zone_identifier       = var.private_subnet_ids
  target_group_arns         = []
  health_check_type         = "EC2"
  health_check_grace_period = 600

  wait_for_capacity_timeout = "0"

  min_size         = 1
  max_size         = 2
  desired_capacity = 1

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment_suffix}-asg"
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
}
