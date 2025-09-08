I'll create a comprehensive multi-region web application infrastructure using Terraform HCL. This setup will deploy identical infrastructure across two AWS regions with proper naming conventions and security best practices.

```hcl
# tap-stack.tf

# Local values for configuration
locals {
  app_name = "tapapp"
  regions = {
    primary   = "us-east-1"
    secondary = "us-west-2"
  }
  
  common_tags = {
    Application = local.app_name
    Environment = "production"
    ManagedBy   = "terraform"
  }
  
  # AMI mapping for different regions
  ami_map = {
    "us-east-1" = "ami-0c02fb55956c7d316"  # Amazon Linux 2
    "us-west-2" = "ami-008fe2fc65df48dac"  # Amazon Linux 2
  }
}

# Data sources for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# VPC Configuration for Primary Region
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.primary}-vpc"
    Region = local.regions.primary
  })
}

# VPC Configuration for Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.secondary}-vpc"
    Region = local.regions.secondary
  })
}

# Internet Gateways
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.primary}-igw"
    Region = local.regions.primary
  })
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.secondary}-igw"
    Region = local.regions.secondary
  })
}

# Public Subnets - Primary Region
resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.primary}-public-${count.index + 1}"
    Region = local.regions.primary
    Type   = "public"
  })
}

# Public Subnets - Secondary Region
resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = 2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.secondary}-public-${count.index + 1}"
    Region = local.regions.secondary
    Type   = "public"
  })
}

# Route Tables
resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.primary}-public-rt"
    Region = local.regions.primary
  })
}

resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.secondary}-public-rt"
    Region = local.regions.secondary
  })
}

# Route Table Associations
resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Security Groups
resource "aws_security_group" "primary_alb" {
  provider    = aws.primary
  name        = "${local.app_name}-${local.regions.primary}-alb-sg"
  description = "Security group for ALB in ${local.regions.primary}"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
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
    Name   = "${local.app_name}-${local.regions.primary}-alb-sg"
    Region = local.regions.primary
  })
}

resource "aws_security_group" "secondary_alb" {
  provider    = aws.secondary
  name        = "${local.app_name}-${local.regions.secondary}-alb-sg"
  description = "Security group for ALB in ${local.regions.secondary}"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
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
    Name   = "${local.app_name}-${local.regions.secondary}-alb-sg"
    Region = local.regions.secondary
  })
}

resource "aws_security_group" "primary_ec2" {
  provider    = aws.primary
  name        = "${local.app_name}-${local.regions.primary}-ec2-sg"
  description = "Security group for EC2 instances in ${local.regions.primary}"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.primary.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.primary}-ec2-sg"
    Region = local.regions.primary
  })
}

resource "aws_security_group" "secondary_ec2" {
  provider    = aws.secondary
  name        = "${local.app_name}-${local.regions.secondary}-ec2-sg"
  description = "Security group for EC2 instances in ${local.regions.secondary}"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.secondary.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.secondary}-ec2-sg"
    Region = local.regions.secondary
  })
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${local.app_name}-ec2-role"

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

resource "aws_iam_role_policy" "ec2_policy" {
  name = "${local.app_name}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.app_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# Application Load Balancers
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "${local.app_name}-${local.regions.primary}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.primary}-alb"
    Region = local.regions.primary
  })
}

resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "${local.app_name}-${local.regions.secondary}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.secondary}-alb"
    Region = local.regions.secondary
  })
}

# Target Groups
resource "aws_lb_target_group" "primary" {
  provider = aws.primary
  name     = "${local.app_name}-${local.regions.primary}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.primary}-tg"
    Region = local.regions.primary
  })
}

resource "aws_lb_target_group" "secondary" {
  provider = aws.secondary
  name     = "${local.app_name}-${local.regions.secondary}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.secondary}-tg"
    Region = local.regions.secondary
  })
}

# Load Balancer Listeners
resource "aws_lb_listener" "primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}

resource "aws_lb_listener" "secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }
}

# Launch Templates
resource "aws_launch_template" "primary" {
  provider      = aws.primary
  name_prefix   = "${local.app_name}-${local.regions.primary}-"
  image_id      = local.ami_map[local.regions.primary]
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.primary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    region = local.regions.primary
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name   = "${local.app_name}-${local.regions.primary}-instance"
      Region = local.regions.primary
    })
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.primary}-lt"
    Region = local.regions.primary
  })
}

resource "aws_launch_template" "secondary" {
  provider      = aws.secondary
  name_prefix   = "${local.app_name}-${local.regions.secondary}-"
  image_id      = local.ami_map[local.regions.secondary]
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    region = local.regions.secondary
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name   = "${local.app_name}-${local.regions.secondary}-instance"
      Region = local.regions.secondary
    })
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.secondary}-lt"
    Region = local.regions.secondary
  })
}

# Auto Scaling Groups
resource "aws_autoscaling_group" "primary" {
  provider            = aws.primary
  name                = "${local.app_name}-${local.regions.primary}-asg"
  vpc_zone_identifier = aws_subnet.primary_public[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.app_name}-${local.regions.primary}-asg"
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

resource "aws_autoscaling_group" "secondary" {
  provider            = aws.secondary
  name                = "${local.app_name}-${local.regions.secondary}-asg"
  vpc_zone_identifier = aws_subnet.secondary_public[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.app_name}-${local.regions.secondary}-asg"
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
resource "aws_autoscaling_policy" "primary_scale_up" {
  provider           = aws.primary
  name               = "${local.app_name}-${local.regions.primary}-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

resource "aws_autoscaling_policy" "primary_scale_down" {
  provider           = aws.primary
  name               = "${local.app_name}-${local.regions.primary}-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

resource "aws_autoscaling_policy" "secondary_scale_up" {
  provider           = aws.secondary
  name               = "${local.app_name}-${local.regions.secondary}-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

resource "aws_autoscaling_policy" "secondary_scale_down" {
  provider           = aws.secondary
  name               = "${local.app_name}-${local.regions.secondary}-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "primary_cpu_high" {
  provider            = aws.primary
  alarm_name          = "${local.app_name}-${local.regions.primary}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.primary}-cpu-high"
    Region = local.regions.primary
  })
}

resource "aws_cloudwatch_metric_alarm" "primary_cpu_low" {
  provider            = aws.primary
  alarm_name          = "${local.app_name}-${local.regions.primary}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.primary}-cpu-low"
    Region = local.regions.primary
  })
}

resource "aws_cloudwatch_metric_alarm" "secondary_cpu_high" {
  provider            = aws.secondary
  alarm_name          = "${local.app_name}-${local.regions.secondary}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.secondary}-cpu-high"
    Region = local.regions.secondary
  })
}

resource "aws_cloudwatch_metric_alarm" "secondary_cpu_low" {
  provider            = aws.secondary
  alarm_name          = "${local.app_name}-${local.regions.secondary}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = merge(local.common_tags, {
    Name   = "${local.app_name}-${local.regions.secondary}-cpu-low"
    Region = local.regions.secondary
  })
}

# Outputs
output "primary_alb_dns" {
  description = "DNS name of the primary region load balancer"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns" {
  description = "DNS name of the secondary region load balancer"
  value       = aws_lb.secondary.dns_name
}

output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}
```

You'll also need to create a `user-data.sh` file in the same directory:

```bash
#!/bin/bash
# user-data.sh

yum update -y
yum install -y httpd

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple index page with region information
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TAP Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        .region { color: #007bff; font-weight: bold; }
        .status { background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>TAP Application</h1>
        <div class="status">
            <h2>Application Status: <span style="color: green;">Running</span></h2>
            <p>Region: <span class="region">${region}</span></p>
            <p>Instance ID: <span id="instance-id">Loading...</span></p>
            <p>Timestamp: <span id="timestamp"></span></p>
        </div>
    </div>
    
    <script>
        // Get instance metadata
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(response => response.text())
            .then(data => {
                document.getElementById('instance-id').textContent = data;
            })
            .catch(error => {
                document.getElementById('instance-id').textContent = 'Unable to fetch';
            });
        
        // Update timestamp
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        
        // Refresh timestamp every 30 seconds
        setInterval(() => {
            document.getElementById('timestamp').textContent = new Date().toLocaleString();
        }, 30000);
    </script>
</body>
</html>
EOF

# Set proper permissions
chown apache:apache /var/www/html/index.html
chmod 644 /var/www/html/index.html

# Configure CloudWatch agent (optional)
yum install -y amazon-cloudwatch-agent
```

And here's the `provider.tf` file you'll need:

```hcl
# provider.tf

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary region provider
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "tap-multi-region"
      Environment = "production"
    }
  }
}

# Secondary region provider
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
  
  default_tags {
    tags = {
      Project     = "tap-multi-region"
      Environment = "production"
    }
  }
}
```

## Key Features Implemented

### 🏗️ **Infrastructure Components**
- **Multi-Region Setup**: Deploys identical infrastructure in `us-east-1` and `us-west-2`
- **VPC with Public Subnets**: Each region has its own VPC with 2 public subnets across AZs
- **Internet Gateways & Route Tables**: Proper routing for internet access

### 🔒 **Security Best Practices**
- **Least Privilege IAM**: EC2 role with minimal required permissions
- **Security Groups**: Restrictive rules (ALB accepts HTTP/HTTPS, EC2 only accepts traffic from ALB)
- **Network Isolation**: Each region has its own isolated network

### ⚖️ **Load Balancing & Auto Scaling**
- **Application Load Balancers**: One per region with health checks
- **Auto Scaling Groups**: Scale between 1-4 instances based on CPU usage
- **CloudWatch Alarms**: Scale up at 70% CPU, scale down at 20% CPU

### 📝 **Naming Conventions**
- Format: `{app_name}-{region}-{resource_type}`
- Example: `tapapp-us-east-1-alb`, `tapapp-us-west-2-vpc`

### 🚀 **Deployment Instructions**

1. **Initialize Terraform**:
   ```bash
   terraform init
   ```

2. **Plan the deployment**:
   ```bash
   terraform plan
   ```

3. **Deploy the infrastructure**:
   ```bash
   terraform apply
   ```

4. **Test the application**:
   - Access the primary region ALB DNS name
   - Access the secondary region ALB DNS name
   - Both should show the application with region-specific information

### 🔄 **Regional Failover**
While this setup doesn't include automatic DNS failover (which would require Route 53), you can manually redirect traffic between regions by updating your DNS records to point to either ALB endpoint.

### 📊 **Monitoring & Scaling**
- CloudWatch alarms monitor CPU utilization
- Auto Scaling policies automatically adjust capacity
- Health checks ensure only healthy instances receive traffic

This infrastructure provides a solid foundation for a multi-region web application with high availability, automatic scaling, and security best practices. The deployment time should be approximately 10-15 minutes per region.