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
  value       = data.aws_kms_key.main.arn
}

######################
# IAM Outputs
######################

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = ""
}
