output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

output "private_route_table_ids" {
  description = "The IDs of the private route tables"
  value       = module.networking.private_route_table_ids
}

output "ec2_sg_id" {
  description = "The ID of the EC2 security group"
  value       = module.security.ec2_sg_id
}

output "alb_sg_id" {
  description = "The ID of the ALB security group"
  value       = module.security.alb_sg_id
}

output "rds_sg_id" {
  description = "The ID of the RDS security group"
  value       = module.security.rds_sg_id
}

output "vpc_endpoint_sg_id" {
  description = "The ID of the VPC endpoint security group"
  value       = module.security.vpc_endpoint_sg_id
}

output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = module.storage.kms_key_id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key"
  value       = module.storage.kms_key_arn
}

output "s3_data_bucket_name" {
  description = "The name of the S3 data bucket"
  value       = module.storage.s3_data_bucket_name
}

output "s3_data_bucket_arn" {
  description = "The ARN of the S3 data bucket"
  value       = module.storage.s3_data_bucket_arn
}

output "vpc_endpoint_s3_id" {
  description = "The ID of the S3 VPC endpoint"
  value       = module.storage.vpc_endpoint_s3_id
}

output "ec2_instance_profile_name" {
  description = "The name of the EC2 instance profile"
  value       = module.iam.ec2_instance_profile_name
}

output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = module.compute.alb_dns_name
}

output "rds_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = module.database.rds_endpoint
}

output "cloudtrail_arn" {
  description = "The ARN of the CloudTrail"
  value       = module.monitoring.cloudtrail_arn
}
