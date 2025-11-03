output "security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.id
}

output "ssm_endpoint_id" {
  description = "ID of SSM endpoint"
  value       = aws_vpc_endpoint.ssm.id
}

output "ssm_endpoint_dns" {
  description = "DNS name of SSM endpoint"
  value       = try(aws_vpc_endpoint.ssm.dns_entry[0].dns_name, "")
}

output "ssm_messages_endpoint_id" {
  description = "ID of SSM Messages endpoint"
  value       = aws_vpc_endpoint.ssm_messages.id
}

output "ssm_messages_endpoint_dns" {
  description = "DNS name of SSM Messages endpoint"
  value       = try(aws_vpc_endpoint.ssm_messages.dns_entry[0].dns_name, "")
}

output "ec2_messages_endpoint_id" {
  description = "ID of EC2 Messages endpoint"
  value       = aws_vpc_endpoint.ec2_messages.id
}

output "ec2_messages_endpoint_dns" {
  description = "DNS name of EC2 Messages endpoint"
  value       = try(aws_vpc_endpoint.ec2_messages.dns_entry[0].dns_name, "")
}
