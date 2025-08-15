########################
# Outputs
########################

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.prod_vpc.id
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.prod_alb.dns_name
}

output "load_balancer_url_http" {
  description = "HTTP URL of the load balancer"
  value       = "http://${aws_lb.prod_alb.dns_name}"
}

output "load_balancer_url_https" {
  description = "HTTPS URL of the load balancer"
  value       = "https://${aws_lb.prod_alb.dns_name}"
}

output "data_bucket_name" {
  description = "Name of the application data S3 bucket"
  value       = aws_s3_bucket.prod_data_bucket.id
}

output "logs_bucket_name" {
  description = "Name of the logs S3 bucket"
  value       = aws_s3_bucket.prod_logs_bucket.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.prod_public_subnets[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.prod_private_subnets[*].id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.prod_alb_sg.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.prod_ec2_sg.id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling group"
  value       = aws_autoscaling_group.prod_asg.name
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.prod_tg.arn
}

output "nat_gateway_ids" {
  description = "IDs of the NAT gateways"
  value       = aws_nat_gateway.prod_nat_gateways[*].id
}

output "elastic_ip_addresses" {
  description = "Elastic IP addresses for NAT gateways"
  value       = aws_eip.prod_nat_eips[*].public_ip
}

# Certificate removed for test environment - no HTTPS listener configured

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}

output "cloudwatch_alarm_alb_target_health" {
  description = "CloudWatch alarm for ALB target health"
  value       = aws_cloudwatch_metric_alarm.alb_target_health.arn
}

output "cloudwatch_alarm_asg_instance_health" {
  description = "CloudWatch alarm for ASG instance health"
  value       = aws_cloudwatch_metric_alarm.asg_instance_health.arn
}

output "cloudwatch_alarm_alb_response_time" {
  description = "CloudWatch alarm for ALB response time"
  value       = aws_cloudwatch_metric_alarm.alb_response_time.arn
}