output "bastion_host_public_ip" {
  description = "Public IP address of the bastion host"
  value       = aws_instance.bastion.public_ip
}

output "private_instance_ids" {
  description = "IDs of the private instances"
  value       = [aws_instance.private.id]
}
