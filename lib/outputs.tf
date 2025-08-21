########################
# Outputs
########################

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.main.id
}

output "nat_gateway_public_ip" {
  description = "Public IP of the NAT Gateway"
  value       = aws_eip.nat.public_ip
}

output "s3_bucket_names" {
  description = "Names of the S3 buckets"
  value = {
    app_data = aws_s3_bucket.app_data.bucket
    logs     = aws_s3_bucket.logs.bucket
    backups  = aws_s3_bucket.backups.bucket
  }
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    web      = aws_security_group.web.id
    database = aws_security_group.database.id
    alb      = aws_security_group.alb.id
    private  = aws_security_group.private.id
  }
}

output "iam_role_arns" {
  description = "IAM role ARNs"
  value = {
    ec2_role    = aws_iam_role.ec2_role.arn
    lambda_role = aws_iam_role.lambda_role.arn
  }
}

output "vpc_flow_log_group" {
  description = "CloudWatch log group for VPC flow logs"
  value       = aws_cloudwatch_log_group.vpc_flow_log.name
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}