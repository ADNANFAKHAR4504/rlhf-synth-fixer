output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.app.arn
}

output "s3_bucket_arn" {
  description = "ARN of the imported S3 bucket for data storage"
  value       = aws_s3_bucket.imported_bucket.arn
}

output "s3_bucket_name" {
  description = "Name of the imported S3 bucket"
  value       = aws_s3_bucket.imported_bucket.id
}

output "datasync_s3_location_arn" {
  description = "ARN of the DataSync S3 location"
  value       = aws_datasync_location_s3.target.arn
}

output "instance_ids" {
  description = "Map of availability zones to EC2 instance IDs"
  value       = { for k, v in aws_instance.app_server : k => v.id }
}

output "instance_private_ips" {
  description = "Map of availability zones to private IP addresses"
  value       = { for k, v in aws_instance.app_server : k => v.private_ip }
}

output "blue_target_group_arn" {
  description = "ARN of the blue target group for blue-green deployments"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "ARN of the green target group for blue-green deployments"
  value       = aws_lb_target_group.green.arn
}

output "terraform_state_bucket" {
  description = "S3 bucket name for Terraform state storage"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_state_lock_table" {
  description = "DynamoDB table name for Terraform state locking"
  value       = aws_dynamodb_table.terraform_state_lock.id
}

output "workspace" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}
