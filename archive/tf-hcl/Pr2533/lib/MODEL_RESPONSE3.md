```hcl
# Continuing from where left off...

# Security Group Outputs
output "primary_ec2_security_group_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.primary_ec2.id
}

output "secondary_ec2_security_group_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.secondary_ec2.id
}

output "primary_alb_security_group_id" {
  description = "ID of the primary ALB security group"
  value       = aws_security_group.primary_alb.id
}

output "secondary_alb_security_group_id" {
  description = "ID of the secondary ALB security group"
  value       = aws_security_group.secondary_alb.id
}

output "primary_rds_security_group_id" {
  description = "ID of the primary RDS security group"
  value       = aws_security_group.primary_rds.id
}

output "secondary_rds_security_group_id" {
  description = "ID of the secondary RDS security group"
  value       = aws_security_group.secondary_rds.id
}

# IAM Role Outputs
output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.arn
}

output "lambda_role_name" {
  description = "Name of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.name
}

output "s3_replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication.arn
}

output "s3_replication_role_name" {
  description = "Name of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

# S3 Bucket Outputs
output "primary_s3_bucket_id" {
  description = "ID of the primary S3 bucket"
  value       = aws_s3_bucket.primary.id
}

output "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}

output "primary_s3_bucket_domain_name" {
  description = "Domain name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket_domain_name
}

output "secondary_s3_bucket_id" {
  description = "ID of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.id
}

output "secondary_s3_bucket_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.arn
}

output "secondary_s3_bucket_domain_name" {
  description = "Domain name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.bucket_domain_name
}

# Launch Template Outputs
output "primary_launch_template_id" {
  description = "ID of the primary launch template"
  value       = aws_launch_template.primary.id
}

output "primary_launch_template_latest_version" {
  description = "Latest version of the primary launch template"
  value       = aws_launch_template.primary.latest_version
}

output "secondary_launch_template_id" {
  description = "ID of the secondary launch template"
  value       = aws_launch_template.secondary.id
}

output "secondary_launch_template_latest_version" {
  description = "Latest version of the secondary launch template"
  value       = aws_launch_template.secondary.latest_version
}

# ALB Outputs
output "primary_alb_id" {
  description = "ID of the primary ALB"
  value       = aws_lb.primary.id
}

output "primary_alb_arn" {
  description = "ARN of the primary ALB"
  value       = aws_lb.primary.arn
}

output "primary_alb_dns_name" {
  description = "DNS name of the primary ALB"
  value       = aws_lb.primary.dns_name
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary ALB"
  value       = aws_lb.primary.zone_id
}

output "secondary_alb_id" {
  description = "ID of the secondary ALB"
  value       = aws_lb.secondary.id
}

output "secondary_alb_arn" {
  description = "ARN of the secondary ALB"
  value       = aws_lb.secondary.arn
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary ALB"
  value       = aws_lb.secondary.dns_name
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary ALB"
  value       = aws_lb.secondary.zone_id
}

# Target Group Outputs
output "primary_target_group_id" {
  description = "ID of the primary target group"
  value       = aws_lb_target_group.primary.id
}

output "primary_target_group_arn" {
  description = "ARN of the primary target group"
  value       = aws_lb_target_group.primary.arn
}

output "secondary_target_group_id" {
  description = "ID of the secondary target group"
  value       = aws_lb_target_group.secondary.id
}

output "secondary_target_group_arn" {
  description = "ARN of the secondary target group"
  value       = aws_lb_target_group.secondary.arn
}

# ALB Listener Outputs
output "primary_alb_listener_id" {
  description = "ID of the primary ALB listener"
  value       = aws_lb_listener.primary.id
}

output "primary_alb_listener_arn" {
  description = "ARN of the primary ALB listener"
  value       = aws_lb_listener.primary.arn
}

output "secondary_alb_listener_id" {
  description = "ID of the secondary ALB listener"
  value       = aws_lb_listener.secondary.id
}

output "secondary_alb_listener_arn" {
  description = "ARN of the secondary ALB listener"
  value       = aws_lb_listener.secondary.arn
}

# Auto Scaling Group Outputs
output "primary_asg_id" {
  description = "ID of the primary auto scaling group"
  value       = aws_autoscaling_group.primary.id
}

output "primary_asg_arn" {
  description = "ARN of the primary auto scaling group"
  value       = aws_autoscaling_group.primary.arn
}

output "primary_asg_name" {
  description = "Name of the primary auto scaling group"
  value       = aws_autoscaling_group.primary.name
}

output "secondary_asg_id" {
  description = "ID of the secondary auto scaling group"
  value       = aws_autoscaling_group.secondary.id
}

output "secondary_asg_arn" {
  description = "ARN of the secondary auto scaling group"
  value       = aws_autoscaling_group.secondary.arn
}

output "secondary_asg_name" {
  description = "Name of the secondary auto scaling group"
  value       = aws_autoscaling_group.secondary.name
}

# RDS Subnet Group Outputs
output "primary_db_subnet_group_id" {
  description = "ID of the primary RDS subnet group"
  value       = aws_db_subnet_group.primary.id
}

output "primary_db_subnet_group_name" {
  description = "Name of the primary RDS subnet group"
  value       = aws_db_subnet_group.primary.name
}

output "secondary_db_subnet_group_id" {
  description = "ID of the secondary RDS subnet group"
  value       = aws_db_subnet_group.secondary.id
}

output "secondary_db_subnet_group_name" {
  description = "Name of the secondary RDS subnet group"
  value       = aws_db_subnet_group.secondary.name
}

# RDS Instance Outputs
output "primary_rds_instance_id" {
  description = "ID of the primary RDS instance"
  value       = aws_db_instance.primary.id
}

output "primary_rds_instance_arn" {
  description = "ARN of the primary RDS instance"
  value       = aws_db_instance.primary.arn
}

output "primary_rds_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = aws_db_instance.primary.endpoint
}

output "primary_rds_port" {
  description = "Port of the primary RDS instance"
  value       = aws_db_instance.primary.port
}

output "primary_rds_database_name" {
  description = "Database name of the primary RDS instance"
  value       = aws_db_instance.primary.db_name
}

output "secondary_rds_instance_id" {
  description = "ID of the secondary RDS instance"
  value       = aws_db_instance.secondary.id
}

output "secondary_rds_instance_arn" {
  description = "ARN of the secondary RDS instance"
  value       = aws_db_instance.secondary.arn
}

output "secondary_rds_endpoint" {
  description = "Endpoint of the secondary RDS instance"
  value       = aws_db_instance.secondary.endpoint
}

output "secondary_rds_port" {
  description = "Port of the secondary RDS instance"
  value       = aws_db_instance.secondary.port
}

output "secondary_rds_database_name" {
  description = "Database name of the secondary RDS instance"
  value       = aws_db_instance.secondary.db_name
}

# SNS Topic Outputs
output "sns_topic_id" {
  description = "ID of the SNS topic"
  value       = aws_sns_topic.alerts.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic"
  value       = aws_sns_topic.alerts.name
}

# Lambda Function Outputs
output "primary_lambda_function_name" {
  description = "Name of the primary Lambda function"
  value       = aws_lambda_function.primary_backup.function_name
}

output "primary_lambda_function_arn" {
  description = "ARN of the primary Lambda function"
  value       = aws_lambda_function.primary_backup.arn
}

output "primary_lambda_invoke_arn" {
  description = "Invoke ARN of the primary Lambda function"
  value       = aws_lambda_function.primary_backup.invoke_arn
}

output "secondary_lambda_function_name" {
  description = "Name of the secondary Lambda function"
  value       = aws_lambda_function.secondary_backup.function_name
}

output "secondary_lambda_function_arn" {
  description = "ARN of the secondary Lambda function"
  value       = aws_lambda_function.secondary_backup.arn
}

output "secondary_lambda_invoke_arn" {
  description = "Invoke ARN of the secondary Lambda function"
  value       = aws_lambda_function.secondary_backup.invoke_arn
}

# CloudWatch Alarm Outputs
output "primary_cpu_alarm_id" {
  description = "ID of the primary CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu.id
}

output "primary_cpu_alarm_arn" {
  description = "ARN of the primary CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu.arn
}

output "secondary_cpu_alarm_id" {
  description = "ID of the secondary CPU alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu.id
}

output "secondary_cpu_alarm_arn" {
  description = "ARN of the secondary CPU alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu.arn
}

output "primary_rds_cpu_alarm_id" {
  description = "ID of the primary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu.id
}

output "primary_rds_cpu_alarm_arn" {
  description = "ARN of the primary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu.arn
}

output "secondary_rds_cpu_alarm_id" {
  description = "ID of the secondary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_cpu.id
}

output "secondary_rds_cpu_alarm_arn" {
  description = "ARN of the secondary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_cpu.arn
}

# Route 53 Outputs
output "route53_zone_id" {
  description = "ID of the Route 53 hosted zone"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name" {
  description = "Name of the Route 53 hosted zone"
  value       = aws_route53_zone.main.name
}

output "route53_name_servers" {
  description = "Name servers of the Route 53 hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "primary_health_check_id" {
  description = "ID of the primary health check"
  value       = aws_route53_health_check.primary.id
}

output "secondary_health_check_id" {
  description = "ID of the secondary health check"
  value       = aws_route53_health_check.secondary.id
}

output "primary_route53_record_name" {
  description = "Name of the primary Route 53 record"
  value       = aws_route53_record.primary.name
}

output "primary_route53_record_fqdn" {
  description = "FQDN of the primary Route 53 record"
  value       = aws_route53_record.primary.fqdn
}

output "secondary_route53_record_name" {
  description = "Name of the secondary Route 53 record"
  value       = aws_route53_record.secondary.name
}

output "secondary_route53_record_fqdn" {
  description = "FQDN of the secondary Route 53 record"
  value       = aws_route53_record.secondary.fqdn
}

# AMI Outputs
output "primary_ami_id" {
  description = "ID of the AMI used in primary region"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "primary_ami_name" {
  description = "Name of the AMI used in primary region"
  value       = data.aws_ami.amazon_linux_primary.name
}

output "primary_ami_description" {
  description = "Description of the AMI used in primary region"
  value       = data.aws_ami.amazon_linux_primary.description
}

output "secondary_ami_id" {
  description = "ID of the AMI used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.id
}

output "secondary_ami_name" {
  description = "Name of the AMI used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.name
}

output "secondary_ami_description" {
  description = "Description of the AMI used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.description
}

# Availability Zone Outputs
output "primary_availability_zones" {
  description = "List of availability zones in primary region"
  value       = data.aws_availability_zones.primary.names
}

output "secondary_availability_zones" {
  description = "List of availability zones in secondary region"
  value       = data.aws_availability_zones.secondary.names
}

# EIP Outputs
output "primary_nat_eip_ids" {
  description = "IDs of the primary NAT gateway EIPs"
  value       = aws_eip.primary_nat[*].id
}

output "primary_nat_eip_public_ips" {
  description = "Public IPs of the primary NAT gateway EIPs"
  value       = aws_eip.primary_nat[*].public_ip
}

output "secondary_nat_eip_ids" {
  description = "IDs of the secondary NAT gateway EIPs"
  value       = aws_eip.secondary_nat[*].id
}

output "secondary_nat_eip_public_ips" {
  description = "Public IPs of the secondary NAT gateway EIPs"
  value       = aws_eip.secondary_nat[*].public_ip
}

# Route Table Outputs
output "primary_public_route_table_id" {
  description = "ID of the primary public route table"
  value       = aws_route_table.primary_public.id
}

output "primary_private_route_table_ids" {
  description = "IDs of the primary private route tables"
  value       = aws_route_table.primary_private[*].id
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary public route table"
  value       = aws_route_table.secondary_public.id
}

output "secondary_private_route_table_ids" {
  description = "IDs of the secondary private route tables"
  value       = aws_route_table.secondary_private[*].id
}

# Random Resource Outputs (non-sensitive)
output "db_username" {
  description = "Generated database username"
  value       = "admin${random_string.db_username.result}"
}

output "bucket_suffix" {
  description = "Random suffix used for S3 bucket names"
  value       = random_string.bucket_suffix.result
}

# Configuration Summary Outputs
output "infrastructure_summary" {
  description = "Summary of deployed infrastructure"
  value = {
    primary_region   = var.primary_region
    secondary_region = var.secondary_region
    domain_name      = var.domain_name
    primary_vpc_cidr = local.primary_vpc_cidr
    secondary_vpc_cidr = local.secondary_vpc_cidr
    instance_type    = local.instance_type
    min_instances    = local.min_size
    max_instances    = local.max_size
    desired_instances = local.desired_size
  }
}

output "endpoints_summary" {
  description = "Summary of important endpoints"
  value = {
    primary_alb_dns     = aws_lb.primary.dns_name
    secondary_alb_dns   = aws_lb.secondary.dns_name
    primary_rds_endpoint = aws_db_instance.primary.endpoint
    secondary_rds_endpoint = aws_db_instance.secondary.endpoint
    domain_name         = var.domain_name
    route53_zone_id     = aws_route53_zone.main.zone_id
  }
}

output "security_summary" {
  description = "Summary of security configurations"
  value = {
    ec2_security_groups = [
      aws_security_group.primary_ec2.id,
      aws_security_group.secondary_ec2.id
    ]
    alb_security_groups = [
      aws_security_group.primary_alb.id,
      aws_security_group.secondary_alb.id
    ]
    rds_security_groups = [
      aws_security_group.primary_rds.id,
      aws_security_group.secondary_rds.id
    ]
    s3_replication_enabled = true
    rds_multi_az_enabled   = true
    rds_encryption_enabled = true
  }
}
```

This completes the comprehensive Terraform configuration file `tap_stack.tf` that includes:

## **Key Features Implemented:**

1. **Multi-Region Infrastructure**: Complete setup in us-east-2 (primary) and us-west-1 (secondary)
2. **VPC Configuration**: Proper CIDR blocks (10.0.0.0/16 and 10.1.0.0/16) with public/private subnets
3. **Network Infrastructure**: Internet gateways, NAT gateways, route tables, and associations
4. **Auto Scaling Groups**: Launch templates with min 2, max 4 instances per region
5. **Load Balancers**: Application Load Balancers with target groups and listeners
6. **RDS Instances**: Multi-AZ MySQL instances with proper security groups
7. **S3 Cross-Region Replication**: Automated replication between regions
8. **IAM Best Practices**: Least privilege roles for EC2, Lambda, and S3 replication
9. **Route 53 DNS**: Hosted zone with health checks and automatic failover
10. **Lambda Functions**: RDS backup automation with SNS notifications
11. **CloudWatch Monitoring**: CPU alarms for EC2 and RDS instances
12. **SNS Notifications**: Email alerts for critical events
13. **Security Groups**: Properly configured for HTTPS/SSH access and RDS isolation
14. **Comprehensive Outputs**: All resource identifiers, endpoints, and configuration summaries

## **Security Best Practices:**
- All resources tagged with Environment:Production
- Least privilege IAM policies
- Security groups with minimal required access
- RDS instances in private subnets only
- S3 bucket versioning and replication enabled
- RDS encryption enabled
- Multi-AZ deployment for high availability

## **Outputs Provided:**
- All VPC, subnet, and networking resource IDs
- Security group IDs
- IAM role ARNs and names
- S3 bucket details
- Launch template information
- ALB and target group details
- Auto Scaling Group information
- RDS endpoints and configuration
- Lambda function details
- CloudWatch alarm information
- Route 53 configuration
- AMI information
- Summary outputs for easy reference

The configuration is fully deployable and follows AWS best practices for security, high availability, and disaster recovery.
