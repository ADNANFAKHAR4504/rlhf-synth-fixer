output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = aws_subnet.private.id
}

output "public_instance_ids" {
  description = "IDs of the public EC2 instances"
  value       = aws_instance.public[*].id
}

output "public_instance_public_ips" {
  description = "Public IP addresses of the public EC2 instances"
  value       = aws_instance.public[*].public_ip
}

output "public_instance_private_ips" {
  description = "Private IP addresses of the public EC2 instances"
  value       = aws_instance.public[*].private_ip
}

output "private_instance_id" {
  description = "ID of the private EC2 instance"
  value       = aws_instance.private.id
}

output "private_instance_private_ip" {
  description = "Private IP address of the private EC2 instance"
  value       = aws_instance.private.private_ip
}

output "security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.main.id
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

output "key_pair_name" {
  description = "Name of the EC2 Key Pair"
  value       = aws_key_pair.main.key_name
}

output "ssh_connection_commands" {
  description = "SSH connection commands for the instances"
  value = {
    public_instances = [
      for i, instance in aws_instance.public :
      "ssh -i private_key.pem ec2-user@${instance.public_ip}"
    ]
    # Private instance access via bastion host (public instance)
    private_instance_via_bastion = "ssh -i private_key.pem -J ec2-user@${aws_instance.public[0].public_ip} ec2-user@${aws_instance.private.private_ip}"
  }
}

output "private_key_pem" {
  description = "Private key for SSH access (save as private_key.pem and chmod 600)"
  value       = tls_private_key.main.private_key_pem
  sensitive   = true
}