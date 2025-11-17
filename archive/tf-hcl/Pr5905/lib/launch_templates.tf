# User Data Script for EC2 Instances
locals {
  user_data_blue = base64encode(templatefile("${path.module}/user_data.sh", {
    environment        = "blue"
    environment_suffix = var.environment_suffix
    s3_bucket          = aws_s3_bucket.artifacts.bucket
    app_version        = var.app_version_blue
    db_proxy_endpoint  = aws_db_proxy.main.endpoint
    db_name            = var.db_name
    region             = var.region
  }))

  user_data_green = base64encode(templatefile("${path.module}/user_data.sh", {
    environment        = "green"
    environment_suffix = var.environment_suffix
    s3_bucket          = aws_s3_bucket.artifacts.bucket
    app_version        = var.app_version_green
    db_proxy_endpoint  = aws_db_proxy.main.endpoint
    db_name            = var.db_name
    region             = var.region
  }))
}

# Launch Template - Blue Environment
resource "aws_launch_template" "blue" {
  name_prefix   = "lt-blue-${var.environment_suffix}-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = local.user_data_blue

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name           = "ec2-blue-${var.environment_suffix}"
      Environment    = "Blue"
      DeploymentType = "BlueGreen"
      Version        = var.app_version_blue
    }
  }

  tag_specifications {
    resource_type = "volume"

    tags = {
      Name        = "volume-blue-${var.environment_suffix}"
      Environment = "Blue"
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name           = "lt-blue-${var.environment_suffix}"
    Environment    = "Blue"
    DeploymentType = "BlueGreen"
    Version        = var.app_version_blue
  }
}

# Launch Template - Green Environment
resource "aws_launch_template" "green" {
  name_prefix   = "lt-green-${var.environment_suffix}-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = local.user_data_green

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name           = "ec2-green-${var.environment_suffix}"
      Environment    = "Green"
      DeploymentType = "BlueGreen"
      Version        = var.app_version_green
    }
  }

  tag_specifications {
    resource_type = "volume"

    tags = {
      Name        = "volume-green-${var.environment_suffix}"
      Environment = "Green"
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name           = "lt-green-${var.environment_suffix}"
    Environment    = "Green"
    DeploymentType = "BlueGreen"
    Version        = var.app_version_green
  }
}
