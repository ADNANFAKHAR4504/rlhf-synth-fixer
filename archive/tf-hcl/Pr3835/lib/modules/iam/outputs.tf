# IAM Module Outputs

output "lambda_failover_role_arn" {
  description = "ARN of Lambda failover role"
  value       = aws_iam_role.lambda_failover.arn
}

output "lambda_failover_role_name" {
  description = "Name of Lambda failover role"
  value       = aws_iam_role.lambda_failover.name
}

output "ec2_instance_role_arn" {
  description = "ARN of EC2 instance role"
  value       = aws_iam_role.ec2_instance.arn
}

output "ec2_instance_role_name" {
  description = "Name of EC2 instance role"
  value       = aws_iam_role.ec2_instance.name
}

output "ec2_instance_profile_name" {
  description = "Name of EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.arn
}

output "rds_monitoring_role_arn" {
  description = "ARN of RDS monitoring role"
  value       = aws_iam_role.rds_monitoring.arn
}

output "rds_monitoring_role_name" {
  description = "Name of RDS monitoring role"
  value       = aws_iam_role.rds_monitoring.name
}

