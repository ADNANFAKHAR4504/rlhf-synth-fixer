output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = aws_cloudfront_distribution.main_distribution.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main_distribution.domain_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main_bucket.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main_bucket.arn
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.webserver.id
}

output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.webserver.public_ip
}

output "ec2_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.webserver.private_ip
}

output "iam_role_name" {
  description = "Name of the IAM role for EC2"
  value       = aws_iam_role.ec2_s3_role.name
}

output "deployment_suffix" {
  description = "Unique suffix used for this deployment"
  value       = local.deployment_suffix
}

output "security_group_name" {
  description = "Name of the EC2 security group"
  value       = aws_security_group.ec2_sg.name
}

output "iam_policy_name" {
  description = "Name of the IAM policy"
  value       = aws_iam_policy.ec2_s3_policy.name
}

output "cloudfront_oac_name" {
  description = "Name of the CloudFront Origin Access Control"
  value       = aws_cloudfront_origin_access_control.main_oac.name
}