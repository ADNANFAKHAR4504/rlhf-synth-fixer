output "security_group_ids" {
  description = "Map of security group IDs"
  value = {
    web      = aws_security_group.web.id
    database = aws_security_group.database.id
    alb      = aws_security_group.alb.id
    private  = aws_security_group.private.id
  }
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "private_security_group_id" {
  description = "ID of the private security group"
  value       = aws_security_group.private.id
}