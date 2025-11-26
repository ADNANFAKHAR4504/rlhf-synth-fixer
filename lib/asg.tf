# User data script for EC2 instances
locals {
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent

    # Configure CloudWatch Agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'CWCONFIG'
    {
      "metrics": {
        "namespace": "LoanProcessing",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
              {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
            ],
            "totalcpu": false
          },
          "mem": {
            "measurement": [
              {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
            ]
          },
          "disk": {
            "measurement": [
              {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
            ],
            "resources": ["/"]
          }
        }
      }
    }
    CWCONFIG

    # Start CloudWatch Agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -s \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

    # Install application dependencies
    yum install -y docker
    systemctl start docker
    systemctl enable docker

    # Application setup would go here
    echo "Loan Processing Application - ${local.env_suffix}" > /var/www/html/index.html
  EOF
  )
}

# Launch Template for EC2 Instances
resource "aws_launch_template" "main" {
  name_prefix   = "loan-proc-lt-${local.env_suffix}-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_types[0]

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = local.user_data

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 30 # Match AMI snapshot size requirement
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"

    tags = merge(
      var.tags,
      {
        Name              = "loan-processing-instance-${local.env_suffix}"
        EnvironmentSuffix = local.env_suffix
      }
    )
  }

  tag_specifications {
    resource_type = "volume"

    tags = merge(
      var.tags,
      {
        Name              = "loan-processing-volume-${local.env_suffix}"
        EnvironmentSuffix = local.env_suffix
      }
    )
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name_prefix               = "loan-proc-asg-${local.env_suffix}-"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.app.arn, aws_lb_target_group.api.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_capacity
  max_size         = var.max_capacity
  desired_capacity = var.desired_capacity

  # Mixed instances policy with spot instances
  mixed_instances_policy {
    instances_distribution {
      on_demand_base_capacity                  = 1
      on_demand_percentage_above_base_capacity = 80
      spot_allocation_strategy                 = "capacity-optimized"
    }

    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.main.id
        version            = "$Latest"
      }

      dynamic "override" {
        for_each = var.instance_types
        content {
          instance_type = override.value
        }
      }
    }
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupPendingInstances",
    "GroupMinSize",
    "GroupMaxSize",
    "GroupTerminatingInstances",
    "GroupStandbyInstances"
  ]

  tag {
    key                 = "Name"
    value               = "loan-processing-asg-${local.env_suffix}"
    propagate_at_launch = false
  }

  tag {
    key                 = "EnvironmentSuffix"
    value               = local.env_suffix
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policy - CPU Based
resource "aws_autoscaling_policy" "cpu" {
  name                   = "loan-proc-cpu-policy-${local.env_suffix}"
  autoscaling_group_name = aws_autoscaling_group.main.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }

    target_value = 70.0
  }
}

# Auto Scaling Policy - Memory Based (using custom metric)
resource "aws_autoscaling_policy" "memory" {
  name                   = "loan-proc-memory-policy-${local.env_suffix}"
  autoscaling_group_name = aws_autoscaling_group.main.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    customized_metric_specification {
      metrics {
        id    = "m1"
        label = "Memory Usage"

        metric_stat {
          metric {
            namespace   = "LoanProcessing"
            metric_name = "MEM_USED"

            dimensions {
              name  = "AutoScalingGroupName"
              value = aws_autoscaling_group.main.name
            }
          }

          stat = "Average"
        }

        return_data = true
      }
    }

    target_value = 75.0
  }
}
