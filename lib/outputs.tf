# outputs.tf - Comprehensive outputs for all resources

# =============================================================================
# VPC AND NETWORKING OUTPUTS
# =============================================================================

output "vpc_primary_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "vpc_primary_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary.cidr_block
}

output "vpc_secondary_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "vpc_secondary_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary.cidr_block
}

output "public_subnet_primary_ids" {
  description = "IDs of the primary region public subnets"
  value       = aws_subnet.public_primary[*].id
}

output "private_subnet_primary_ids" {
  description = "IDs of the primary region private subnets"
  value       = aws_subnet.private_primary[*].id
}

output "public_subnet_secondary_ids" {
  description = "IDs of the secondary region public subnets"
  value       = aws_subnet.public_secondary[*].id
}

output "private_subnet_secondary_ids" {
  description = "IDs of the secondary region private subnets"
  value       = aws_subnet.private_secondary[*].id
}

output "internet_gateway_primary_id" {
  description = "ID of the primary region internet gateway"
  value       = aws_internet_gateway.primary.id
}

output "internet_gateway_secondary_id" {
  description = "ID of the secondary region internet gateway"
  value       = aws_internet_gateway.secondary.id
}

output "nat_gateway_primary_ids" {
  description = "IDs of the primary region NAT gateways"
  value       = aws_nat_gateway.primary[*].id
}

output "nat_gateway_secondary_ids" {
  description = "IDs of the secondary region NAT gateways"
  value       = aws_nat_gateway.secondary[*].id
}

output "nat_gateway_primary_ips" {
  description = "Public IPs of the primary region NAT gateways"
  value       = aws_eip.nat_primary[*].public_ip
}

output "nat_gateway_secondary_ips" {
  description = "Public IPs of the secondary region NAT gateways"
  value       = aws_eip.nat_secondary[*].public_ip
}

# =============================================================================
# SECURITY GROUP OUTPUTS
# =============================================================================

output "alb_security_group_primary_id" {
  description = "ID of the primary ALB security group"
  value       = aws_security_group.alb_primary.id
}

output "ec2_security_group_primary_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.ec2_primary.id
}

output "alb_security_group_secondary_id" {
  description = "ID of the secondary ALB security group"
  value       = aws_security_group.alb_secondary.id
}

output "ec2_security_group_secondary_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.ec2_secondary.id
}

# =============================================================================
# IAM OUTPUTS
# =============================================================================

output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "automation_role_arn" {
  description = "ARN of the automation IAM role"
  value       = aws_iam_role.automation_role.arn
}

output "s3_replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.replication_role.arn
}

# =============================================================================
# S3 OUTPUTS
# =============================================================================

output "s3_bucket_primary_id" {
  description = "ID of the primary S3 bucket"
  value       = aws_s3_bucket.primary.id
}

output "s3_bucket_primary_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}

output "s3_bucket_primary_domain_name" {
  description = "Domain name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket_domain_name
}

output "s3_bucket_secondary_id" {
  description = "ID of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.id
}

output "s3_bucket_secondary_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.arn
}

output "s3_bucket_secondary_domain_name" {
  description = "Domain name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.bucket_domain_name
}

# =============================================================================
# LOAD BALANCER OUTPUTS
# =============================================================================

output "alb_primary_id" {
  description = "ID of the primary Application Load Balancer"
  value       = aws_lb.primary.id
}

output "alb_primary_arn" {
  description = "ARN of the primary Application Load Balancer"
  value       = aws_lb.primary.arn
}

output "alb_primary_dns_name" {
  description = "DNS name of the primary Application Load Balancer"
  value       = aws_lb.primary.dns_name
}

output "alb_primary_zone_id" {
  description = "Zone ID of the primary Application Load Balancer"
  value       = aws_lb.primary.zone_id
}

output "alb_secondary_id" {
  description = "ID of the secondary Application Load Balancer"
  value       = aws_lb.secondary.id
}

output "alb_secondary_arn" {
  description = "ARN of the secondary Application Load Balancer"
  value       = aws_lb.secondary.arn
}

output "alb_secondary_dns_name" {
  description = "DNS name of the secondary Application Load Balancer"
  value       = aws_lb.secondary.dns_name
}

output "alb_secondary_zone_id" {
  description = "Zone ID of the secondary Application Load Balancer"
  value       = aws_lb.secondary.zone_id
}

output "target_group_primary_arn" {
  description = "ARN of the primary target group"
  value       = aws_lb_target_group.primary.arn
}

output "target_group_secondary_arn" {
  description = "ARN of the secondary target group"
  value       = aws_lb_target_group.secondary.arn
}

# =============================================================================
# AUTO SCALING GROUP OUTPUTS
# =============================================================================

output "asg_primary_id" {
  description = "ID of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.id
}

output "asg_primary_arn" {
  description = "ARN of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.arn
}

output "asg_primary_name" {
  description = "Name of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.name
}

output "asg_secondary_id" {
  description = "ID of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.id
}

output "asg_secondary_arn" {
  description = "ARN of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.arn
}

output "asg_secondary_name" {
  description = "Name of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.name
}

output "launch_template_primary_id" {
  description = "ID of the primary launch template"
  value       = aws_launch_template.primary.id
}

output "launch_template_primary_latest_version" {
  description = "Latest version of the primary launch template"
  value       = aws_launch_template.primary.latest_version
}

output "launch_template_secondary_id" {
  description = "ID of the secondary launch template"
  value       = aws_launch_template.secondary.id
}

output "launch_template_secondary_latest_version" {
  description = "Latest version of the secondary launch template"
  value       = aws_launch_template.secondary.latest_version
}

# =============================================================================
# DATA SOURCE OUTPUTS
# =============================================================================

output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "primary_availability_zones" {
  description = "Available availability zones in primary region"
  value       = data.aws_availability_zones.primary.names
}

output "secondary_availability_zones" {
  description = "Available availability zones in secondary region"
  value       = data.aws_availability_zones.secondary.names
}

output "amazon_linux_ami_primary" {
  description = "Amazon Linux AMI ID in primary region"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "amazon_linux_ami_secondary" {
  description = "Amazon Linux AMI ID in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.id
}

# =============================================================================
# CONFIGURATION OUTPUTS
# =============================================================================

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}

output "environment_config" {
  description = "Environment-specific configuration"
  value       = local.env_config
  sensitive   = false
}

# =============================================================================
# APPLICATION ENDPOINTS
# =============================================================================

output "application_url_primary" {
  description = "Primary application URL"
  value       = "http://${aws_lb.primary.dns_name}"
}

output "application_url_secondary" {
  description = "Secondary application URL"
  value       = "http://${aws_lb.secondary.dns_name}"
}

output "health_check_url_primary" {
  description = "Primary health check URL"
  value       = "http://${aws_lb.primary.dns_name}/health"
}

output "health_check_url_secondary" {
  description = "Secondary health check URL"
  value       = "http://${aws_lb.secondary.dns_name}/health"
}
