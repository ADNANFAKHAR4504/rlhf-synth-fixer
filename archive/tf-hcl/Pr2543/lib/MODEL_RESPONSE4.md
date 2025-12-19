Here are the code snippets to fix the errors you're encountering:

## Fix 1: AWS Config Delivery Channel Frequency

Replace the existing AWS Config delivery channel resources with the corrected `delivery_frequency` values:

```hcl
# AWS Config delivery channel for primary region
resource "aws_config_delivery_channel" "primary" {
  provider           = aws.us_east_2
  name               = "${local.project_name}-primary-config-delivery-channel"
  s3_bucket_name     = aws_s3_bucket.config_primary.bucket
  s3_key_prefix      = "config"
  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"  # Changed from "Daily"
  }

  depends_on = [aws_config_configuration_recorder.primary]
}

# AWS Config delivery channel for secondary region
resource "aws_config_delivery_channel" "secondary" {
  provider           = aws.us_west_1
  name               = "${local.project_name}-secondary-config-delivery-channel"
  s3_bucket_name     = aws_s3_bucket.config_secondary.bucket
  s3_key_prefix      = "config"
  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"  # Changed from "Daily"
  }

  depends_on = [aws_config_configuration_recorder.secondary]
}
```

## Fix 2: AWS Config IAM Role Policy

Replace the existing IAM role policy attachment with the correct policy ARN and add additional required permissions:

```hcl
# Remove the incorrect policy attachment and replace with correct one
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"  # Corrected policy ARN
}

# Add S3 delivery permissions for Config
resource "aws_iam_role_policy" "config_s3_policy" {
  name = "${local.project_name}-config-s3-policy"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.config_primary.arn,
          aws_s3_bucket.config_secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          "${aws_s3_bucket.config_primary.arn}/*",
          "${aws_s3_bucket.config_secondary.arn}/*"
        ]
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}
```

## Fix 3: Enhanced AWS Config IAM Role with Trust Policy

Also update the AWS Config IAM role to ensure it has the correct trust policy:

```hcl
# IAM role for AWS Config (updated)
resource "aws_iam_role" "config_role" {
  name = "${local.project_name}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-config-role"
  })
}
```

## Fix 4: Add Missing User Data File Creation

Since the launch templates reference a user data file, add this inline user data instead of referencing an external file:

```hcl
# Launch template for primary region (updated user_data)
resource "aws_launch_template" "primary" {
  provider      = aws.us_east_2
  name          = "${local.project_name}-primary-lt"
  description   = "Launch template for primary region instances"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.primary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent httpd
    systemctl start httpd
    systemctl enable httpd

    # Create a simple web page
    echo "<h1>Hello from ${var.primary_region}</h1>" > /var/www/html/index.html
    echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
    echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html

    # Install and configure CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm

    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CWEOF'
{
    "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "diskio": {
                "measurement": [
                    "io_time"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
CWEOF

    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.project_name}-primary-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-lt"
  })
}

# Launch template for secondary region (updated user_data)
resource "aws_launch_template" "secondary" {
  provider      = aws.us_west_1
  name          = "${local.project_name}-secondary-lt"
  description   = "Launch template for secondary region instances"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent httpd
    systemctl start httpd
    systemctl enable httpd

    # Create a simple web page
    echo "<h1>Hello from ${var.secondary_region}</h1>" > /var/www/html/index.html
    echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
    echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html

    # Install and configure CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm

    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CWEOF'
{
    "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "diskio": {
                "measurement": [
                    "io_time"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
CWEOF

    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.project_name}-secondary-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-lt"
  })
}
```

## Summary of Changes:

1. **Config Delivery Frequency**: Changed from `"Daily"` to `"TwentyFour_Hours"` (valid AWS Config frequency)
2. **IAM Policy ARN**: Changed from `service-role/ConfigRole` to `service-role/AWS_ConfigRole` (correct AWS managed policy)
3. **Added S3 Policy**: Added explicit S3 permissions for AWS Config to write to the Config buckets
4. **Inline User Data**: Replaced external file reference with inline user data script

These fixes should resolve all the errors you're encountering during the Terraform deployment.
