# outputs.tf
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
  value       = aws_subnet.db[*].id
}

output "bastion_public_ip" {
  description = "Public IP of bastion host"
  value       = aws_instance.bastion.public_ip
}

output "bastion_private_ip" {
  description = "Private IP of bastion host"
  value       = aws_instance.bastion.private_ip
}

output "private_instance_ips" {
  description = "Private IPs of EC2 instances"
  value       = aws_instance.private[*].private_ip
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.secure.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.secure.arn
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "security_group_bastion_id" {
  description = "ID of the bastion security group"
  value       = aws_security_group.bastion.id
}

output "security_group_private_id" {
  description = "ID of the private EC2 security group"
  value       = aws_security_group.ec2_private.id
}

output "security_group_rds_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "cloudwatch_log_group_vpc" {
  description = "CloudWatch log group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_log.name
}

output "cloudwatch_log_group_dns" {
  description = "CloudWatch log group for DNS logs"
  value       = aws_cloudwatch_log_group.route53_dns.name
}

output "sns_topic_arn" {
  description = "ARN of SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}