output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the VPC"
}

output "vpc_cidr" {
  value       = aws_vpc.main.cidr_block
  description = "CIDR block of the VPC"
}

output "public_subnet_id" {
  value       = aws_subnet.public.id
  description = "ID of the public subnet"
}

output "private_subnet_id" {
  value       = aws_subnet.private.id
  description = "ID of the private subnet"
}

output "private_subnet_2_id" {
  value       = aws_subnet.private_2.id
  description = "ID of the second private subnet"
}

output "internet_gateway_id" {
  value       = aws_internet_gateway.main.id
  description = "ID of the Internet Gateway"
}

output "nat_gateway_id" {
  value       = aws_nat_gateway.main.id
  description = "ID of the NAT Gateway"
}

output "ec2_instance_id" {
  value       = aws_instance.web.id
  description = "ID of the EC2 instance"
}

output "ec2_public_ip" {
  value       = aws_instance.web.public_ip
  description = "Public IP of the EC2 instance"
}

output "ec2_private_ip" {
  value       = aws_instance.web.private_ip
  description = "Private IP of the EC2 instance"
}

output "ec2_security_group_id" {
  value       = aws_security_group.ec2.id
  description = "ID of the EC2 security group"
}

output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS instance endpoint"
}

output "rds_address" {
  value       = aws_db_instance.main.address
  description = "RDS instance address"
}

output "rds_port" {
  value       = aws_db_instance.main.port
  description = "RDS instance port"
}

output "rds_security_group_id" {
  value       = aws_security_group.rds.id
  description = "ID of the RDS security group"
}

output "db_subnet_group_name" {
  value       = aws_db_subnet_group.main.name
  description = "Name of the DB subnet group"
}

output "flow_log_id" {
  value       = aws_flow_log.main.id
  description = "ID of the VPC Flow Log"
}

output "flow_log_group_name" {
  value       = aws_cloudwatch_log_group.flow_log.name
  description = "Name of the CloudWatch Log Group for Flow Logs"
}

output "ec2_iam_role_arn" {
  value       = aws_iam_role.ec2.arn
  description = "ARN of the EC2 IAM role"
}

output "ec2_instance_profile_name" {
  value       = aws_iam_instance_profile.ec2.name
  description = "Name of the EC2 instance profile"
}

output "ssm_parameter_db_host" {
  value       = aws_ssm_parameter.db_host.name
  description = "SSM parameter name for database host"
}

output "ssm_parameter_db_port" {
  value       = aws_ssm_parameter.db_port.name
  description = "SSM parameter name for database port"
}

output "ssm_parameter_db_username" {
  value       = aws_ssm_parameter.db_username.name
  description = "SSM parameter name for database username"
}

output "ssm_parameter_db_password" {
  value       = aws_ssm_parameter.db_password.name
  description = "SSM parameter name for database password"
}

output "ssm_parameter_db_name" {
  value       = aws_ssm_parameter.db_name.name
  description = "SSM parameter name for database name"
}


