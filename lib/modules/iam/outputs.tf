output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_role_arn" {
  description = "ARN of the EC2 role"
  value       = aws_iam_role.ec2_role.arn
}

output "autoscaling_role_arn" {
  description = "ARN of the Auto Scaling role"
  value       = aws_iam_role.autoscaling_role.arn
}

output "ec2_role_name" {
  description = "Name of the EC2 role"
  value       = aws_iam_role.ec2_role.name
}

output "autoscaling_role_name" {
  description = "Name of the Auto Scaling role"
  value       = aws_iam_role.autoscaling_role.name
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS monitoring role"
  value       = aws_iam_role.rds_monitoring.arn
}
