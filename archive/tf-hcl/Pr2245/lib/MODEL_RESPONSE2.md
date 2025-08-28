```hcl
# terraform/cloudwatch.tf

# CloudWatch Log Groups for Application Logs
resource "aws_cloudwatch_log_group" "application" {
  for_each          = toset(var.regions)
  provider          = aws.region[each.key]
  name              = "/aws/ec2/${var.application_name}-${each.key}"
  retention_in_days = 14

  tags = {
    Name        = "${var.application_name}-log-group-${each.key}"
    Environment = var.environment
    Region      = each.key
  }
}

# CloudWatch Log Groups for Load Balancer Access Logs
resource "aws_cloudwatch_log_group" "alb_access_logs" {
  for_each          = toset(var.regions)
  provider          = aws.region[each.key]
  name              = "/aws/applicationloadbalancer/${var.application_name}-alb-${each.key}"
  retention_in_days = 7

  tags = {
    Name        = "${var.application_name}-alb-logs-${each.key}"
    Environment = var.environment
    Region      = each.key
  }
}

# Enhanced CPU Utilization Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  alarm_name          = "${var.application_name}-cpu-high-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization - Scale Up"
  alarm_actions       = [aws_autoscaling_policy.scale_up[each.key].arn]
  ok_actions          = []
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web[each.key].name
  }

  tags = {
    Name        = "${var.application_name}-cpu-high-alarm-${each.key}"
    Environment = var.environment
    Type        = "ScaleUp"
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  alarm_name          = "${var.application_name}-cpu-low-${each.key}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This metric monitors EC2 CPU utilization - Scale Down"
  alarm_actions       = [aws_autoscaling_policy.scale_down[each.key].arn]
  ok_actions          = []
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web[each.key].name
  }

  tags = {
    Name        = "${var.application_name}-cpu-low-alarm-${each.key}"
    Environment = var.environment
    Type        = "ScaleDown"
  }
}

# Memory Utilization Alarms (requires CloudWatch agent)
resource "aws_cloudwatch_metric_alarm" "memory_high" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  alarm_name          = "${var.application_name}-memory-high-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "CWAgent"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors EC2 memory utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web[each.key].name
  }

  tags = {
    Name        = "${var.application_name}-memory-high-alarm-${each.key}"
    Environment = var.environment
    Type        = "Memory"
  }
}

# Application Load Balancer Metrics
resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  alarm_name          = "${var.application_name}-alb-response-time-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "ALB target response time is too high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main[each.key].arn_suffix
  }

  tags = {
    Name        = "${var.application_name}-alb-response-time-${each.key}"
    Environment = var.environment
    Type        = "Performance"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_healthy_host_count" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  alarm_name          = "${var.application_name}-alb-healthy-hosts-${each.key}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "ALB has insufficient healthy targets"
  treat_missing_data  = "breaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.web[each.key].arn_suffix
    LoadBalancer = aws_lb.main[each.key].arn_suffix
  }

  tags = {
    Name        = "${var.application_name}-alb-healthy-hosts-${each.key}"
    Environment = var.environment
    Type        = "Health"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_http_5xx_count" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  alarm_name          = "${var.application_name}-alb-5xx-errors-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "ALB is returning too many 5XX errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main[each.key].arn_suffix
  }

  tags = {
    Name        = "${var.application_name}-alb-5xx-errors-${each.key}"
    Environment = var.environment
    Type        = "Error"
  }
}

# RDS CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  alarm_name          = "${var.application_name}-rds-cpu-high-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "RDS CPU utilization is too high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main[each.key].id
  }

  tags = {
    Name        = "${var.application_name}-rds-cpu-high-${each.key}"
    Environment = var.environment
    Type        = "Database"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_free_storage_space" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  alarm_name          = "${var.application_name}-rds-free-storage-${each.key}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB in bytes
  alarm_description   = "RDS free storage space is running low"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main[each.key].id
  }

  tags = {
    Name        = "${var.application_name}-rds-free-storage-${each.key}"
    Environment = var.environment
    Type        = "Database"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_database_connections" {
  for_each            = toset(var.regions)
  provider            = aws.region[each.key]
  alarm_name          = "${var.application_name}-rds-connections-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "40"
  alarm_description   = "RDS has too many database connections"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main[each.key].id
  }

  tags = {
    Name        = "${var.application_name}-rds-connections-${each.key}"
    Environment = var.environment
    Type        = "Database"
  }
}

# Custom CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  for_each       = toset(var.regions)
  provider       = aws.region[each.key]
  dashboard_name = "${var.application_name}-dashboard-${each.key}"

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
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", aws_autoscaling_group.web[each.key].name],
            ["CWAgent", "MemoryUtilization", "AutoScalingGroupName", aws_autoscaling_group.web[each.key].name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = each.key
          title   = "EC2 Instance Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main[each.key].arn_suffix],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_ELB_5XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = each.key
          title   = "Application Load Balancer Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main[each.key].id],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeStorageSpace", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = each.key
          title   = "RDS Database Metrics"
          period  = 300
        }
      }
    ]
  })

  tags = {
    Name        = "${var.application_name}-dashboard-${each.key}"
    Environment = var.environment
  }
}
```
```hcl
# terraform/subnet_groups.tf

# Database Subnet Groups with detailed configuration
resource "aws_db_subnet_group" "main" {
  for_each   = toset(var.regions)
  provider   = aws.region[each.key]
  name       = "${var.application_name}-db-subnet-group-${replace(each.key, "-", "")}"
  description = "Database subnet group for ${var.application_name} in ${each.key}"
  
  subnet_ids = [
    for subnet in aws_subnet.private : subnet.id
    if startswith(subnet.tags.Name, "${var.application_name}-private-${each.key}")
  ]

  tags = {
    Name        = "${var.application_name}-db-subnet-group-${each.key}"
    Environment = var.environment
    Region      = each.key
    Purpose     = "Database"
  }
}

# ElastiCache Subnet Groups (for caching layer)
resource "aws_elasticache_subnet_group" "main" {
  for_each   = toset(var.regions)
  provider   = aws.region[each.key]
  name       = "${var.application_name}-cache-subnet-group-${replace(each.key, "-", "")}"
  description = "ElastiCache subnet group for ${var.application_name} in ${each.key}"
  
  subnet_ids = [
    for subnet in aws_subnet.private : subnet.id
    if startswith(subnet.tags.Name, "${var.application_name}-private-${each.key}")
  ]

  tags = {
    Name        = "${var.application_name}-cache-subnet-group-${each.key}"
    Environment = var.environment
    Region      = each.key
    Purpose     = "Cache"
  }
}

# Additional Private Subnets for better AZ distribution
resource "aws_subnet" "private_additional" {
  for_each = {
    for idx, region in var.regions : "${region}-additional" => {
      region = region
      az_idx = 2 # Third AZ
      cidr   = region == var.regions[0] ? "10.0.20.0/24" : "10.1.20.0/24"
    }
  }
  
  provider          = aws.region[each.value.region]
  vpc_id            = aws_vpc.main[each.value.region].id
  cidr_block        = each.value.cidr
  availability_zone = length(data.aws_availability_zones.available[each.value.region].names) > 2 ? data.aws_availability_zones.available[each.value.region].names[each.value.az_idx] : data.aws_availability_zones.available[each.value.region].names[0]

  tags = {
    Name        = "${var.application_name}-private-additional-${each.value.region}"
    Environment = var.environment
    Type        = "Private"
    Purpose     = "Database/Cache"
  }
}

# NAT Gateway Subnets (for private subnet internet access)
resource "aws_subnet" "nat" {
  for_each = {
    for idx, region in var.regions : "${region}-nat" => {
      region = region
      az_idx = 0
      cidr   = region == var.regions[0] ? "10.0.30.0/24" : "10.1.30.0/24"
    }
  }
  
  provider                = aws.region[each.value.region]
  vpc_id                  = aws_vpc.main[each.value.region].id
  cidr_block              = each.value.cidr
  availability_zone       = data.aws_availability_zones.available[each.value.region].names[each.value.az_idx]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.application_name}-nat-${each.value.region}"
    Environment = var.environment
    Type        = "Public"
    Purpose     = "NAT Gateway"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  for_each = toset(var.regions)
  provider = aws.region[each.key]
  domain   = "vpc"

  tags = {
    Name        = "${var.application_name}-nat-eip-${each.key}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  for_each      = toset(var.regions)
  provider      = aws.region[each.key]
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.nat["${each.key}-nat"].id

  tags = {
    Name        = "${var.application_name}-nat-gateway-${each.key}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# Private Route Tables
resource "aws_route_table" "private" {
  for_each = toset(var.regions)
  provider = aws.region[each.key]
  vpc_id   = aws_vpc.main[each.key].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[each.key].id
  }

  tags = {
    Name        = "${var.application_name}-private-rt-${each.key}"
    Environment = var.environment
  }
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  for_each = merge(
    {
      for k, v in aws_subnet.private : k => {
        subnet_id      = v.id
        route_table_id = aws_route_table.private[split("-", k)[0]].id
        region         = split("-", k)[0]
      }
    },
    {
      for k, v in aws_subnet.private_additional : k => {
        subnet_id      = v.id
        route_table_id = aws_route_table.private[split("-", k)[0]].id
        region         = split("-", k)[0]
      }
    }
  )
  
  provider       = aws.region[each.value.region]
  subnet_id      = each.value.subnet_id
  route_table_id = each.value.route_table_id
}

# NAT Route Table Associations
resource "aws_route_table_association" "nat" {
  for_each = aws_subnet.nat
  provider = aws.region[split("-", each.key)[0]]
  
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public[split("-", each.key)[0]].id
}
```
```hcl
# terraform/outputs.tf (additional outputs for monitoring)

output "cloudwatch_dashboards" {
  description = "CloudWatch Dashboard URLs"
  value = {
    for region in var.regions : region => "https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${aws_cloudwatch_dashboard.main[region].dashboard_name}"
  }
}

output "cloudwatch_alarms" {
  description = "CloudWatch Alarms by region and type"
  value = {
    for region in var.regions : region => {
      cpu_high = {
        name = aws_cloudwatch_metric_alarm.cpu_high[region].alarm_name
        arn  = aws_cloudwatch_metric_alarm.cpu_high[region].arn
      }
      cpu_low = {
        name = aws_cloudwatch_metric_alarm.cpu_low[region].alarm_name
        arn  = aws_cloudwatch_metric_alarm.cpu_low[region].arn
      }
      memory_high = {
        name = aws_cloudwatch_metric_alarm.memory_high[region].alarm_name
        arn  = aws_cloudwatch_metric_alarm.memory_high[region].arn
      }
      alb_response_time = {
        name = aws_cloudwatch_metric_alarm.alb_target_response_time[region].alarm_name
        arn  = aws_cloudwatch_metric_alarm.alb_target_response_time[region].arn
      }
      alb_healthy_hosts = {
        name = aws_cloudwatch_metric_alarm.alb_healthy_host_count[region].alarm_name
        arn  = aws_cloudwatch_metric_alarm.alb_healthy_host_count[region].arn
      }
      alb_5xx_errors = {
        name = aws_cloudwatch_metric_alarm.alb_http_5xx_count[region].alarm_name
        arn  = aws_cloudwatch_metric_alarm.alb_http_5xx_count[region].arn
      }
      rds_cpu = {
        name = aws_cloudwatch_metric_alarm.rds_cpu_high[region].alarm_name
        arn  = aws_cloudwatch_metric_alarm.rds_cpu_high[region].arn
      }
      rds_storage = {
        name = aws_cloudwatch_metric_alarm.rds_free_storage_space[region].alarm_name
        arn  = aws_cloudwatch_metric_alarm.rds_free_storage_space[region].arn
      }
      rds_connections = {
        name = aws_cloudwatch_metric_alarm.rds_database_connections[region].alarm_name
        arn  = aws_cloudwatch_metric_alarm.rds_database_connections[region].arn
      }
    }
  }
}

output "subnet_groups" {
  description = "Database and Cache subnet groups"
  value = {
    for region in var.regions : region => {
      database = {
        name       = aws_db_subnet_group.main[region].name
        id         = aws_db_subnet_group.main[region].id
        subnet_ids = aws_db_subnet_group.main[region].subnet_ids
      }
      cache = {
        name       = aws_elasticache_subnet_group.main[region].name
        subnet_ids = aws_elasticache_subnet_group.main[region].subnet_ids
      }
    }
  }
}

output "subnet_details" {
  description = "Detailed subnet information"
  value = {
    for region in var.regions : region => {
      public = {
        for k, v in aws_subnet.public : k => {
          id                = v.id
          cidr_block        = v.cidr_block
          availability_zone = v.availability_zone
        } if startswith(k, region)
      }
      private = merge(
        {
          for k, v in aws_subnet.private : k => {
            id                = v.id
            cidr_block        = v.cidr_block
            availability_zone = v.availability_zone
          } if startswith(k, region)
        },
        {
          for k, v in aws_subnet.private_additional : k => {
            id                = v.id
            cidr_block        = v.cidr_block
            availability_zone = v.availability_zone
          } if startswith(k, region)
        }
      )
      nat = {
        for k, v in aws_subnet.nat : k => {
          id                = v.id
          cidr_block        = v.cidr_block
          availability_zone = v.availability_zone
        } if startswith(k, region)
      }
    }
  }
}

output "nat_gateways" {
  description = "NAT Gateway information"
  value = {
    for region in var.regions : region => {
      id         = aws_nat_gateway.main[region].id
      public_ip  = aws_eip.nat[region].public_ip
      private_ip = aws_nat_gateway.main[region].private_ip
      subnet_id  = aws_nat_gateway.main[region].subnet_id
    }
  }
}

output "log_groups" {
  description = "CloudWatch Log Groups"
  value = {
    for region in var.regions : region => {
      application = {
        name = aws_cloudwatch_log_group.application[region].name
        arn  = aws_cloudwatch_log_group.application[region].arn
      }
      alb_access = {
        name = aws_cloudwatch_log_group.alb_access_logs[region].name
        arn  = aws_cloudwatch_log_group.alb_access_logs[region].arn
      }
    }
  }
}
```
```bash
#!/bin/bash
# terraform/user_data_enhanced.sh

yum update -y
yum install -y httpd amazon-cloudwatch-agent

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
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
                "metrics_collection_interval": 60,
                "totalcpu": false
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
            },
            "netstat": {
                "measurement": [
                    "tcp_established",
                    "tcp_time_wait"
                ],
                "metrics_collection_interval": 60
            },
            "swap": {
                "measurement": [
                    "swap_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/${var.application_name}-${region}",
                        "log_stream_name": "{instance_id}/httpd/access_log"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/${var.application_name}-${region}",
                        "log_stream_name": "{instance_id}/httpd/error_log"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create enhanced web page with metrics endpoint
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Region Web App - ${region}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .region { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
        .status { color: #28a745; font-weight: bold; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="region">
            <h1>🌐 Multi-Region Web Application</h1>
            <h2>Region: ${region}</h2>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <h3>📍 Instance Details</h3>
                <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
                <p><strong>Availability Zone:</strong> <span id="az">Loading...</span></p>
                <p><strong>Instance Type:</strong> <span id="instance-type">Loading...</span></p>
            </div>
            
            <div class="metric-card">
                <h3>🔍 Health Status</h3>
                <p><strong>Status:</strong> <span class="status">✓ Healthy</span></p>
                <p><strong>Uptime:</strong> <span id="uptime">Loading...</span></p>
                <p><strong>Load Average:</strong> <span id="load">Loading...</span></p>
            </div>
            
            <div class="metric-card">
                <h3>🕒 Timestamp</h3>
                <p class="timestamp" id="timestamp">Loading...</p>
            </div>
            
            <div class="metric-card">
                <h3>📊 Quick Metrics</h3>
                <p><strong>Memory Usage:</strong> <span id="memory">Loading...</span></p>
```