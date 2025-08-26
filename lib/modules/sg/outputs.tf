output "bastion_sg_id" {
  description = "ID of the bastion security group"
  value       = aws_security_group.bastion.id
}

output "private_sg_id" {
  description = "ID of the private instance security group"
  value       = aws_security_group.private_instance.id
}
