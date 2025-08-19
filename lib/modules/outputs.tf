######################
# Networking Outputs
######################

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.main.id
}

######################
# Storage Outputs
######################

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "s3_data_bucket_name" {
  description = "Name of the S3 data bucket"
  value       = aws_s3_bucket.data.bucket
}


output "s3_data_bucket_arn" {
  description = "ARN of the S3 data bucket"
  value       = aws_s3_bucket.data.arn
}


######################
# IAM Outputs
######################

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.name
}

output "vpc_cidr" {
  description = "CIDR of the VPC"
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

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "ec2_sg_id" {
  description = "ID of the EC2 Security Group"
  value       = aws_security_group.ec2.id
}

output "alb_sg_id" {
  description = "ID of the ALB Security Group"
  value       = aws_security_group.alb.id
}

output "rds_sg_id" {
  description = "ID of the RDS Security Group"
  value       = aws_security_group.rds.id
}

output "vpc_endpoint_sg_id" {
  description = "ID of the VPC Endpoint Security Group"
  value       = aws_security_group.vpc_endpoint.id
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.id
}

output "vpc_endpoint_s3_id" {
  description = "ID of the S3 VPC Endpoint"
  value       = aws_vpc_endpoint.s3.id
}
