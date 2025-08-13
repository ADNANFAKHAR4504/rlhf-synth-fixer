output "web_sg_id" {
  description = "Web security group ID"
  value       = aws_security_group.web.id
}

output "app_sg_id" {
  description = "Application security group ID"
  value       = aws_security_group.app.id
}

output "db_sg_id" {
  description = "Database security group ID"
  value       = aws_security_group.db.id
}

output "mgmt_sg_id" {
  description = "Management security group ID"
  value       = aws_security_group.mgmt.id
}