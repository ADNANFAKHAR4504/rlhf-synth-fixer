output "ec2_instance_profile_name" {
  description = "EC2 instance profile name"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_role_arn" {
  description = "EC2 role ARN"
  value       = aws_iam_role.ec2_role.arn
}

output "rds_monitoring_role_arn" {
  description = "RDS monitoring role ARN"
  value       = aws_iam_role.rds_enhanced_monitoring.arn
}