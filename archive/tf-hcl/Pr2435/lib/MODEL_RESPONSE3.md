```hcl
# IAM Outputs
output "ec2_iam_role_name" {
  description = "Name of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the IAM instance profile for EC2 instances"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the IAM instance profile for EC2 instances"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "s3_access_policy_arn" {
  description = "ARN of the S3 access policy"
  value       = aws_iam_policy.s3_access.arn
}

output "cloudwatch_access_policy_arn" {
  description = "ARN of the CloudWatch access policy"
  value       = aws_iam_policy.cloudwatch_access.arn
}

# Security Group Outputs
output "primary_alb_security_group_id" {
  description = "ID of the primary ALB security group"
  value       = aws_security_group.primary_alb.id
}

output "primary_ec2_security_group_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.primary_ec2.id
}

output "primary_rds_security_group_id" {
  description = "ID of the primary RDS security group"
  value       = aws_security_group.primary_rds.id
}

output "secondary_alb_security_group_id" {
  description = "ID of the secondary ALB security group"
  value       = aws_security_group.secondary_alb.id
}

output "secondary_ec2_security_group_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.secondary_ec2.id
}

output "secondary_rds_security_group_id" {
  description = "ID of the secondary RDS security group"
  value       = aws_security_group.secondary_rds.id
}

# Route 53 Outputs
output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name" {
  description = "Route 53 hosted zone name"
  value       = aws_route53_zone.main.name
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "primary_health_check_id" {
  description = "Route 53 health check ID for primary ALB"
  value       = aws_route53_health_check.primary_alb.id
}

output "secondary_health_check_id" {
  description = "Route 53 health check ID for secondary ALB"
  value       = aws_route53_health_check.secondary_alb.id
}

output "domain_name" {
  description = "Domain name for the application"
  value       = var.domain_name
}

# Internet Gateway Outputs
output "primary_internet_gateway_id" {
  description = "ID of the primary internet gateway"
  value       = aws_internet_gateway.primary.id
}

output "secondary_internet_gateway_id" {
  description = "ID of the secondary internet gateway"
  value       = aws_internet_gateway.secondary.id
}

# NAT Gateway Outputs
output "primary_nat_gateway_ids" {
  description = "IDs of the primary NAT gateways"
  value       = [aws_nat_gateway.primary_1.id, aws_nat_gateway.primary_2.id]
}

output "secondary_nat_gateway_ids" {
  description = "IDs of the secondary NAT gateways"
  value       = [aws_nat_gateway.secondary_1.id, aws_nat_gateway.secondary_2.id]
}

output "primary_nat_gateway_public_ips" {
  description = "Public IPs of the primary NAT gateways"
  value       = [aws_eip.primary_nat_1.public_ip, aws_eip.primary_nat_2.public_ip]
}

output "secondary_nat_gateway_public_ips" {
  description = "Public IPs of the secondary NAT gateways"
  value       = [aws_eip.secondary_nat_1.public_ip, aws_eip.secondary_nat_2.public_ip]
}

# Route Table Outputs
output "primary_public_route_table_id" {
  description = "ID of the primary public route table"
  value       = aws_route_table.primary_public.id
}

output "primary_private_route_table_ids" {
  description = "IDs of the primary private route tables"
  value       = [aws_route_table.primary_private_1.id, aws_route_table.primary_private_2.id]
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary public route table"
  value       = aws_route_table.secondary_public.id
}

output "secondary_private_route_table_ids" {
  description = "IDs of the secondary private route tables"
  value       = [aws_route_table.secondary_private_1.id, aws_route_table.secondary_private_2.id]
}

# DB Subnet Group Outputs
output "primary_db_subnet_group_name" {
  description = "Name of the primary DB subnet group"
  value       = aws_db_subnet_group.primary.name
}

output "secondary_db_subnet_group_name" {
  description = "Name of the secondary DB subnet group"
  value       = aws_db_subnet_group.secondary.name
}

output "primary_db_subnet_group_arn" {
  description = "ARN of the primary DB subnet group"
  value       = aws_db_subnet_group.primary.arn
}

output "secondary_db_subnet_group_arn" {
  description = "ARN of the secondary DB subnet group"
  value       = aws_db_subnet_group.secondary.arn
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.arn
}

output "primary_alb_health_alarm_name" {
  description = "Name of the primary ALB health alarm"
  value       = aws_cloudwatch_metric_alarm.primary_alb_health.alarm_name
}

output "secondary_alb_health_alarm_name" {
  description = "Name of the secondary ALB health alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_alb_health.alarm_name
}

output "primary_rds_cpu_alarm_name" {
  description = "Name of the primary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu.alarm_name
}

output "primary_cpu_high_alarm_name" {
  description = "Name of the primary CPU high alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu_high.alarm_name
}

output "primary_cpu_low_alarm_name" {
  description = "Name of the primary CPU low alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu_low.alarm_name
}

output "secondary_cpu_high_alarm_name" {
  description = "Name of the secondary CPU high alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu_high.alarm_name
}

output "secondary_cpu_low_alarm_name" {
  description = "Name of the secondary CPU low alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu_low.alarm_name
}

# SNS Topic Outputs
output "primary_sns_topic_arn" {
  description = "ARN of the primary SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "secondary_sns_topic_arn" {
  description = "ARN of the secondary SNS topic for alerts"
  value       = aws_sns_topic.alerts_secondary.arn
}

output "primary_sns_topic_name" {
  description = "Name of the primary SNS topic for alerts"
  value       = aws_sns_topic.alerts.name
}

output "secondary_sns_topic_name" {
  description = "Name of the secondary SNS topic for alerts"
  value       = aws_sns_topic.alerts_secondary.name
}

# Auto Scaling Policy Outputs
output "primary_scale_up_policy_arn" {
  description = "ARN of the primary scale up policy"
  value       = aws_autoscaling_policy.primary_scale_up.arn
}

output "primary_scale_down_policy_arn" {
  description = "ARN of the primary scale down policy"
  value       = aws_autoscaling_policy.primary_scale_down.arn
}

output "secondary_scale_up_policy_arn" {
  description = "ARN of the secondary scale up policy"
  value       = aws_autoscaling_policy.secondary_scale_up.arn
}

output "secondary_scale_down_policy_arn" {
  description = "ARN of the secondary scale down policy"
  value       = aws_autoscaling_policy.secondary_scale_down.arn
}

# Availability Zone Outputs
output "primary_availability_zones" {
  description = "Availability zones used in primary region"
  value       = [data.aws_availability_zones.primary.names[0], data.aws_availability_zones.primary.names[1]]
}

output "secondary_availability_zones" {
  description = "Availability zones used in secondary region"
  value       = [data.aws_availability_zones.secondary.names[0], data.aws_availability_zones.secondary.names[1]]
}

# EIP Outputs
output "primary_nat_eip_ids" {
  description = "IDs of the primary NAT gateway Elastic IPs"
  value       = [aws_eip.primary_nat_1.id, aws_eip.primary_nat_2.id]
}

output "secondary_nat_eip_ids" {
  description = "IDs of the secondary NAT gateway Elastic IPs"
  value       = [aws_eip.secondary_nat_1.id, aws_eip.secondary_nat_2.id]
}

# Load Balancer Listener Outputs
output "primary_alb_listener_arn" {
  description = "ARN of the primary ALB listener"
  value       = aws_lb_listener.primary.arn
}

output "secondary_alb_listener_arn" {
  description = "ARN of the secondary ALB listener"
  value       = aws_lb_listener.secondary.arn
}

# Random Resource Outputs
output "s3_bucket_suffix" {
  description = "Random suffix used for S3 bucket name"
  value       = random_string.bucket_suffix.result
}

output "db_username_suffix" {
  description = "Random suffix used for database username"
  value       = random_string.db_username.result
}

# Subnet CIDR Outputs
output "primary_subnet_cidrs" {
  description = "CIDR blocks of primary subnets"
  value = {
    public_1  = local.primary_public_subnet_1
    public_2  = local.primary_public_subnet_2
    private_1 = local.primary_private_subnet_1
    private_2 = local.primary_private_subnet_2
  }
}

output "secondary_subnet_cidrs" {
  description = "CIDR blocks of secondary subnets"
  value = {
    public_1  = local.secondary_public_subnet_1
    public_2  = local.secondary_public_subnet_2
    private_1 = local.secondary_private_subnet_1
    private_2 = local.secondary_private_subnet_2
  }
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

# Environment and Project Outputs
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

# Resource Naming Prefix Outputs
output "primary_resource_prefix" {
  description = "Resource naming prefix for primary region"
  value       = local.primary_prefix
}

output "secondary_resource_prefix" {
  description = "Resource naming prefix for secondary region"
  value       = local.secondary_prefix
}

# Common Tags Output
output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# Instance Type Output
output "ec2_instance_type" {
  description = "EC2 instance type used"
  value       = var.instance_type
}

output "rds_instance_class" {
  description = "RDS instance class used"
  value       = var.db_instance_class
}

# Auto Scaling Configuration Outputs
output "asg_configuration" {
  description = "Auto Scaling Group configuration"
  value = {
    primary = {
      min_size         = aws_autoscaling_group.primary.min_size
      max_size         = aws_autoscaling_group.primary.max_size
      desired_capacity = aws_autoscaling_group.primary.desired_capacity
    }
    secondary = {
      min_size         = aws_autoscaling_group.secondary.min_size
      max_size         = aws_autoscaling_group.secondary.max_size
      desired_capacity = aws_autoscaling_group.secondary.desired_capacity
    }
  }
}

# RDS Configuration Outputs
output "rds_configuration" {
  description = "RDS configuration details"
  value = {
    engine                  = aws_db_instance.primary.engine
    engine_version         = aws_db_instance.primary.engine_version
    allocated_storage      = aws_db_instance.primary.allocated_storage
    max_allocated_storage  = aws_db_instance.primary.max_allocated_storage
    storage_type          = aws_db_instance.primary.storage_type
    storage_encrypted     = aws_db_instance.primary.storage_encrypted
    backup_retention_period = aws_db_instance.primary.backup_retention_period
  }
}

# S3 Lifecycle Configuration Output
output "s3_lifecycle_policy" {
  description = "S3 bucket lifecycle policy configuration"
  value = {
    expiration_days = 30
    rule_status     = "Enabled"
  }
}

# Health Check Configuration Outputs
output "route53_health_check_configuration" {
  description = "Route 53 health check configuration"
  value = {
    primary = {
      fqdn              = aws_route53_health_check.primary_alb.fqdn
      port              = aws_route53_health_check.primary_alb.port
      type              = aws_route53_health_check.primary_alb.type
      failure_threshold = aws_route53_health_check.primary_alb.failure_threshold
      request_interval  = aws_route53_health_check.primary_alb.request_interval
    }
    secondary = {
      fqdn              = aws_route53_health_check.secondary_alb.fqdn
      port              = aws_route53_health_check.secondary_alb.port
      type              = aws_route53_health_check.secondary_alb.type
      failure_threshold = aws_route53_health_check.secondary_alb.failure_threshold
      request_interval  = aws_route53_health_check.secondary_alb.request_interval
    }
  }
}

# Target Group Health Check Configuration
output "target_group_health_check_configuration" {
  description = "Target group health check configuration"
  value = {
    primary = {
      healthy_threshold   = aws_lb_target_group.primary.health_check[0].healthy_threshold
      unhealthy_threshold = aws_lb_target_group.primary.health_check[0].unhealthy_threshold
      timeout             = aws_lb_target_group.primary.health_check[0].timeout
      interval            = aws_lb_target_group.primary.health_check[0].interval
      path                = aws_lb_target_group.primary.health_check[0].path
      matcher             = aws_lb_target_group.primary.health_check[0].matcher
    }
    secondary = {
      healthy_threshold   = aws_lb_target_group.secondary.health_check[0].healthy_threshold
      unhealthy_threshold = aws_lb_target_group.secondary.health_check[0].unhealthy_threshold
      timeout             = aws_lb_target_group.secondary.health_check[0].timeout
      interval            = aws_lb_target_group.secondary.health_check[0].interval
      path                = aws_lb_target_group.secondary.health_check[0].path
      matcher             = aws_lb_target_group.secondary.health_check[0].matcher
    }
  }
}

# Main Application URL Output (Primary requirement)
output "application_url" {
  description = "Public DNS of the ELB for external access"
  value       = "http://${var.domain_name}"
}

# Backup Application URLs
output "primary_application_url" {
  description = "Direct URL to primary region ALB"
  value       = "http://${aws_lb.primary.dns_name}"
}

output "secondary_application_url" {
  description = "Direct URL to secondary region ALB"
  value       = "http://${aws_lb.secondary.dns_name}"
}

# Summary Output
output "deployment_summary" {
  description = "Summary of the deployed infrastructure"
  value = {
    regions = {
      primary   = var.primary_region
      secondary = var.secondary_region
    }
    vpcs = {
      primary_cidr   = var.primary_vpc_cidr
      secondary_cidr = var.secondary_vpc_cidr
    }
    application_urls = {
      main      = "http://${var.domain_name}"
      primary   = "http://${aws_lb.primary.dns_name}"
      secondary = "http://${aws_lb.secondary.dns_name}"
    }
    database_endpoints = {
      primary_master = aws_db_instance.primary.endpoint
      secondary_replica = aws_db_instance.secondary_replica.endpoint
    }
    s3_bucket = aws_s3_bucket.logs.bucket
    environment = var.environment
    project = var.project_name
  }
}
```

## Summary

This complete Terraform configuration (`tap_stack.tf`) creates a comprehensive multi-region infrastructure stack with the following components:

### **Infrastructure Components:**
1. **Multi-Region VPCs** - Primary (us-east-2) and Secondary (us-west-1) with proper CIDR blocks
2. **Subnets** - Public and private subnets in each region across multiple AZs
3. **Networking** - Internet Gateways, NAT Gateways, Route Tables, and Security Groups
4. **Auto Scaling Groups** - With launch templates managing 2-4 instances per region
5. **Load Balancers** - Application Load Balancers in both regions with health checks
6. **RDS Database** - Primary instance with cross-region read replica
7. **S3 Storage** - Encrypted bucket with 30-day lifecycle policy for logs
8. **Route 53** - DNS management with health checks and weighted routing
9. **CloudWatch** - Comprehensive monitoring, alarms, and auto-scaling policies
10. **IAM** - Secure roles and policies for EC2 instances

### **Key Features:**
- **Security**: All resources tagged with 'Environment:Production'
- **High Availability**: Multi-AZ deployment across two regions
- **Auto Scaling**: CPU-based scaling policies (2-4 instances per region)
- **Monitoring**: CloudWatch alarms for ALB health, RDS CPU, and EC2 metrics
- **Encryption**: S3 bucket encrypted with AWS managed keys
- **Lifecycle Management**: S3 objects automatically deleted after 30 days
- **Cross-Region Replication**: RDS read replica for disaster recovery
- **DNS Failover**: Route 53 health checks with weighted routing

### **Outputs:**
The configuration provides comprehensive outputs for all created resources including:
- VPC and subnet IDs
- Load balancer DNS names and ARNs
- RDS endpoints and identifiers
- S3 bucket information
- IAM role and policy ARNs
- Security group IDs
- Auto Scaling Group details
- CloudWatch alarm names
- Route 53 configuration
- **Primary Output**: `application_url` - The main public DNS for external access

The stack is production-ready with proper security controls, monitoring, and high availability across multiple regions.
