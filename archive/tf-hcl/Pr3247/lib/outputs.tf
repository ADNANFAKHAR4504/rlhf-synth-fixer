output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_1_id" {
  description = "ID of public subnet 1"
  value       = aws_subnet.public_1.id
}

output "public_subnet_2_id" {
  description = "ID of public subnet 2"
  value       = aws_subnet.public_2.id
}

output "web_instance_1_public_ip" {
  description = "Public IP of web instance 1"
  value       = aws_instance.web_1.public_ip
}

output "web_instance_2_public_ip" {
  description = "Public IP of web instance 2"
  value       = aws_instance.web_2.public_ip
}

output "web_instance_1_id" {
  description = "ID of web instance 1"
  value       = aws_instance.web_1.id
}

output "web_instance_2_id" {
  description = "ID of web instance 2"
  value       = aws_instance.web_2.id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for static images"
  value       = aws_s3_bucket.static_images.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.static_images.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.static_images.bucket_domain_name
}

output "security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "flow_log_group_name" {
  description = "Name of the CloudWatch log group for VPC flow logs"
  value       = aws_cloudwatch_log_group.flow_log.name
}