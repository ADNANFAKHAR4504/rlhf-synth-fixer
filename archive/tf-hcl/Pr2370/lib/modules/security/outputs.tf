output "ssh_security_group_id" {
  description = "ID of the SSH security group"
  value       = aws_security_group.ssh_access.id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web_access.id
}

output "network_acl_id" {
  description = "ID of the restrictive network ACL"
  value       = aws_network_acl.restrictive.id
}