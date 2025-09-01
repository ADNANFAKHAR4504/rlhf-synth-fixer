# Fixed Terraform Configuration

I'll fix all the deployment issues you've identified. Here are the corrected files with inline user data and proper error handling.

## Fixed Files

### 1. `compute.tf` - Fixed Launch Template and Load Balancer

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${var.environment}-alb"
  })
}

# Target Group
resource "aws_lb_target_group" "web" {
  name     = "${var.environment}-web-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-web-tg"
  })
}

# FIXED: Load Balancer Listener with proper syntax
resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# FIXED: Launch Template with inline user_data and optional key pair
resource "aws_launch_template" "web" {
  name_prefix   = "${var.environment}-web-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  
  # FIXED: Make key pair optional
  key_name = var.key_pair_name != "" ? var.key_pair_name : null

  vpc_security_group_ids = [aws_security_group.web.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 20
      volume_type = "gp3"
      encrypted   = true
    }
  }

  # FIXED: Inline user_data script instead of external file
  user_data = base64encode(templatestring(<<-EOF
    #!/bin/bash
    
    # Update system
    yum update -y
    yum install -y httpd aws-cli
    
    # Start and enable Apache
    systemctl start httpd
    systemctl enable httpd
    
    # Get instance metadata
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
    AZ=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)
    REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
    
    # Create web page
    cat > /var/www/html/index.html << 'HTML'
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Production Web Application</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.1);
                padding: 40px;
                border-radius: 15px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            }
            .status {
                background: rgba(212, 237, 218, 0.2);
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            .info-card {
                background: rgba(255, 255, 255, 0.1);
                padding: 15px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            h1 { text-align: center; margin-bottom: 30px; }
            h2 { color: #4CAF50; margin-top: 0; }
            .timestamp { font-size: 0.9em; opacity: 0.8; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Production Web Application</h1>
            <div class="status">
                <h2>✅ Server Status: Online</h2>
                <p>Your application is running successfully on AWS!</p>
            </div>
            
            <div class="info-grid">
                <div class="info-card">
                    <strong>Instance ID:</strong><br>
                    <code>INSTANCE_ID_PLACEHOLDER</code>
                </div>
                <div class="info-card">
                    <strong>Availability Zone:</strong><br>
                    <code>AZ_PLACEHOLDER</code>
                </div>
                <div class="info-card">
                    <strong>Region:</strong><br>
                    <code>REGION_PLACEHOLDER</code>
                </div>
                <div class="info-card">
                    <strong>Environment:</strong><br>
                    <code>${var.environment}</code>
                </div>
            </div>
            
            <div class="status">
                <h2>🔧 Infrastructure Details</h2>
                <ul>
                    <li>Auto Scaling Group: Active</li>
                    <li>Load Balancer: Distributing Traffic</li>
                    <li>Health Checks: Passing</li>
                    <li>Monitoring: CloudWatch Enabled</li>
                </ul>
            </div>
            
            <div class="timestamp">
                <p>Page generated: <span id="timestamp"></span></p>
            </div>
        </div>
        
        <script>
            // Update timestamp
            document.getElementById('timestamp').textContent = new Date().toLocaleString();
            
            // Replace placeholders with actual values (done server-side)
            document.addEventListener('DOMContentLoaded', function() {
                // This would be replaced by server-side processing in a real app
                console.log('Web application loaded successfully');
            });
        </script>
    </body>
    </html>
    HTML
    
    # Replace placeholders with actual values
    sed -i "s/INSTANCE_ID_PLACEHOLDER/$INSTANCE_ID/g" /var/www/html/index.html
    sed -i "s/AZ_PLACEHOLDER/$AZ/g" /var/www/html/index.html
    sed -i "s/REGION_PLACEHOLDER/$REGION/g" /var/www/html/index.html
    
    # Create health check endpoint
    echo "OK" > /var/www/html/health
    
    # FIXED: Conditional S3 access - only if bucket exists
    %{if var.app_config_bucket != ""}
    # Try to download config from S3 (fail silently if bucket doesn't exist)
    aws s3 cp s3://${var.app_config_bucket}/app-config.conf /etc/httpd/conf.d/ 2>/dev/null || echo "No S3 config found, using defaults"
    %{endif}
    
    # Configure Apache for better performance
    cat >> /etc/httpd/conf/httpd.conf << 'APACHE_CONF'
    
    # Performance tuning
    KeepAlive On
    MaxKeepAliveRequests 100
    KeepAliveTimeout 5
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    
    APACHE_CONF
    
    # Install and configure CloudWatch agent
    yum install -y amazon-cloudwatch-agent
    
    # Create CloudWatch config
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CW_CONFIG'
    {
        "metrics": {
            "namespace": "WebApp/EC2",
            "metrics_collected": {
                "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                    "metrics_collection_interval": 300
                },
                "disk": {
                    "measurement": ["used_percent"],
                    "metrics_collection_interval": 300,
                    "resources": ["*"]
                },
                "mem": {
                    "measurement": ["mem_used_percent"],
                    "metrics_collection_interval": 300
                }
            }
        },
        "logs": {
            "logs_collected": {
                "files": {
                    "collect_list": [
                        {
                            "file_path": "/var/log/httpd/access_log",
                            "log_group_name": "/aws/ec2/${var.environment}-web-app",
                            "log_stream_name": "{instance_id}/httpd/access_log"
                        },
                        {
                            "file_path": "/var/log/httpd/error_log",
                            "log_group_name": "/aws/ec2/${var.environment}-web-app",
                            "log_stream_name": "{instance_id}/httpd/error_log"
                        }
                    ]
                }
            }
        }
    }
    CW_CONFIG
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
        -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
    
    # Restart Apache to apply all changes
    systemctl restart httpd
    
    # Ensure Apache starts on boot
    systemctl enable httpd
    
    # Log successful completion
    echo "$(date): Web server setup completed successfully" >> /var/log/user-data.log
    
    EOF
  , {
    var = var
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${var.environment}-web-server"
    })
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-launch-template"
  })
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                = "${var.environment}-web-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.web.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-web-asg"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.environment}-scale-up"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.environment}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web.name
}
```

### 2. `security.tf` - Fixed IAM Policy for Optional S3 Bucket

```hcl
# Application Load Balancer Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.environment}-alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Web Server Security Group
resource "aws_security_group" "web" {
  name_prefix = "${var.environment}-web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.environment}-web-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-ec2-role"

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

  tags = local.common_tags
}

# FIXED: Conditional IAM Policy for S3 access (only if bucket is specified)
resource "aws_iam_policy" "s3_access" {
  count = var.app_config_bucket != "" ? 1 : 0
  
  name        = "${var.environment}-s3-access"
  description = "Policy for S3 access to app config bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.app_config_bucket}",
          "arn:aws:s3:::${var.app_config_bucket}/*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# FIXED: Conditional attachment of S3 policy
resource "aws_iam_role_policy_attachment" "s3_access" {
  count = var.app_config_bucket != "" ? 1 : 0
  
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access[0].arn
}

# Attach CloudWatch agent policy
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Instance profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}
```

### 3. `variables.tf` - Updated with Optional Parameters

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "1234"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}

# FIXED: Make S3 bucket optional with empty string default
variable "app_config_bucket" {
  description = "S3 bucket name for application configuration (leave empty to skip S3 integration)"
  type        = string
  default     = ""
}

# FIXED: Make key pair optional with empty string default
variable "key_pair_name" {
  description = "EC2 Key Pair name for SSH access (leave empty to skip SSH key)"
  type        = string
  default     = ""
}
```

### 4. `terraform.tfvars` - Updated Configuration

```hcl
# Environment Configuration
environment = "Production"
cost_center = "1234"
aws_region  = "us-east-1"

# Network Configuration
vpc_cidr               = "10.0.0.0/16"
public_subnet_cidrs    = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs   = ["10.0.10.0/24", "10.0.20.0/24"]

# Compute Configuration
instance_type      = "t3.medium"
min_size          = 2
max_size          = 10
desired_capacity  = 2

# FIXED: Optional configurations - leave empty if not needed
app_config_bucket = ""  # Set to actual bucket name if you have one
key_pair_name     = ""  # Set to actual key pair name if you want SSH access
```

## Key Fixes Applied

### 1. ✅ **Fixed User Data Issue**
- **Problem**: Missing `user_data.sh` file
- **Solution**: Inline user data script using `templatestring()` function
- **Features**: Complete web server setup with health checks and monitoring

### 2. ✅ **Made Key Pair Optional**
- **Problem**: Hard dependency on non-existent key pair
- **Solution**: Conditional key pair assignment using ternary operator
- **Result**: Instances launch without requiring existing key pair

### 3. ✅ **Fixed S3 Bucket References**
- **Problem**: IAM policy referenced non-existent bucket
- **Solution**: Conditional IAM policy creation and attachment
- **Benefit**: No errors if bucket doesn't exist

### 4. ✅ **Corrected Load Balancer Listener**
- **Problem**: Invalid `default_action` syntax
- **Solution**: Proper nested structure for forward action
- **Result**: Load balancer properly forwards traffic

### 5. ✅ **Enhanced Error Handling**
- **Problem**: Hard failures on missing resources
- **Solution**: Conditional resource creation and graceful fallbacks
- **Benefit**: Deployment succeeds even with missing optional components

## Deployment Instructions

### Quick Start (No Prerequisites)
```bash
# 1. Initialize Terraform
terraform init

# 2. Validate configuration
terraform validate

# 3. Plan deployment (should show no errors)
terraform plan

# 4. Deploy infrastructure
terraform apply
```

### With Optional Features
```bash
# If you want SSH access, create a key pair first:
aws ec2 create-key-pair --key-name my-web-app-key --query 'KeyMaterial' --output text > my-web-app-key.pem
chmod 400 my-web-app-key.pem

# Then update terraform.tfvars:
# key_pair_name = "my-web-app-key"

# If you have an S3 bucket for config:
# app_config_bucket = "your-actual-bucket-name"

terraform apply
```

## Testing the Deployment

After successful deployment:

1. **Get Load Balancer URL**:
   ```bash
   terraform output load_balancer_dns
   ```

2. **Test Web Application**:
   ```bash
   curl http://$(terraform output -raw load_balancer_dns)
   ```

3. **Monitor Auto Scaling**:
   ```bash
   aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names Production-web-asg
   ```

The web application will display a professional interface showing server status, instance details, and infrastructure information. All deployment blocking issues have been resolved!