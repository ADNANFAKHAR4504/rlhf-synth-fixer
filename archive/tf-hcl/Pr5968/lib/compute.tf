# compute.tf

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

# Launch Template for EC2 Instances with IMDSv2
resource "aws_launch_template" "payment_processing" {
  name_prefix   = "payment-processing-${var.environment_suffix}"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.ec2_instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_payment_processing.name
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app_tier.id]
    delete_on_termination       = true
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 50
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.s3.arn
      delete_on_termination = true
    }
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent

              # Configure CloudWatch Agent
              cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'EOC'
              {
                "logs": {
                  "logs_collected": {
                    "files": {
                      "collect_list": [
                        {
                          "file_path": "/var/log/messages",
                          "log_group_name": "${aws_cloudwatch_log_group.security_events.name}",
                          "log_stream_name": "{instance_id}/messages"
                        }
                      ]
                    }
                  }
                }
              }
              EOC

              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config \
                -m ec2 \
                -s \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
              EOF
  )

  tag_specifications {
    resource_type = "instance"

    tags = merge(var.tags, {
      Name = "payment-processing-${var.environment_suffix}"
    })
  }

  tag_specifications {
    resource_type = "volume"

    tags = merge(var.tags, {
      Name = "payment-processing-volume-${var.environment_suffix}"
    })
  }

  tags = merge(var.tags, {
    Name = "payment-processing-lt-${var.environment_suffix}"
  })
}

# EC2 Instances (one per AZ for demonstration)
resource "aws_instance" "payment_processing" {
  count = length(var.availability_zones)

  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = var.ec2_instance_type
  subnet_id     = aws_subnet.private[count.index].id

  iam_instance_profile = aws_iam_instance_profile.ec2_payment_processing.name

  vpc_security_group_ids = [aws_security_group.app_tier.id]

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  root_block_device {
    volume_size           = 50
    volume_type           = "gp3"
    encrypted             = true
    kms_key_id            = aws_kms_key.s3.arn
    delete_on_termination = true
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent

              # Configure CloudWatch Agent
              cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'EOC'
              {
                "logs": {
                  "logs_collected": {
                    "files": {
                      "collect_list": [
                        {
                          "file_path": "/var/log/messages",
                          "log_group_name": "${aws_cloudwatch_log_group.security_events.name}",
                          "log_stream_name": "{instance_id}/messages"
                        }
                      ]
                    }
                  }
                }
              }
              EOC

              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config \
                -m ec2 \
                -s \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
              EOF
  )

  tags = merge(var.tags, {
    Name = "payment-processing-${count.index + 1}-${var.environment_suffix}"
    AZ   = var.availability_zones[count.index]
  })
}
