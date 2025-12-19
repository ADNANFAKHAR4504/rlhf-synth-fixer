# ec2.tf - EC2 Auto Scaling Groups for Payment API

# Get latest Amazon Linux 2 AMI
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

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2" {
  name = "payment-ec2-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "payment-ec2-role-${var.environment_suffix}"
  }
}

# IAM Policy for EC2 instances
resource "aws_iam_role_policy" "ec2" {
  name = "payment-ec2-policy-${var.environment_suffix}"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.aurora_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/payment-api-*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/payment/*"
      }
    ]
  })
}

# Attach SSM policy for Session Manager access
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "payment-ec2-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2.name

  tags = {
    Name = "payment-ec2-profile-${var.environment_suffix}"
  }
}

# User data script for EC2 instances
locals {
  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Update system
    yum update -y

    # Install Docker
    amazon-linux-extras install docker -y
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ec2-user

    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm

    # Create CloudWatch config
    cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'CWCONFIG'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/payment-api.log",
                "log_group_name": "/aws/ec2/payment-api-${var.environment_suffix}",
                "log_stream_name": "{instance_id}"
              }
            ]
          }
        }
      },
      "metrics": {
        "namespace": "PaymentAPI/${var.environment_suffix}",
        "metrics_collected": {
          "mem": {
            "measurement": [
              {
                "name": "mem_used_percent",
                "rename": "MemoryUtilization",
                "unit": "Percent"
              }
            ],
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": [
              {
                "name": "used_percent",
                "rename": "DiskUtilization",
                "unit": "Percent"
              }
            ],
            "metrics_collection_interval": 60,
            "resources": [
              "/"
            ]
          }
        }
      }
    }
    CWCONFIG

    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -s \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

    # Pull and run payment API container
    # This is a placeholder - in production, this would pull from ECR
    docker run -d \
      --name payment-api \
      --restart always \
      -p 8080:8080 \
      -e DB_HOST=${aws_rds_cluster.aurora.endpoint} \
      -e DB_NAME=${aws_rds_cluster.aurora.database_name} \
      -e ENVIRONMENT=${var.environment_suffix} \
      -e DEPLOYMENT_COLOR=${var.deployment_color} \
      --log-driver=awslogs \
      --log-opt awslogs-group=/aws/ec2/payment-api-${var.environment_suffix} \
      --log-opt awslogs-region=${var.aws_region} \
      nginx:alpine

    # Create health check endpoint
    docker exec payment-api sh -c 'echo "OK" > /usr/share/nginx/html/health'
  EOF
}

# Launch Template for Blue deployment
resource "aws_launch_template" "blue" {
  name_prefix   = "payment-api-blue-${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.medium"

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = base64encode(local.user_data)

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name            = "payment-api-blue-${var.environment_suffix}"
      DeploymentColor = "blue"
    }
  }

  tags = {
    Name = "payment-api-blue-lt-${var.environment_suffix}"
  }
}

# Launch Template for Green deployment
resource "aws_launch_template" "green" {
  name_prefix   = "payment-api-green-${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.medium"

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = base64encode(local.user_data)

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name            = "payment-api-green-${var.environment_suffix}"
      DeploymentColor = "green"
    }
  }

  tags = {
    Name = "payment-api-green-lt-${var.environment_suffix}"
  }
}

# Auto Scaling Group - Blue
resource "aws_autoscaling_group" "blue" {
  name                = "payment-asg-blue-${var.environment_suffix}"
  min_size            = var.deployment_color == "blue" ? var.asg_min_size : 0
  max_size            = var.deployment_color == "blue" ? var.asg_max_size : 0
  desired_capacity    = var.deployment_color == "blue" ? var.asg_desired_capacity : 0
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = var.deployment_color == "blue" ? [aws_lb_target_group.blue.arn] : []

  launch_template {
    id      = aws_launch_template.blue.id
    version = "$Latest"
  }

  health_check_type         = "ELB"
  health_check_grace_period = 300

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "payment-asg-blue-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "DeploymentColor"
    value               = "blue"
    propagate_at_launch = true
  }
}

# Auto Scaling Group - Green
resource "aws_autoscaling_group" "green" {
  name                = "payment-asg-green-${var.environment_suffix}"
  min_size            = var.deployment_color == "green" ? var.asg_min_size : 0
  max_size            = var.deployment_color == "green" ? var.asg_max_size : 0
  desired_capacity    = var.deployment_color == "green" ? var.asg_desired_capacity : 0
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = var.deployment_color == "green" ? [aws_lb_target_group.green.arn] : []

  launch_template {
    id      = aws_launch_template.green.id
    version = "$Latest"
  }

  health_check_type         = "ELB"
  health_check_grace_period = 300

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "payment-asg-green-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "DeploymentColor"
    value               = "green"
    propagate_at_launch = true
  }
}

# Auto Scaling Policies - Blue
resource "aws_autoscaling_policy" "blue_scale_up" {
  name                   = "payment-scale-up-blue-${var.environment_suffix}"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.blue.name
}

resource "aws_autoscaling_policy" "blue_scale_down" {
  name                   = "payment-scale-down-blue-${var.environment_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.blue.name
}

# Auto Scaling Policies - Green
resource "aws_autoscaling_policy" "green_scale_up" {
  name                   = "payment-scale-up-green-${var.environment_suffix}"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.green.name
}

resource "aws_autoscaling_policy" "green_scale_down" {
  name                   = "payment-scale-down-green-${var.environment_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.green.name
}
