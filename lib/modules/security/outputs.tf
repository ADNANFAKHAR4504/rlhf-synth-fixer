output "kms_key_main_arn" {
  description = "ARN of the main KMS key"
  value       = aws_kms_key.main.arn
}

output "kms_key_rds_arn" {
  description = "ARN of the RDS KMS key"
  value       = aws_kms_key.rds.arn
}

output "sg_alb_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "sg_web_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "sg_bastion_id" {
  description = "ID of the bastion security group"
  value       = aws_security_group.bastion.id
}

output "sg_db_id" {
  description = "ID of the DB security group"
  value       = aws_security_group.db.id
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS monitoring role"
  value       = aws_iam_role.rds_monitoring.arn
}
