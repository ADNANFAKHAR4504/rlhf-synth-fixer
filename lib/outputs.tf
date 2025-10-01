output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "ec2_instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.web.public_ip
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.mysql.endpoint
}


output "s3_app_bucket_name" {
  description = "Name of the application S3 bucket (NOT the terraform backend)"
  value       = aws_s3_bucket.app_bucket.bucket
}

output "rds_password_secret_arn" {
  description = "ARN of Secrets Manager secret containing generated DB password (sensitive). Empty if password provided via TF_VAR_db_password."
  value       = length(aws_secretsmanager_secret.rds_password) > 0 ? aws_secretsmanager_secret.rds_password[0].arn : ""
  sensitive   = true
}