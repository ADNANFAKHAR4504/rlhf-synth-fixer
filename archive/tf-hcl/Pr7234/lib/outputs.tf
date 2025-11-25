# outputs.tf - Multi-Region Infrastructure Outputs

# ================================
# VPC OUTPUTS
# ================================

output "vpc_id" {
  description = "VPC ID for the current region"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block for the current region"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "List of database subnet IDs"
  value       = aws_subnet.database[*].id
}

# ================================
# LOAD BALANCER OUTPUTS
# ================================

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_endpoint" {
  description = "HTTP endpoint of the Application Load Balancer"
  value       = "http://${aws_lb.main.dns_name}"
}

# ================================
# RDS OUTPUTS
# ================================

output "rds_cluster_endpoint" {
  description = "Writer endpoint for the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_id" {
  description = "ID of the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.main.id
}

output "rds_cluster_arn" {
  description = "ARN of the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.main.arn
}

output "rds_cluster_database_name" {
  description = "Database name"
  value       = aws_rds_cluster.main.database_name
}

output "rds_cluster_port" {
  description = "Port on which the database accepts connections"
  value       = aws_rds_cluster.main.port
}

output "rds_instance_endpoints" {
  description = "List of all RDS instance endpoints"
  value       = aws_rds_cluster_instance.main[*].endpoint
}

# ================================
# SECRETS MANAGER OUTPUTS
# ================================

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_credentials_secret_name" {
  description = "Name of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.name
}

# ================================
# AUTO SCALING OUTPUTS
# ================================

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.arn
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.main.id
}

# ================================
# S3 OUTPUTS
# ================================

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "s3_bucket_region" {
  description = "Region of the S3 bucket"
  value       = aws_s3_bucket.main.region
}

# ================================
# SECURITY GROUP OUTPUTS
# ================================

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# ================================
# REGION INFORMATION
# ================================

output "region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = slice(data.aws_availability_zones.available.names, 0, 3)
}

# ================================
# COMPREHENSIVE SUMMARY OUTPUT
# ================================

output "deployment_summary" {
  description = "Comprehensive deployment summary for the region"
  value = {
    region   = var.aws_region
    vpc_id   = aws_vpc.main.id
    vpc_cidr = aws_vpc.main.cidr_block

    load_balancer = {
      dns_name = aws_lb.main.dns_name
      endpoint = "http://${aws_lb.main.dns_name}"
    }

    database = {
      cluster_endpoint = aws_rds_cluster.main.endpoint
      reader_endpoint  = aws_rds_cluster.main.reader_endpoint
      database_name    = aws_rds_cluster.main.database_name
      port             = aws_rds_cluster.main.port
      secret_name      = aws_secretsmanager_secret.db_credentials.name
    }

    storage = {
      bucket_name = aws_s3_bucket.main.id
    }

    compute = {
      autoscaling_group = aws_autoscaling_group.main.name
      min_size          = aws_autoscaling_group.main.min_size
      max_size          = aws_autoscaling_group.main.max_size
      desired_capacity  = aws_autoscaling_group.main.desired_capacity
    }
  }
}
