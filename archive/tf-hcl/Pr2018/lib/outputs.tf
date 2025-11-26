output "deployment_id" {
  description = "Unique deployment identifier"
  value       = random_id.deployment.hex
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnets" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnets" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "db_subnets" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_https_url" {
  description = "HTTPS URL of the load balancer"
  value       = "https://${aws_lb.main.dns_name}"
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "s3_app_bucket" {
  description = "Name of the application S3 bucket"
  value       = aws_s3_bucket.app_data.id
}

output "s3_logs_bucket" {
  description = "Name of the access logs S3 bucket"
  value       = aws_s3_bucket.access_logs.id
}

output "autoscaling_group_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.main.name
}

output "resource_summary" {
  description = "Summary of created resources"
  value = {
    vpc_id           = aws_vpc.main.id
    public_subnets   = aws_subnet.public[*].id
    private_subnets  = aws_subnet.private[*].id
    db_subnets       = aws_subnet.database[*].id
    alb_name         = aws_lb.main.name
    alb_dns          = aws_lb.main.dns_name
    target_group     = aws_lb_target_group.main.name
    autoscaling_group= aws_autoscaling_group.main.name
    iam_role         = aws_iam_role.ec2_role.name
    db_subnet_group  = aws_db_subnet_group.main.name
    rds_identifier   = aws_db_instance.main.identifier
    s3_app_bucket    = aws_s3_bucket.app_data.id
    s3_logs_bucket   = aws_s3_bucket.access_logs.id
  }
}