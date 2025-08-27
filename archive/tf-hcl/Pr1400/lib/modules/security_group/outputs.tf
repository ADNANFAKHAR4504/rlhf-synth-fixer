output "bastion_sg_id" {
  description = "Security group id of the bastion host"
  value       = aws_security_group.bastion.id
}

output "private_sg_id" {
  description = "Security group id of the private instance"
  value       = aws_security_group.private_instance.id
}
