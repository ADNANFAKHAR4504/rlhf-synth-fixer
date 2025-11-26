output "nacl_id" {
  description = "Network ACL ID"
  value       = aws_network_acl.main.id
}

output "nacl_association_ids" {
  description = "Network ACL association IDs"
  value       = { for k, v in aws_network_acl_association.main : k => v.id }
}