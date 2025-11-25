# Primary Launch Template
resource "aws_launch_template" "primary" {
  provider      = aws.primary
  name          = "lt-primary-${var.environment_suffix}"
  image_id      = var.ami_id_primary
  instance_type = var.instance_type
  key_name      = null # Set key name if SSH access required

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.primary_app.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker
              systemctl start docker
              systemctl enable docker

              # Install CloudWatch agent
              wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
              rpm -U ./amazon-cloudwatch-agent.rpm

              # Sample application (replace with actual application)
              docker run -d -p 8080:8080 --name app \
                -e DB_HOST=${aws_rds_cluster.primary.endpoint} \
                -e DB_NAME=${var.db_name} \
                -e AWS_REGION=${var.primary_region} \
                your-application-image:latest
              EOF
  )

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name    = "app-primary-${var.environment_suffix}"
      Region  = "primary"
      DR-Role = "primary"
    })
  }

  tags = merge(local.common_tags, {
    Name    = "lt-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Auto Scaling Group
resource "aws_autoscaling_group" "primary" {
  provider                  = aws.primary
  name                      = "asg-primary-${var.environment_suffix}"
  vpc_zone_identifier       = aws_subnet.primary_private[*].id
  target_group_arns         = [aws_lb_target_group.primary.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = 2
  max_size                  = 6
  desired_capacity          = 2

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupPendingInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "asg-primary-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment_suffix
    propagate_at_launch = true
  }

  tag {
    key                 = "Region"
    value               = "primary"
    propagate_at_launch = true
  }

  tag {
    key                 = "DR-Role"
    value               = "primary"
    propagate_at_launch = true
  }
}

# Primary Auto Scaling Policy - Target Tracking (CPU)
resource "aws_autoscaling_policy" "primary_cpu" {
  provider               = aws.primary
  name                   = "asg-policy-cpu-primary-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.primary.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
