```hcl
# Continuing from where we left off...

# Secrets Manager Outputs (continued)
output "primary_db_secret_arn" {
  description = "ARN of the primary database credentials secret"
  value       = aws_secretsmanager_secret.primary_db_credentials.arn
}

output "secondary_db_secret_arn" {
  description = "ARN of the secondary database credentials secret"
  value       = aws_secretsmanager_secret.secondary_db_credentials.arn
}

output "primary_db_secret_name" {
  description = "Name of the primary database credentials secret"
  value       = aws_secretsmanager_secret.primary_db_credentials.name
}

output "secondary_db_secret_name" {
  description = "Name of the secondary database credentials secret"
  value       = aws_secretsmanager_secret.secondary_db_credentials.name
}

# Launch Template Outputs
output "primary_launch_template_id" {
  description = "ID of the primary region launch template"
  value       = aws_launch_template.primary.id
}

output "secondary_launch_template_id" {
  description = "ID of the secondary region launch template"
  value       = aws_launch_template.secondary.id
}

output "primary_launch_template_name" {
  description = "Name of the primary region launch template"
  value       = aws_launch_template.primary.name
}

output "secondary_launch_template_name" {
  description = "Name of the secondary region launch template"
  value       = aws_launch_template.secondary.name
}

output "primary_launch_template_latest_version" {
  description = "Latest version of the primary region launch template"
  value       = aws_launch_template.primary.latest_version
}

output "secondary_launch_template_latest_version" {
  description = "Latest version of the secondary region launch template"
  value       = aws_launch_template.secondary.latest_version
}

# Load Balancer Outputs
output "primary_alb_arn" {
  description = "ARN of the primary region Application Load Balancer"
  value       = aws_lb.primary.arn
}

output "secondary_alb_arn" {
  description = "ARN of the secondary region Application Load Balancer"
  value       = aws_lb.secondary.arn
}

output "primary_alb_dns_name" {
  description = "DNS name of the primary region Application Load Balancer"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary region Application Load Balancer"
  value       = aws_lb.secondary.dns_name
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary region Application Load Balancer"
  value       = aws_lb.primary.zone_id
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary region Application Load Balancer"
  value       = aws_lb.secondary.zone_id
}

# Target Group Outputs
output "primary_target_group_arn" {
  description = "ARN of the primary region target group"
  value       = aws_lb_target_group.primary.arn
}

output "secondary_target_group_arn" {
  description = "ARN of the secondary region target group"
  value       = aws_lb_target_group.secondary.arn
}

output "primary_target_group_name" {
  description = "Name of the primary region target group"
  value       = aws_lb_target_group.primary.name
}

output "secondary_target_group_name" {
  description = "Name of the secondary region target group"
  value       = aws_lb_target_group.secondary.name
}

# Load Balancer Listener Outputs
output "primary_alb_listener_arn" {
  description = "ARN of the primary region ALB listener"
  value       = aws_lb_listener.primary.arn
}

output "secondary_alb_listener_arn" {
  description = "ARN of the secondary region ALB listener"
  value       = aws_lb_listener.secondary.arn
}

# Auto Scaling Group Outputs
output "primary_asg_arn" {
  description = "ARN of the primary region Auto Scaling Group"
  value       = aws_autoscaling_group.primary.arn
}

output "secondary_asg_arn" {
  description = "ARN of the secondary region Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.arn
}

output "primary_asg_name" {
  description = "Name of the primary region Auto Scaling Group"
  value       = aws_autoscaling_group.primary.name
}

output "secondary_asg_name" {
  description = "Name of the secondary region Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.name
}

output "primary_asg_min_size" {
  description = "Minimum size of the primary region Auto Scaling Group"
  value       = aws_autoscaling_group.primary.min_size
}

output "secondary_asg_min_size" {
  description = "Minimum size of the secondary region Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.min_size
}

output "primary_asg_max_size" {
  description = "Maximum size of the primary region Auto Scaling Group"
  value       = aws_autoscaling_group.primary.max_size
}

output "secondary_asg_max_size" {
  description = "Maximum size of the secondary region Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.max_size
}

output "primary_asg_desired_capacity" {
  description = "Desired capacity of the primary region Auto Scaling Group"
  value       = aws_autoscaling_group.primary.desired_capacity
}

output "secondary_asg_desired_capacity" {
  description = "Desired capacity of the secondary region Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.desired_capacity
}

# Auto Scaling Policy Outputs
output "primary_scale_up_policy_arn" {
  description = "ARN of the primary region scale up policy"
  value       = aws_autoscaling_policy.primary_scale_up.arn
}

output "secondary_scale_up_policy_arn" {
  description = "ARN of the secondary region scale up policy"
  value       = aws_autoscaling_policy.secondary_scale_up.arn
}

output "primary_scale_down_policy_arn" {
  description = "ARN of the primary region scale down policy"
  value       = aws_autoscaling_policy.primary_scale_down.arn
}

output "secondary_scale_down_policy_arn" {
  description = "ARN of the secondary region scale down policy"
  value       = aws_autoscaling_policy.secondary_scale_down.arn
}

# CloudWatch Alarm Outputs
output "primary_cpu_alarm_arn" {
  description = "ARN of the primary region CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu_high.arn
}

output "secondary_cpu_alarm_arn" {
  description = "ARN of the secondary region CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu_high.arn
}

output "primary_rds_cpu_alarm_arn" {
  description = "ARN of the primary region RDS CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu.arn
}

output "secondary_rds_cpu_alarm_arn" {
  description = "ARN of the secondary region RDS CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_cpu.arn
}

output "primary_cpu_alarm_name" {
  description = "Name of the primary region CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu_high.alarm_name
}

output "secondary_cpu_alarm_name" {
  description = "Name of the secondary region CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu_high.alarm_name
}

output "primary_rds_cpu_alarm_name" {
  description = "Name of the primary region RDS CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu.alarm_name
}

output "secondary_rds_cpu_alarm_name" {
  description = "Name of the secondary region RDS CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_cpu.alarm_name
}

# AWS Config Outputs
output "primary_config_recorder_name" {
  description = "Name of the primary region Config recorder"
  value       = aws_config_configuration_recorder.primary.name
}

output "secondary_config_recorder_name" {
  description = "Name of the secondary region Config recorder"
  value       = aws_config_configuration_recorder.secondary.name
}

output "primary_config_delivery_channel_name" {
  description = "Name of the primary region Config delivery channel"
  value       = aws_config_delivery_channel.primary.name
}

output "secondary_config_delivery_channel_name" {
  description = "Name of the secondary region Config delivery channel"
  value       = aws_config_delivery_channel.secondary.name
}

# Route Table Outputs
output "primary_public_route_table_id" {
  description = "ID of the primary region public route table"
  value       = aws_route_table.primary_public.id
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary region public route table"
  value       = aws_route_table.secondary_public.id
}

output "primary_private_route_table_ids" {
  description = "IDs of the primary region private route tables"
  value       = aws_route_table.primary_private[*].id
}

output "secondary_private_route_table_ids" {
  description = "IDs of the secondary region private route tables"
  value       = aws_route_table.secondary_private[*].id
}

# Elastic IP Outputs
output "primary_nat_eip_ids" {
  description = "IDs of the primary region NAT gateway Elastic IPs"
  value       = aws_eip.primary_nat[*].id
}

output "secondary_nat_eip_ids" {
  description = "IDs of the secondary region NAT gateway Elastic IPs"
  value       = aws_eip.secondary_nat[*].id
}

output "primary_nat_eip_public_ips" {
  description = "Public IPs of the primary region NAT gateway Elastic IPs"
  value       = aws_eip.primary_nat[*].public_ip
}

output "secondary_nat_eip_public_ips" {
  description = "Public IPs of the secondary region NAT gateway Elastic IPs"
  value       = aws_eip.secondary_nat[*].public_ip
}

# Availability Zone Outputs
output "primary_availability_zones" {
  description = "Availability zones used in primary region"
  value       = data.aws_availability_zones.primary.names
}

output "secondary_availability_zones" {
  description = "Availability zones used in secondary region"
  value       = data.aws_availability_zones.secondary.names
}

# Random Resource Outputs (non-sensitive)
output "bucket_suffix" {
  description = "Random suffix used for S3 bucket names"
  value       = random_string.bucket_suffix.result
}

# Region Outputs
output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}

# Project Information Outputs
output "project_name" {
  description = "Project name used for resource naming"
  value       = local.project_name
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# Network CIDR Outputs
output "primary_public_subnet_cidrs" {
  description = "CIDR blocks of primary region public subnets"
  value       = local.primary_public_subnet_cidrs
}

output "primary_private_subnet_cidrs" {
  description = "CIDR blocks of primary region private subnets"
  value       = local.primary_private_subnet_cidrs
}

output "secondary_public_subnet_cidrs" {
  description = "CIDR blocks of secondary region public subnets"
  value       = local.secondary_public_subnet_cidrs
}

output "secondary_private_subnet_cidrs" {
  description = "CIDR blocks of secondary region private subnets"
  value       = local.secondary_private_subnet_cidrs
}

# S3 Replication Configuration Outputs
output "s3_replication_configuration_id" {
  description = "ID of the S3 replication configuration"
  value       = aws_s3_bucket_replication_configuration.primary_to_secondary.id
}

output "s3_replication_role_name" {
  description = "Name of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication.name
}

# Database Information Outputs (non-sensitive)
output "primary_db_name" {
  description = "Name of the primary database"
  value       = aws_db_instance.primary.db_name
}

output "secondary_db_name" {
  description = "Name of the secondary database"
  value       = aws_db_instance.secondary.db_name
}

output "primary_db_port" {
  description = "Port of the primary database"
  value       = aws_db_instance.primary.port
}

output "secondary_db_port" {
  description = "Port of the secondary database"
  value       = aws_db_instance.secondary.port
}

output "primary_db_engine" {
  description = "Engine of the primary database"
  value       = aws_db_instance.primary.engine
}

output "secondary_db_engine" {
  description = "Engine of the secondary database"
  value       = aws_db_instance.secondary.engine
}

output "primary_db_engine_version" {
  description = "Engine version of the primary database"
  value       = aws_db_instance.primary.engine_version
}

output "secondary_db_engine_version" {
  description = "Engine version of the secondary database"
  value       = aws_db_instance.secondary.engine_version
}

# Instance Configuration Outputs
output "instance_type" {
  description = "EC2 instance type used"
  value       = var.instance_type
}

output "db_instance_class" {
  description = "RDS instance class used"
  value       = var.db_instance_class
}

# Security Configuration Outputs
output "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  value       = var.allowed_ssh_cidr
}

output "allowed_https_cidrs" {
  description = "CIDR blocks allowed for HTTPS access"
  value       = var.allowed_https_cidr
}

# ============================================================================
# USER DATA SCRIPT (Create this as a separate file: user_data.sh)
# ============================================================================

# Note: Create a separate file named 'user_data.sh' in the same directory with the following content:
/*
#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create a simple web page
echo "<h1>Hello from ${region}</h1>" > /var/www/html/index.html
echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html

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
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
*/

# ============================================================================
# SUMMARY COMMENTS
# ============================================================================

/*
This Terraform configuration creates a comprehensive multi-region infrastructure with the following components:

PRIMARY REGION (us-east-2):
- VPC with CIDR 10.0.0.0/16
- 2 public subnets (10.0.1.0/24, 10.0.2.0/24)
- 2 private subnets (10.0.10.0/24, 10.0.20.0/24)
- Internet Gateway, 2 NAT Gateways with Elastic IPs
- Route tables and associations
- Security groups for EC2, ALB, and RDS
- RDS MySQL instance with Multi-AZ
- Application Load Balancer
- Auto Scaling Group (min: 2, max: 4)
- Launch Template with Amazon Linux 2
- S3 bucket with versioning and lifecycle policies
- Secrets Manager for RDS credentials
- CloudWatch alarms and Auto Scaling policies
- AWS Config for compliance tracking

SECONDARY REGION (us-west-1):
- VPC with CIDR 10.1.0.0/16
- 2 public subnets (10.1.1.0/24, 10.1.2.0/24)
- 2 private subnets (10.1.10.0/24, 10.1.20.0/24)
- Internet Gateway, 2 NAT Gateways with Elastic IPs
- Route tables and associations
- Security groups for EC2, ALB, and RDS
- RDS MySQL instance with Multi-AZ
- Application Load Balancer
- Auto Scaling Group (min: 2, max: 4)
- Launch Template with Amazon Linux 2
- S3 bucket for cross-region replication
- Secrets Manager for RDS credentials
- CloudWatch alarms and Auto Scaling policies
- AWS Config for compliance tracking

GLOBAL RESOURCES:
- IAM roles and policies following least privilege principle
- S3 cross-region replication from primary to secondary
- Random credentials for RDS instances
- Comprehensive tagging strategy
- CloudWatch monitoring and alerting

SECURITY FEATURES:
- Security groups with restrictive rules
- RDS instances in private subnets only
- Encrypted RDS storage
- Secrets Manager for credential management
- IAM roles with minimal required permissions
- VPC isolation between regions

MONITORING & COMPLIANCE:
- CloudWatch alarms for CPU utilization
- Auto Scaling policies for high availability
- AWS Config for infrastructure change tracking
- S3 lifecycle policies for cost optimization
- Cross-region replication for disaster recovery

All resources are tagged with Environment:Production, ownership:self, and departmental:businessunit for proper resource management and cost allocation.
*/
```

This completes the comprehensive Terraform configuration file with all the required infrastructure components across two regions. The configuration includes:

## Key Features:
1. **Multi-region setup** with proper VPC configuration in us-east-2 and us-west-1
2. **High availability** with Auto Scaling Groups and Multi-AZ RDS
3. **Security best practices** with restrictive security groups and IAM roles
4. **Monitoring** with CloudWatch alarms and Auto Scaling policies
5. **Compliance** with AWS Config for change tracking
6. **Data resilience** with S3 cross-region replication
7. **Credential management** with AWS Secrets Manager
8. **Cost optimization** with S3 lifecycle policies

## Complete Outputs:
The configuration provides comprehensive outputs for all created resources including VPCs, subnets, security groups, RDS instances, S3 buckets, IAM roles, Auto Scaling Groups, Load Balancers, and monitoring components.

## Additional Requirements:
- Create a `user_data.sh` file in the same directory for EC2 instance initialization
- Ensure your `provider.tf` file is configured as mentioned in your requirements
- All resources follow the naming convention and tagging strategy defined in the locals

The configuration is production-ready and follows AWS best practices for security, monitoring, and high availability.
