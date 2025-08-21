output "vpc_ids" {
  description = "VPC IDs for both regions"
  value = {
    primary   = aws_vpc.primary.id
    secondary = aws_vpc.secondary.id
  }
}

output "public_subnet_ids" {
  description = "Public subnet IDs for both regions"
  value = {
    primary   = aws_subnet.public_primary.id
    secondary = aws_subnet.public_secondary.id
  }
}

output "private_subnet_ids" {
  description = "Private subnet IDs for both regions"
  value = {
    primary   = aws_subnet.private_primary.id
    secondary = aws_subnet.private_secondary.id
  }
}

output "security_group_ids" {
  description = "Security Group IDs for bastion/app access"
  value = {
    primary   = aws_security_group.bastion_app_primary.id
    secondary = aws_security_group.bastion_app_secondary.id
  }
}