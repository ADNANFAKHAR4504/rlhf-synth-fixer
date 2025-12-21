# compute.tf
# EC2 instances, launch templates, and auto-scaling groups

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# Launch template for EC2 instances with security hardening
resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-app-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.ec2_sg_id]

  iam_instance_profile {
    name = var.ec2_iam_profile
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type = "gp3"
      volume_size = 20
      encrypted   = true
      kms_key_id  = var.ebs_kms_key_arn
    }
  }

  # User data script with CloudWatch logging
  user_data = base64encode(<<-EOF
#!/bin/bash
# User data script for EC2 instances with security hardening

# Log all output to CloudWatch Logs
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Update the system
yum update -y

# Install and configure the CloudWatch agent
yum install -y amazon-cloudwatch-agent
cat <<EOT > /opt/aws/amazon-cloudwatch-agent/bin/config.json
{
  "agent": {
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "${var.log_group_name}",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOT
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json -s

# Install a simple web server
yum install -y httpd
echo "<h1>Hello from Terraform</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
systemctl start httpd
systemctl enable httpd
EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "${local.name_prefix}-app-instance"
      Type = "compute"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.common_tags, {
      Name = "${local.name_prefix}-app-volume"
      Type = "storage"
    })
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-app-launch-template"
    Type = "compute"
  })
}

# Auto Scaling Group for high availability
resource "aws_autoscaling_group" "app" {
  depends_on          = [aws_launch_template.app]
  name_prefix         = "${local.name_prefix}-app-asg-"
  vpc_zone_identifier = var.app_subnet_ids
  target_group_arns   = [var.tg_arn]
  health_check_type   = "ELB"

  health_check_grace_period = 600
  min_size                  = 1
  wait_for_capacity_timeout = "0m"
  max_size                  = 4
  desired_capacity          = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-app-asg-instance"
    propagate_at_launch = true
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
