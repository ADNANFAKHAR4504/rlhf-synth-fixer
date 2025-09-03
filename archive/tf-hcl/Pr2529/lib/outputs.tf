output "vpc1_id" {
  description = "ID of VPC 1"
  value       = aws_vpc.vpc1.id
}

output "vpc2_id" {
  description = "ID of VPC 2"
  value       = aws_vpc.vpc2.id
}

output "vpc_peering_connection_id" {
  description = "ID of VPC peering connection"
  value       = aws_vpc_peering_connection.peer.id
}

output "vpc1_ec2_private_ip" {
  description = "Private IP of VPC 1 EC2 instance"
  value       = aws_instance.vpc1_ec2.private_ip
}

output "vpc2_ec2_private_ip" {
  description = "Private IP of VPC 2 EC2 instance"
  value       = aws_instance.vpc2_ec2.private_ip
}

output "vpc1_ec2_public_ip" {
  description = "Public IP of VPC 1 EC2 instance"
  value       = aws_eip.vpc1_ec2_eip.public_ip
}

output "vpc2_ec2_public_ip" {
  description = "Public IP of VPC 2 EC2 instance"
  value       = aws_eip.vpc2_ec2_eip.public_ip
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "route53_records" {
  description = "Route 53 DNS records"
  value = var.create_route53_records ? {
    vpc1_app = aws_route53_record.vpc1_ec2[0].fqdn
    vpc2_app = aws_route53_record.vpc2_ec2[0].fqdn
  } : {}
}

output "key_pair_name" {
  description = "EC2 Key Pair name in use"
  value       = var.key_pair_name
}

output "vpc1_nat_gateway_id" {
  description = "ID of NAT Gateway in VPC 1"
  value       = aws_nat_gateway.vpc1_nat.id
}

output "vpc2_nat_gateway_id" {
  description = "ID of NAT Gateway in VPC 2"
  value       = aws_nat_gateway.vpc2_nat.id
}

output "key_pair_guidance" {
  description = "Guidance for EC2 key pair usage"
  value       = "Ensure the key pair '${var.key_pair_name}' exists in AWS before deploying EC2 instances."
} 