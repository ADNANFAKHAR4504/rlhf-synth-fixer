output "security_groups" {
  description = "Map of security group IDs"
  value = {
    web           = aws_security_group.web.id
    app           = aws_security_group.app.id
    database      = aws_security_group.database.id
    management    = aws_security_group.management.id
    vpc_endpoints = aws_security_group.vpc_endpoints.id
  }
}