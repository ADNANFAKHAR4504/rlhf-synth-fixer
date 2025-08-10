output "vpc_id" { 
  value = aws_vpc.main.id 
  description = "The VPC identifier"
}

output "public_subnet_ids" { 
  value = aws_subnet.public[*].id 
  description = "List of public subnet IDs"
}

output "private_subnet_ids" { 
  value = aws_subnet.private[*].id 
  description = "List of private subnet IDs"
}

output "web_security_group_id" { 
  value = aws_security_group.web.id 
  description = "Web tier security group ID"
}

output "db_security_group_id" { 
  value = aws_security_group.db.id 
  description = "Database tier security group ID"
}

output "vpc_cidr_block" {
  value = aws_vpc.main.cidr_block
  description = "The CIDR block of the VPC"
}
