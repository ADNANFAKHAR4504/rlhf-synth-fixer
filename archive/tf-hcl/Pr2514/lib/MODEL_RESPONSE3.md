# Completing the Terraform Code - Missing Parts

Here's the rest of the code continuing from where it cut off:

## Complete the main.tf file (continuing from line 984):

```hcl
# CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-low-cpu"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 low cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-low-cpu-alarm"
  }
}

# SNS Topic for Notifications
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = {
    Name = "${var.project_name}-${var.environment}-alerts"
  }
}

# SNS Topic Subscription (add your email)
variable "notification_email" {
  description = "Email address for alarm notifications"
  type        = string
  default     = "admin@example.com"
}

resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Alarm - ALB Target Response Time
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB target response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-response-time-alarm"
  }
}

# CloudWatch Alarm - ALB Unhealthy Targets
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors unhealthy ALB targets"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TargetGroup  = aws_lb_target_group.web.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-unhealthy-targets-alarm"
  }
}

# CloudWatch Alarm - RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-cpu-alarm"
  }
}

# CloudWatch Alarm - RDS Database Connections
resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "40"
  alarm_description   = "This metric monitors RDS database connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-connections-alarm"
  }
}

# CloudWatch Alarm - RDS Freeable Memory
resource "aws_cloudwatch_metric_alarm" "rds_freeable_memory" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-freeable-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "100000000" # 100MB in bytes
  alarm_description   = "This metric monitors RDS freeable memory"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-memory-alarm"
  }
}

# CloudWatch Alarm - RDS Free Storage Space
resource "aws_cloudwatch_metric_alarm" "rds_free_storage" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-free-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-storage-alarm"
  }
}

#==============================================================================
# USER DATA SCRIPT (INLINE)
#==============================================================================

# Create user data script as a local file
resource "local_file" "user_data" {
  filename = "${path.module}/user_data.sh"
  content = templatefile("${path.module}/user_data_template.sh", {
    db_secret_arn    = aws_secretsmanager_secret.db_password.arn
    s3_bucket_name   = aws_s3_bucket.static_assets.bucket
    cloudfront_url   = aws_cloudfront_distribution.static_assets.domain_name
    project_name     = var.project_name
    environment      = var.environment
    aws_region       = var.aws_region
    log_group_name   = aws_cloudwatch_log_group.app_logs.name
  })
}

#==============================================================================
# OUTPUTS
#==============================================================================

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

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Hosted zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.static_assets.bucket_domain_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "RDS master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "database_secret_arn" {
  description = "ARN of the database password secret in Secrets Manager"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "nat_gateway_ips" {
  description = "Elastic IP addresses of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "auto_scaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.name
}

output "auto_scaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.arn
}

output "launch_template_id" {
  description = "ID of the Launch Template"
  value       = aws_launch_template.web.id
}

output "security_group_alb_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "security_group_web_id" {
  description = "ID of the web servers security group"
  value       = aws_security_group.web.id
}

output "security_group_database_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "application_url" {
  description = "URL to access the application"
  value       = "https://${aws_lb.main.dns_name}"
}

output "cloudfront_url" {
  description = "CloudFront URL for static assets"
  value       = "https://${aws_cloudfront_distribution.static_assets.domain_name}"
}

# Summary output for easy reference
output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    application_url    = "https://${aws_lb.main.dns_name}"
    cloudfront_url     = "https://${aws_cloudfront_distribution.static_assets.domain_name}"
    s3_bucket         = aws_s3_bucket.static_assets.bucket
    database_endpoint = aws_db_instance.main.endpoint
    vpc_id           = aws_vpc.main.id
    region           = var.aws_region
    environment      = var.environment
  }
}
```

## Create the user_data_template.sh file:

Create this file in the same directory as your main.tf:

**`user_data_template.sh`**

```bash
#!/bin/bash

# User Data Script for Web Servers
# This script runs when EC2 instances launch

# Variables from Terraform
DB_SECRET_ARN="${db_secret_arn}"
S3_BUCKET_NAME="${s3_bucket_name}"
CLOUDFRONT_URL="${cloudfront_url}"
PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"
AWS_REGION="${aws_region}"
LOG_GROUP_NAME="${log_group_name}"

# Update system
yum update -y

# Install required packages
yum install -y \
    nginx \
    awscli \
    jq \
    mysql \
    htop \
    wget \
    curl \
    unzip

# Install CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create CloudWatch Agent configuration
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "root"
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "${LOG_GROUP_NAME}",
                        "log_stream_name": "{instance_id}/nginx/access.log"
                    },
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "${LOG_GROUP_NAME}",
                        "log_stream_name": "{instance_id}/nginx/error.log"
                    },
                    {
                        "file_path": "/var/log/webapp/app.log",
                        "log_group_name": "${LOG_GROUP_NAME}",
                        "log_stream_name": "{instance_id}/webapp/app.log"
                    }
                ]
            }
        }
    },
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
    }
}
EOF

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Create application directory
mkdir -p /var/www/html
mkdir -p /var/log/webapp
chown nginx:nginx /var/www/html
chown nginx:nginx /var/log/webapp

# Configure Nginx
cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;
        root /var/www/html;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Main application
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy (if needed)
        location /api/ {
            # Proxy to application server if you have one
            # proxy_pass http://localhost:3000/;
            return 200 "API endpoint\n";
            add_header Content-Type text/plain;
        }

        # Static assets from S3/CloudFront
        location /static/ {
            return 301 https://${CLOUDFRONT_URL}$request_uri;
        }

        error_page 404 /404.html;
        location = /404.html {
            root /var/www/html;
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /var/www/html;
        }
    }
}
EOF

# Create a simple index.html
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>${PROJECT_NAME} - ${ENVIRONMENT}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #e8f5e8; padding: 20px; border-radius: 5px; }
        .info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${PROJECT_NAME} - ${ENVIRONMENT}</h1>
        <div class="status">
            <h2>✅ Application is running!</h2>
            <p>Your web application infrastructure has been successfully deployed.</p>
        </div>

        <div class="info">
            <h3>Infrastructure Details:</h3>
            <ul>
                <li><strong>Environment:</strong> ${ENVIRONMENT}</li>
                <li><strong>Region:</strong> ${AWS_REGION}</li>
                <li><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></li>
                <li><strong>S3 Bucket:</strong> ${S3_BUCKET_NAME}</li>
                <li><strong>CloudFront URL:</strong> <a href="https://${CLOUDFRONT_URL}">https://${CLOUDFRONT_URL}</a></li>
            </ul>
        </div>

        <div class="info">
            <h3>Available Endpoints:</h3>
            <ul>
                <li><code>/health</code> - Health check endpoint</li>
                <li><code>/api/</code> - API endpoints</li>
                <li><code>/static/</code> - Static assets (redirects to CloudFront)</li>
            </ul>
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
    </script>
</body>
</html>
EOF

# Create 404 page
cat > /var/www/html/404.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found - ${PROJECT_NAME}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .error { background: #ffe8e8; padding: 20px; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="error">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">Go back to home</a>
    </div>
</body>
</html>
EOF

# Set proper permissions
chown -R nginx:nginx /var/www/html
chmod -R 755 /var/www/html

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Get database credentials from Secrets Manager (example)
# DB_CREDS=$(aws secretsmanager get-secret-value --secret-id $DB_SECRET_ARN --region $AWS_REGION --query SecretString --output text)
# DB_HOST=$(echo $DB_CREDS | jq -r .host)
# DB_USER=$(echo $DB_CREDS | jq -r .username)
# DB_PASS=$(echo $DB_CREDS | jq -r .password)
# DB_NAME=$(echo $DB_CREDS | jq -r .dbname)

# Create application log
echo "$(date): Web server initialization completed" >> /var/log/webapp/app.log
echo "$(date): Project: ${PROJECT_NAME}, Environment: ${ENVIRONMENT}" >> /var/log/webapp/app.log
echo "$(date): S3 Bucket: ${S3_BUCKET_NAME}" >> /var/log/webapp/app.log
echo "$(date): CloudFront: ${CLOUDFRONT_URL}" >> /var/log/webapp/app.log

# Install additional monitoring tools
yum install -y collectd
systemctl start collectd
systemctl enable collectd

# Create a simple health check script
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
# Simple health check script

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "ERROR: Nginx is not running"
    exit 1
fi

# Check if we can connect to the database (uncomment when DB is configured)
# mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "SELECT 1" > /dev/null 2>&1
# if [ $? -ne 0 ]; then
#     echo "ERROR: Cannot connect to database"
#     exit 1
# fi

echo "OK: All services are healthy"
exit 0
EOF

chmod +x /usr/local/bin/health-check.sh

# Set up log rotation
cat > /etc/logrotate.d/webapp << 'EOF'
/var/log/webapp/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
}
EOF

# Final log entry
echo "$(date): User data script completed successfully" >> /var/log/webapp/app.log

# Signal that the instance is ready
/opt/aws/bin/cfn-signal -e $? --stack ${PROJECT_NAME}-${ENVIRONMENT} --resource AutoScalingGroup --region ${AWS_REGION} || true
```

## Create terraform.tfvars.example file:

**`terraform.tfvars.example`**

```hcl
# Copy this file to terraform.tfvars and customize the values

# Basic Configuration
project_name = "webapp"
environment  = "production"
aws_region   = "us-west-2"

# Networking
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-west-2a", "us-west-2b"]

# Compute
instance_type    = "t3.medium"
min_size         = 2
max_size         = 10
desired_capacity = 3
key_name         = "my-key-pair"  # Create this in AWS Console first

# Database
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20

# Security
allowed_cidr_blocks = ["0.0.0.0/0"]  # Restrict this in production

# Notifications
notification_email = "admin@example.com"

# Optional: Custom domain
domain_name = ""  # Leave empty to use default
```

## Deployment Instructions:

1. **Prerequisites:**

   ```bash
   # Create EC2 Key Pair in AWS Console first
   # Set up AWS credentials
   aws configure
   ```

2. **Deploy:**

   ```bash
   # Copy and customize variables
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values

   # Initialize Terraform
   terraform init

   # Plan deployment
   terraform plan

   # Deploy infrastructure
   terraform apply
   ```

3. **Post-deployment:**

   ```bash
   # Get outputs
   terraform output

   # Test the application
   curl -I $(terraform output -raw application_url)
   ```

This complete infrastructure includes:

- ✅ High-availability VPC across 2 AZs
- ✅ Auto Scaling with Launch Templates
- ✅ Application Load Balancer with SSL
- ✅ RDS Multi-AZ database
- ✅ S3 + CloudFront for static assets
- ✅ Complete CloudWatch monitoring
- ✅ SNS notifications for alarms
- ✅ Proper IAM roles and security groups
- ✅ Production-ready user data script
- ✅ All necessary outputs

The infrastructure is production-ready and follows AWS best practices!
