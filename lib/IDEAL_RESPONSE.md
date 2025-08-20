```hcl
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_launch_template" "main" {
  name_prefix   = "${var.environment}-lt-${var.region}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.security_group_id]

  iam_instance_profile {
    name = var.instance_profile_name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region      = var.region
    environment = var.environment
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "${var.environment}-instance-${var.region}"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "main" {
  name                      = "${var.environment}-asg-${var.region}"
  vpc_zone_identifier       = var.subnet_ids
  target_group_arns         = var.target_group_arns
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.main.id
        version            = "$Latest"
      }

      override {
        instance_type     = var.instance_type
        weighted_capacity = "1"
      }
    }

    instances_distribution {
      on_demand_base_capacity                  = 0
      on_demand_percentage_above_base_capacity = 0
      spot_allocation_strategy                 = "lowest-price"
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-asg-${var.region}"
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

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-alb-${var.region}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = merge(var.common_tags, {
    Name = "${var.environment}-alb-${var.region}"
  })
}

resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-tg-${var.region}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

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

  tags = merge(var.common_tags, {
    Name = "${var.environment}-tg-${var.region}"
  })
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

```

```hcl
output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.main.id
}

output "launch_template_name" {
  description = "Name of the launch template"
  value       = aws_launch_template.main.name
}

output "autoscaling_group_id" {
  description = "ID of the autoscaling group"
  value       = aws_autoscaling_group.main.id
}

output "autoscaling_group_name" {
  description = "Name of the autoscaling group"
  value       = aws_autoscaling_group.main.name
}

output "load_balancer_id" {
  description = "ID of the application load balancer"
  value       = aws_lb.main.id
}

output "load_balancer_arn" {
  description = "ARN of the application load balancer"
  value       = aws_lb.main.arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the application load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the application load balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "target_group_name" {
  description = "Name of the target group"
  value       = aws_lb_target_group.main.name
}

output "listener_arn" {
  description = "ARN of the load balancer listener"
  value       = aws_lb_listener.main.arn
}

output "ami_id" {
  description = "ID of the Amazon Linux AMI used"
  value       = data.aws_ami.amazon_linux.id
}

output "instance_type" {
  description = "Instance type used in the launch template"
  value       = var.instance_type
}

```

```bach.sh
#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/${environment}/${region}/messages",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Start web server
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${region} - ${environment}</h1>" > /var/www/html/index.html
```

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for ASG"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}

variable "instance_profile_name" {
  description = "IAM instance profile name"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances"
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired number of instances"
  type        = number
  default     = 2
}

variable "target_group_arns" {
  description = "Target group ARNs"
  type        = list(string)
  default     = []
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
```

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

```

```hcl
# Generate a secure random password
resource "random_password" "database" {
  length  = 32
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# Store the password in AWS SSM Parameter Store
resource "aws_ssm_parameter" "database_password" {
  name        = "/${var.environment}/database/${var.region}/password"
  description = "Database password for ${var.environment} environment in ${var.region}"
  type        = "SecureString"
  value       = random_password.database.result

  tags = merge(var.common_tags, {
    Name = "${var.environment}-db-password-${var.region}"
  })
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group-${var.region}"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.common_tags, {
    Name = "${var.environment}-db-subnet-group-${var.region}"
  })
}

resource "aws_db_parameter_group" "main" {
  family = "postgres13"
  name   = "${var.environment}-db-params-${var.region}"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-db-params-${var.region}"
  })
}

resource "aws_db_instance" "main" {
  count = var.is_primary ? 1 : 0

  identifier = "${var.environment}-postgres-${var.region}"

  engine         = "postgres"
  engine_version = "13.22"
  instance_class = var.db_instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.database_username
  password = random_password.database.result

  vpc_security_group_ids = [var.database_security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = var.environment == "dev"
  deletion_protection = var.environment == "prod"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.common_tags, {
    Name = "${var.environment}-postgres-${var.region}"
    Type = "Primary"
  })
}

resource "aws_db_instance" "read_replica" {
  count = var.is_primary ? 0 : (var.source_db_identifier != null ? 1 : 0)

  identifier = "${var.environment}-postgres-replica-${var.region}"

  replicate_source_db = var.source_db_identifier
  instance_class      = var.db_instance_class

  vpc_security_group_ids = [var.database_security_group_id]

  skip_final_snapshot = var.environment == "dev"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.common_tags, {
    Name = "${var.environment}-postgres-replica-${var.region}"
    Type = "ReadReplica"
  })
}
```

```hcl
output "database_instance_id" {
  description = "ID of the primary database instance"
  value       = var.is_primary ? aws_db_instance.main[0].id : null
}

output "database_instance_arn" {
  description = "ARN of the primary database instance"
  value       = var.is_primary ? aws_db_instance.main[0].arn : null
}

output "database_endpoint" {
  description = "Endpoint of the primary database instance"
  value       = var.is_primary ? aws_db_instance.main[0].endpoint : null
}

output "database_port" {
  description = "Port of the primary database instance"
  value       = var.is_primary ? aws_db_instance.main[0].port : null
}

output "database_name" {
  description = "Name of the primary database"
  value       = var.is_primary ? aws_db_instance.main[0].db_name : null
}

output "database_username" {
  description = "Username of the primary database"
  value       = var.is_primary ? aws_db_instance.main[0].username : null
}

output "database_identifier" {
  description = "Identifier of the primary database instance"
  value       = var.is_primary ? aws_db_instance.main[0].identifier : null
}

output "read_replica_id" {
  description = "ID of the read replica database instance"
  value       = var.is_primary ? null : (length(aws_db_instance.read_replica) > 0 ? aws_db_instance.read_replica[0].id : null)
}

output "read_replica_endpoint" {
  description = "Endpoint of the read replica database instance"
  value       = var.is_primary ? null : (length(aws_db_instance.read_replica) > 0 ? aws_db_instance.read_replica[0].endpoint : null)
}

output "read_replica_identifier" {
  description = "Identifier of the read replica database instance"
  value       = var.is_primary ? null : (length(aws_db_instance.read_replica) > 0 ? aws_db_instance.read_replica[0].identifier : null)
}

output "subnet_group_id" {
  description = "ID of the database subnet group"
  value       = aws_db_subnet_group.main.id
}

output "subnet_group_name" {
  description = "Name of the database subnet group"
  value       = aws_db_subnet_group.main.name
}

output "parameter_group_id" {
  description = "ID of the database parameter group"
  value       = aws_db_parameter_group.main.id
}

output "parameter_group_name" {
  description = "Name of the database parameter group"
  value       = aws_db_parameter_group.main.name
}

output "ssm_parameter_name" {
  description = "Name of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.name
}

output "ssm_parameter_arn" {
  description = "ARN of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.arn
}

output "database_engine_version" {
  description = "Engine version of the database"
  value       = var.is_primary ? aws_db_instance.main[0].engine_version : null
}

output "database_instance_class" {
  description = "Instance class of the database"
  value       = var.db_instance_class
}

output "database_allocated_storage" {
  description = "Allocated storage of the database"
  value       = var.allocated_storage
}

output "database_encrypted" {
  description = "Whether the database storage is encrypted"
  value       = var.is_primary ? aws_db_instance.main[0].storage_encrypted : null
}

```

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "database_security_group_id" {
  description = "Database security group ID"
  type        = string
}

variable "is_primary" {
  description = "Whether this is the primary database"
  type        = bool
  default     = false
}

variable "source_db_identifier" {
  description = "Source database identifier for read replica"
  type        = string
  default     = ""
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage in GB"
  type        = number
  default     = 100
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "database_username" {
  description = "Database username"
  type        = string
  default     = "dbadmin"
}



variable "common_tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}

```

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }
}
```

```hcl
# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-ec2-role-${var.region}"

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

  tags = merge(var.common_tags, {
    Name = "${var.environment}-ec2-role-${var.region}"
  })
}

resource "aws_iam_role_policy" "ec2_cloudwatch_policy" {
  name = "${var.environment}-ec2-cloudwatch-policy-${var.region}"
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
          "logs:CreateLogStream",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-ec2-profile-${var.region}"
  role = aws_iam_role.ec2_role.name

  tags = merge(var.common_tags, {
    Name = "${var.environment}-ec2-profile-${var.region}"
  })
}

# RDS Enhanced Monitoring Role
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.environment}-rds-monitoring-role-${var.region}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.environment}-rds-monitoring-role-${var.region}"
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```

```hcl
output "ec2_instance_profile_name" {
  description = "EC2 instance profile name"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_role_arn" {
  description = "EC2 role ARN"
  value       = aws_iam_role.ec2_role.arn
}

output "rds_monitoring_role_arn" {
  description = "RDS monitoring role ARN"
  value       = aws_iam_role.rds_enhanced_monitoring.arn
}
```

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
```

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

```

```hcl
resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/aws/ec2/${var.environment}/${var.region}/messages"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-app-logs-${var.region}"
  })
}

resource "aws_cloudwatch_log_group" "rds_logs" {
  name              = "/aws/rds/instance/${var.environment}-postgres-${var.region}/postgresql"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-rds-logs-${var.region}"
  })
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-dashboard-${var.region}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "${var.environment}-asg-${var.region}"],
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${var.environment}-alb-${var.region}"]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "EC2 and ALB Metrics"
        }
      }
    ]
  })
}
```

```hcl
output "application_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application_logs.name
}

output "application_log_group_arn" {
  description = "ARN of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application_logs.arn
}

output "rds_log_group_name" {
  description = "Name of the RDS CloudWatch log group"
  value       = aws_cloudwatch_log_group.rds_logs.name
}

output "rds_log_group_arn" {
  description = "ARN of the RDS CloudWatch log group"
  value       = aws_cloudwatch_log_group.rds_logs.arn
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "log_retention_days" {
  description = "Log retention period in days"
  value       = var.log_retention_days
}

```

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 14
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
```

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

```

```hcl
# Route 53 Multi-Regional DNS Configuration

# Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.us_east_1

  name = var.domain_name

  tags = merge(var.common_tags, {
    Name = "${var.environment}-hosted-zone"
  })
}

# Health Checks for each region
resource "aws_route53_health_check" "us_east_1" {
  provider = aws.us_east_1

  fqdn              = var.us_east_1_lb_dns
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-health-check-us-east-1"
  })
}

resource "aws_route53_health_check" "eu_west_1" {
  provider = aws.eu_west_1

  fqdn              = var.eu_west_1_lb_dns
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-health-check-eu-west-1"
  })
}

resource "aws_route53_health_check" "ap_southeast_1" {
  provider = aws.ap_southeast_1

  fqdn              = var.ap_southeast_1_lb_dns
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-health-check-ap-southeast-1"
  })
}

# Primary A Record (US East 1)
resource "aws_route53_record" "primary" {
  provider = aws.us_east_1

  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.us_east_1_lb_dns
    zone_id                = "Z35SXDOTRQ7X7K" # ALB zone ID for us-east-1
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.us_east_1.id
  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier = "us-east-1"
}

# Secondary A Record (EU West 1)
resource "aws_route53_record" "secondary_eu_west_1" {
  provider = aws.eu_west_1

  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.eu_west_1_lb_dns
    zone_id                = "Z32O12X8N17W61" # ALB zone ID for eu-west-1 (Ireland)
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.eu_west_1.id
  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = "eu-west-1"
}

# Secondary A Record (AP Southeast 1)
resource "aws_route53_record" "secondary_ap_southeast_1" {
  provider = aws.ap_southeast_1

  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.ap_southeast_1_lb_dns
    zone_id                = "Z3O0EMF9N8YDH6T" # ALB zone ID for ap-southeast-1
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.ap_southeast_1.id
  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = "ap-southeast-1"
}

# Regional subdomains for direct access
resource "aws_route53_record" "us_east_1" {
  provider = aws.us_east_1

  zone_id = aws_route53_zone.main.zone_id
  name    = "us-east-1.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.us_east_1_lb_dns
    zone_id                = "Z35SXDOTRQ7X7K"
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "eu_west_1" {
  provider = aws.eu_west_1

  zone_id = aws_route53_zone.main.zone_id
  name    = "eu-west-1.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.eu_west_1_lb_dns
    zone_id                = "Z32O12X8N17W61"
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "ap_southeast_1" {
  provider = aws.ap_southeast_1

  zone_id = aws_route53_zone.main.zone_id
  name    = "ap-southeast-1.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.ap_southeast_1_lb_dns
    zone_id                = "Z3O0EMF9N8YDH6T"
    evaluate_target_health = true
  }
}

# CNAME for www subdomain
resource "aws_route53_record" "www" {
  provider = aws.us_east_1

  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = "300"
  records = [var.domain_name]
}
```

```hcl
output "hosted_zone_id" {
  description = "ID of the Route 53 hosted zone"
  value       = aws_route53_zone.main.zone_id
}

output "hosted_zone_name_servers" {
  description = "Name servers for the hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
}

output "primary_dns_record" {
  description = "Primary DNS record (US East 1)"
  value       = aws_route53_record.primary.name
}

output "regional_dns_records" {
  description = "Regional DNS records"
  value = {
    us_east_1      = aws_route53_record.us_east_1.name
    eu_west_1      = aws_route53_record.eu_west_1.name
    ap_southeast_1 = aws_route53_record.ap_southeast_1.name
  }
}

output "health_check_ids" {
  description = "Health check IDs for each region"
  value = {
    us_east_1      = aws_route53_health_check.us_east_1.id
    eu_west_1      = aws_route53_health_check.eu_west_1.id
    ap_southeast_1 = aws_route53_health_check.ap_southeast_1.id
  }
}

output "www_dns_record" {
  description = "WWW DNS record"
  value       = aws_route53_record.www.name
}
```

```hcl
variable "domain_name" {
  description = "Domain name for the hosted zone"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "us_east_1_lb_dns" {
  description = "Load balancer DNS name for US East 1"
  type        = string
}

variable "eu_west_1_lb_dns" {
  description = "Load balancer DNS name for EU West 1"
  type        = string
}

variable "ap_southeast_1_lb_dns" {
  description = "Load balancer DNS name for AP Southeast 1"
  type        = string
}

variable "us_east_1_region" {
  description = "US East 1 region name"
  type        = string
}

variable "eu_west_1_region" {
  description = "EU West 1 region name"
  type        = string
}

variable "ap_southeast_1_region" {
  description = "AP Southeast 1 region name"
  type        = string
}

```

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 5.0"
      configuration_aliases = [aws.us_east_1, aws.eu_west_1, aws.ap_southeast_1]
    }
  }
}

```

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-vpc-${var.region}"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "${var.environment}-igw-${var.region}"
  })
}

resource "aws_subnet" "public" {
  count = var.public_subnet_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-public-subnet-${count.index + 1}-${var.region}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count = var.private_subnet_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + var.public_subnet_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.environment}-private-subnet-${count.index + 1}-${var.region}"
    Type = "Private"
  })
}

resource "aws_nat_gateway" "main" {
  count = var.private_subnet_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name = "${var.environment}-nat-gateway-${count.index + 1}-${var.region}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_eip" "nat" {
  count = var.private_subnet_count

  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-nat-eip-${count.index + 1}-${var.region}"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-public-rt-${var.region}"
  })
}

resource "aws_route_table" "private" {
  count = var.private_subnet_count

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-private-rt-${count.index + 1}-${var.region}"
  })
}

resource "aws_route_table_association" "public" {
  count = var.public_subnet_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = var.private_subnet_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "web" {
  name        = "${var.environment}-web-sg-${var.region}"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

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

  tags = merge(var.common_tags, {
    Name = "${var.environment}-web-sg-${var.region}"
  })
}

resource "aws_security_group" "database" {
  name        = "${var.environment}-db-sg-${var.region}"
  description = "Security group for database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-db-sg-${var.region}"
  })
}

# Network ACLs
resource "aws_network_acl" "main" {
  vpc_id = aws_vpc.main.id

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-main-nacl-${var.region}"
  })
}
```

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}
```

```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "public_subnet_count" {
  description = "Number of public subnets"
  type        = number
  default     = 2
}

variable "private_subnet_count" {
  description = "Number of private subnets"
  type        = number
  default     = 2
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
  default     = {}
}
```

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

```

```hcl
# VPC Peering Connections between all regions

# US East 1 <-> EU West 1 Peering
resource "aws_vpc_peering_connection" "us_east_1_to_eu_west_1" {
  provider = aws.us_east_1

  vpc_id      = var.vpc_us_east_1_id
  peer_vpc_id = var.vpc_eu_west_1_id
  peer_region = "eu-west-1"
  auto_accept = false

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-us-east-1-to-eu-west-1"
  })
}

resource "aws_vpc_peering_connection_accepter" "eu_west_1_accept_us_east_1" {
  provider = aws.eu_west_1

  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_eu_west_1.id
  auto_accept               = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-eu-west-1-accept-us-east-1"
  })
}

# US East 1 <-> AP Southeast 1 Peering
resource "aws_vpc_peering_connection" "us_east_1_to_ap_southeast_1" {
  provider = aws.us_east_1

  vpc_id      = var.vpc_us_east_1_id
  peer_vpc_id = var.vpc_ap_southeast_1_id
  peer_region = "ap-southeast-1"
  auto_accept = false

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-us-east-1-to-ap-southeast-1"
  })
}

resource "aws_vpc_peering_connection_accepter" "ap_southeast_1_accept_us_east_1" {
  provider = aws.ap_southeast_1

  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_ap_southeast_1.id
  auto_accept               = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-ap-southeast-1-accept-us-east-1"
  })
}

# EU West 1 <-> AP Southeast 1 Peering
resource "aws_vpc_peering_connection" "eu_west_1_to_ap_southeast_1" {
  provider = aws.eu_west_1

  vpc_id      = var.vpc_eu_west_1_id
  peer_vpc_id = var.vpc_ap_southeast_1_id
  peer_region = "ap-southeast-1"
  auto_accept = false

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-eu-west-1-to-ap-southeast-1"
  })
}

resource "aws_vpc_peering_connection_accepter" "ap_southeast_1_accept_eu_west_1" {
  provider = aws.ap_southeast_1

  vpc_peering_connection_id = aws_vpc_peering_connection.eu_west_1_to_ap_southeast_1.id
  auto_accept               = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-ap-southeast-1-accept-eu-west-1"
  })
}

# Note: Route table associations will be handled by the VPC modules
# VPC peering connections are established but routing is managed separately
# to avoid circular dependencies and data source issues

```

```hcl
output "us_east_1_to_eu_west_1_peering_id" {
  description = "VPC peering connection ID between US East 1 and EU West 1"
  value       = aws_vpc_peering_connection.us_east_1_to_eu_west_1.id
}

output "us_east_1_to_ap_southeast_1_peering_id" {
  description = "VPC peering connection ID between US East 1 and AP Southeast 1"
  value       = aws_vpc_peering_connection.us_east_1_to_ap_southeast_1.id
}

output "eu_west_1_to_ap_southeast_1_peering_id" {
  description = "VPC peering connection ID between EU West 1 and AP Southeast 1"
  value       = aws_vpc_peering_connection.eu_west_1_to_ap_southeast_1.id
}

output "all_peering_connections" {
  description = "All VPC peering connection IDs"
  value = {
    us_east_1_to_eu_west_1      = aws_vpc_peering_connection.us_east_1_to_eu_west_1.id
    us_east_1_to_ap_southeast_1 = aws_vpc_peering_connection.us_east_1_to_ap_southeast_1.id
    eu_west_1_to_ap_southeast_1 = aws_vpc_peering_connection.eu_west_1_to_ap_southeast_1.id
  }
}

```

```hcl
variable "vpc_us_east_1_id" {
  description = "VPC ID for US East 1"
  type        = string
}

variable "vpc_eu_west_1_id" {
  description = "VPC ID for EU West 1"
  type        = string
}

variable "vpc_ap_southeast_1_id" {
  description = "VPC ID for AP Southeast 1"
  type        = string
}

variable "vpc_us_east_1_cidr" {
  description = "CIDR block for US East 1 VPC"
  type        = string
}

variable "vpc_eu_west_1_cidr" {
  description = "CIDR block for EU West 1 VPC"
  type        = string
}

variable "vpc_ap_southeast_1_cidr" {
  description = "CIDR block for AP Southeast 1 VPC"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

```

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 5.0"
      configuration_aliases = [aws.us_east_1, aws.eu_west_1, aws.ap_southeast_1]
    }
  }
}

```
```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

```
```hcl
# Primary AWS provider for general resources
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"

  default_tags {
    tags = local.common_tags
  }
}

locals {
  environment = "dev"
  owner       = "platform-team"

  common_tags = {
    Environment = local.environment
    Owner       = local.owner
    Project     = "multi-region-infrastructure"
    ManagedBy   = "terraform"
  }

  regions = {
    us_east_1      = { name = "us-east-1", cidr = "10.0.0.0/16" }
    eu_west_1      = { name = "eu-west-1", cidr = "10.1.0.0/16" }
    ap_southeast_1 = { name = "ap-southeast-1", cidr = "10.2.0.0/16" }
  }
}

# US East 1 Infrastructure
module "vpc_us_east_1" {
  source = "./modules/vpc"
  providers = {
    aws = aws.us_east_1
  }

  vpc_cidr    = local.regions.us_east_1.cidr
  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "iam_us_east_1" {
  source = "./modules/iam"
  providers = {
    aws = aws.us_east_1
  }

  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "compute_us_east_1" {
  source = "./modules/compute"
  providers = {
    aws = aws.us_east_1
  }

  environment           = local.environment
  region                = local.regions.us_east_1.name
  vpc_id                = module.vpc_us_east_1.vpc_id
  subnet_ids            = module.vpc_us_east_1.private_subnet_ids
  public_subnet_ids     = module.vpc_us_east_1.public_subnet_ids
  security_group_id     = module.vpc_us_east_1.web_security_group_id
  instance_profile_name = module.iam_us_east_1.ec2_instance_profile_name
  common_tags           = local.common_tags
}

module "database_us_east_1" {
  source = "./modules/database"
  providers = {
    aws = aws.us_east_1
  }

  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags

  # Database configuration
  is_primary                 = true
  private_subnet_ids         = module.vpc_us_east_1.private_subnet_ids
  database_security_group_id = module.vpc_us_east_1.database_security_group_id
}

module "logging_us_east_1" {
  source = "./modules/logging"
  providers = {
    aws = aws.us_east_1
  }

  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags
}

# EU West 1 Infrastructure
module "vpc_eu_west_1" {
  source = "./modules/vpc"
  providers = {
    aws = aws.eu_west_1
  }

  vpc_cidr    = local.regions.eu_west_1.cidr
  region      = local.regions.eu_west_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "iam_eu_west_1" {
  source = "./modules/iam"
  providers = {
    aws = aws.eu_west_1
  }

  region      = local.regions.eu_west_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "compute_eu_west_1" {
  source = "./modules/compute"
  providers = {
    aws = aws.eu_west_1
  }

  environment           = local.environment
  region                = local.regions.eu_west_1.name
  vpc_id                = module.vpc_eu_west_1.vpc_id
  subnet_ids            = module.vpc_eu_west_1.private_subnet_ids
  public_subnet_ids     = module.vpc_eu_west_1.public_subnet_ids
  security_group_id     = module.vpc_eu_west_1.web_security_group_id
  instance_profile_name = module.iam_eu_west_1.ec2_instance_profile_name
  common_tags           = local.common_tags
}

module "database_eu_west_1" {
  source = "./modules/database"
  providers = {
    aws = aws.eu_west_1
  }

  region      = local.regions.eu_west_1.name
  environment = local.environment
  common_tags = local.common_tags

  # Database configuration - Read replica
  is_primary                 = false
  private_subnet_ids         = module.vpc_eu_west_1.private_subnet_ids
  database_security_group_id = module.vpc_eu_west_1.database_security_group_id
  source_db_identifier       = null
}

module "logging_eu_west_1" {
  source = "./modules/logging"
  providers = {
    aws = aws.eu_west_1
  }

  region      = local.regions.eu_west_1.name
  environment = local.environment
  common_tags = local.common_tags
}

# AP Southeast 1 Infrastructure
module "vpc_ap_southeast_1" {
  source = "./modules/vpc"
  providers = {
    aws = aws.ap_southeast_1
  }

  vpc_cidr    = local.regions.ap_southeast_1.cidr
  region      = local.regions.ap_southeast_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "iam_ap_southeast_1" {
  source = "./modules/iam"
  providers = {
    aws = aws.ap_southeast_1
  }

  region      = local.regions.ap_southeast_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "compute_ap_southeast_1" {
  source = "./modules/compute"
  providers = {
    aws = aws.ap_southeast_1
  }

  environment           = local.environment
  region                = local.regions.ap_southeast_1.name
  vpc_id                = module.vpc_ap_southeast_1.vpc_id
  subnet_ids            = module.vpc_ap_southeast_1.private_subnet_ids
  public_subnet_ids     = module.vpc_ap_southeast_1.public_subnet_ids
  security_group_id     = module.vpc_ap_southeast_1.web_security_group_id
  instance_profile_name = module.iam_ap_southeast_1.ec2_instance_profile_name
  common_tags           = local.common_tags
}

module "database_ap_southeast_1" {
  source = "./modules/database"
  providers = {
    aws = aws.ap_southeast_1
  }

  region      = local.regions.ap_southeast_1.name
  environment = local.environment
  common_tags = local.common_tags

  # Database configuration - Read replica
  is_primary                 = false
  private_subnet_ids         = module.vpc_ap_southeast_1.private_subnet_ids
  database_security_group_id = module.vpc_ap_southeast_1.database_security_group_id
  source_db_identifier       = null
}

module "logging_ap_southeast_1" {
  source = "./modules/logging"
  providers = {
    aws = aws.ap_southeast_1
  }

  region      = local.regions.ap_southeast_1.name
  environment = local.environment
  common_tags = local.common_tags
}

# VPC Peering Connections
module "vpc_peering" {
  source = "./modules/vpc-peering"
  providers = {
    aws.us_east_1      = aws.us_east_1
    aws.eu_west_1      = aws.eu_west_1
    aws.ap_southeast_1 = aws.ap_southeast_1
  }

  vpc_us_east_1_id      = module.vpc_us_east_1.vpc_id
  vpc_eu_west_1_id      = module.vpc_eu_west_1.vpc_id
  vpc_ap_southeast_1_id = module.vpc_ap_southeast_1.vpc_id

  vpc_us_east_1_cidr      = local.regions.us_east_1.cidr
  vpc_eu_west_1_cidr      = local.regions.eu_west_1.cidr
  vpc_ap_southeast_1_cidr = local.regions.ap_southeast_1.cidr

  environment = local.environment
  common_tags = local.common_tags
}

# Route 53 Multi-Regional DNS - Commented out for now due to zone ID issues
# module "route53" {
#   source = "./modules/route53"
#   providers = {
#     aws.us_east_1      = aws.us_east_1
#     aws.eu_west_1      = aws.eu_west_1
#     aws.ap_southeast_1 = aws.ap_southeast_1
#   }
#   domain_name = "myapp.com" # Replace with your actual domain
#   environment = local.environment
#   common_tags = local.common_tags
#   # Load balancer endpoints
#   us_east_1_lb_dns      = module.compute_us_east_1.load_balancer_dns_name
#   eu_west_1_lb_dns      = module.compute_eu_west_1.load_balancer_dns_name
#   ap_southeast_1_lb_dns = module.compute_ap_southeast_1.load_balancer_dns_name
#   # Health check configurations
#   us_east_1_region      = local.regions.us_east_1.name
#   eu_west_1_region      = local.regions.eu_west_1.name
#   ap_southeast_1_region = local.regions.ap_southeast_1.name
# }

# =============================================================================
# OUTPUTS
# =============================================================================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc_us_east_1.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc_us_east_1.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc_us_east_1.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc_us_east_1.private_subnet_ids
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = module.vpc_us_east_1.internet_gateway_id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = module.vpc_us_east_1.web_security_group_id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = module.vpc_us_east_1.database_security_group_id
}

# IAM Outputs
output "ec2_instance_profile_name" {
  description = "EC2 instance profile name"
  value       = module.iam_us_east_1.ec2_instance_profile_name
}

output "ec2_role_arn" {
  description = "EC2 role ARN"
  value       = module.iam_us_east_1.ec2_role_arn
}

output "rds_monitoring_role_arn" {
  description = "RDS monitoring role ARN"
  value       = module.iam_us_east_1.rds_monitoring_role_arn
}

# Compute Outputs
output "launch_template_id" {
  description = "ID of the launch template"
  value       = module.compute_us_east_1.launch_template_id
}

output "launch_template_name" {
  description = "Name of the launch template"
  value       = module.compute_us_east_1.launch_template_name
}

output "autoscaling_group_id" {
  description = "ID of the autoscaling group"
  value       = module.compute_us_east_1.autoscaling_group_id
}

output "autoscaling_group_name" {
  description = "Name of the autoscaling group"
  value       = module.compute_us_east_1.autoscaling_group_name
}

output "load_balancer_id" {
  description = "ID of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_id
}

output "load_balancer_arn" {
  description = "ARN of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.compute_us_east_1.target_group_arn
}

output "target_group_name" {
  description = "Name of the target group"
  value       = module.compute_us_east_1.target_group_name
}

output "listener_arn" {
  description = "ARN of the load balancer listener"
  value       = module.compute_us_east_1.listener_arn
}

output "ami_id" {
  description = "ID of the Amazon Linux AMI used"
  value       = module.compute_us_east_1.ami_id
}

output "instance_type" {
  description = "Instance type used in the launch template"
  value       = module.compute_us_east_1.instance_type
}

# Database Outputs
output "database_instance_id" {
  description = "ID of the primary database instance"
  value       = module.database_us_east_1.database_instance_id
}

output "database_instance_arn" {
  description = "ARN of the primary database instance"
  value       = module.database_us_east_1.database_instance_arn
}

output "database_endpoint" {
  description = "Endpoint of the primary database instance"
  value       = module.database_us_east_1.database_endpoint
}

output "database_port" {
  description = "Port of the primary database instance"
  value       = module.database_us_east_1.database_port
}

output "database_name" {
  description = "Name of the primary database"
  value       = module.database_us_east_1.database_name
}

output "database_username" {
  description = "Username of the primary database"
  value       = module.database_us_east_1.database_username
}

output "database_identifier" {
  description = "Identifier of the primary database instance"
  value       = module.database_us_east_1.database_identifier
}

output "database_engine_version" {
  description = "Engine version of the database"
  value       = module.database_us_east_1.database_engine_version
}

output "database_instance_class" {
  description = "Instance class of the database"
  value       = module.database_us_east_1.database_instance_class
}

output "database_allocated_storage" {
  description = "Allocated storage of the database"
  value       = module.database_us_east_1.database_allocated_storage
}

output "database_encrypted" {
  description = "Whether the database storage is encrypted"
  value       = module.database_us_east_1.database_encrypted
}

output "subnet_group_id" {
  description = "ID of the database subnet group"
  value       = module.database_us_east_1.subnet_group_id
}

output "subnet_group_name" {
  description = "Name of the database subnet group"
  value       = module.database_us_east_1.subnet_group_name
}

output "parameter_group_id" {
  description = "ID of the database parameter group"
  value       = module.database_us_east_1.parameter_group_id
}

output "parameter_group_name" {
  description = "Name of the database parameter group"
  value       = module.database_us_east_1.parameter_group_name
}

output "ssm_parameter_name" {
  description = "Name of the SSM parameter storing the database password"
  value       = module.database_us_east_1.ssm_parameter_name
}

output "ssm_parameter_arn" {
  description = "ARN of the SSM parameter storing the database password"
  value       = module.database_us_east_1.ssm_parameter_arn
}

# Logging Outputs
output "application_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = module.logging_us_east_1.application_log_group_name
}

output "application_log_group_arn" {
  description = "ARN of the application CloudWatch log group"
  value       = module.logging_us_east_1.application_log_group_arn
}

output "rds_log_group_name" {
  description = "Name of the RDS CloudWatch log group"
  value       = module.logging_us_east_1.rds_log_group_name
}

output "rds_log_group_arn" {
  description = "ARN of the RDS CloudWatch log group"
  value       = module.logging_us_east_1.rds_log_group_arn
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = module.logging_us_east_1.dashboard_name
}

output "dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = module.logging_us_east_1.dashboard_arn
}

output "log_retention_days" {
  description = "Log retention period in days"
  value       = module.logging_us_east_1.log_retention_days
}

# Environment Information
output "environment" {
  description = "Environment name"
  value       = local.environment
}

output "region" {
  description = "Primary region"
  value       = local.regions.us_east_1.name
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# Summary Outputs
# Multi-Regional Infrastructure Outputs
output "eu_west_1_vpc_id" {
  description = "VPC ID for EU West 1"
  value       = module.vpc_eu_west_1.vpc_id
}

output "ap_southeast_1_vpc_id" {
  description = "VPC ID for AP Southeast 1"
  value       = module.vpc_ap_southeast_1.vpc_id
}

output "eu_west_1_load_balancer_dns" {
  description = "Load balancer DNS name for EU West 1"
  value       = module.compute_eu_west_1.load_balancer_dns_name
}

output "ap_southeast_1_load_balancer_dns" {
  description = "Load balancer DNS name for AP Southeast 1"
  value       = module.compute_ap_southeast_1.load_balancer_dns_name
}

output "eu_west_1_database_endpoint" {
  description = "Database endpoint for EU West 1 read replica"
  value       = module.database_eu_west_1.database_endpoint
}

output "ap_southeast_1_database_endpoint" {
  description = "Database endpoint for AP Southeast 1 read replica"
  value       = module.database_ap_southeast_1.database_endpoint
}

# VPC Peering Outputs
output "vpc_peering_connections" {
  description = "All VPC peering connection IDs"
  value       = module.vpc_peering.all_peering_connections
}

# Route 53 Outputs - Disabled for now
# output "route53_hosted_zone_id" {
#   description = "Route 53 hosted zone ID"
#   value       = module.route53.hosted_zone_id
# }
# 
# output "route53_name_servers" {
#   description = "Route 53 name servers"
#   value       = module.route53.hosted_zone_name_servers
# }
# 
# output "route53_primary_dns" {
#   description = "Primary DNS record"
#   value       = module.route53.primary_dns_record
# }
# 
# output "route53_regional_dns" {
#   description = "Regional DNS records"
#   value       = module.route53.regional_dns_records
# }

output "infrastructure_summary" {
  description = "Summary of the deployed infrastructure"
  value = {
    environment = local.environment
    regions = {
      us_east_1 = {
        region            = local.regions.us_east_1.name
        vpc_id            = module.vpc_us_east_1.vpc_id
        vpc_cidr          = module.vpc_us_east_1.vpc_cidr_block
        load_balancer_dns = module.compute_us_east_1.load_balancer_dns_name
        database_endpoint = module.database_us_east_1.database_endpoint
        autoscaling_group = module.compute_us_east_1.autoscaling_group_name
      }
      eu_west_1 = {
        region            = local.regions.eu_west_1.name
        vpc_id            = module.vpc_eu_west_1.vpc_id
        vpc_cidr          = module.vpc_eu_west_1.vpc_cidr_block
        load_balancer_dns = module.compute_eu_west_1.load_balancer_dns_name
        database_endpoint = module.database_eu_west_1.database_endpoint
        autoscaling_group = module.compute_eu_west_1.autoscaling_group_name
      }
      ap_southeast_1 = {
        region            = local.regions.ap_southeast_1.name
        vpc_id            = module.vpc_ap_southeast_1.vpc_id
        vpc_cidr          = module.vpc_ap_southeast_1.vpc_cidr_block
        load_balancer_dns = module.compute_ap_southeast_1.load_balancer_dns_name
        database_endpoint = module.database_ap_southeast_1.database_endpoint
        autoscaling_group = module.compute_ap_southeast_1.autoscaling_group_name
      }
    }
    vpc_peering = module.vpc_peering.all_peering_connections
    route53 = {
      hosted_zone_id = "disabled"
      domain_name    = "myapp.com"
      primary_dns    = "disabled"
      regional_dns = {
        ap_southeast_1 = "disabled"
        eu_west_1      = "disabled"
        us_east_1      = "disabled"
      }
    }
    dashboard_name = module.logging_us_east_1.dashboard_name
  }
}

```