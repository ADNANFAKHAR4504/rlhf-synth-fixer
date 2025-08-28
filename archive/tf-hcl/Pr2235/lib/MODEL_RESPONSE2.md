```hcl
output "elasticache_endpoint" {
  description = "ElastiCache cluster endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "elasticache_port" {
  description = "ElastiCache cluster port"
  value       = aws_elasticache_cluster.main.cache_nodes[0].port
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "ec2_instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.main.private_ip
}

output "ec2_instance_ami_id" {
  description = "AMI ID used for the EC2 instance"
  value       = aws_instance.main.ami
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "elasticache_security_group_id" {
  description = "ID of the ElastiCache security group"
  value       = aws_security_group.elasticache.id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_s3_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "kms_key_rds_id" {
  description = "ID of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.id
}

output "kms_key_rds_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "kms_key_ebs_id" {
  description = "ID of the KMS key for EBS encryption"
  value       = aws_kms_key.ebs.id
}

output "kms_key_ebs_arn" {
  description = "ARN of the KMS key for EBS encryption"
  value       = aws_kms_key.ebs.arn
}

output "kms_key_cloudtrail_id" {
  description = "ID of the KMS key for CloudTrail encryption"
  value       = aws_kms_key.cloudtrail.id
}

output "kms_key_cloudtrail_arn" {
  description = "ARN of the KMS key for CloudTrail encryption"
  value       = aws_kms_key.cloudtrail.arn
}

output "iam_role_ec2_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2.name
}

output "iam_role_ec2_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2.arn
}

output "iam_role_flow_log_name" {
  description = "Name of the VPC Flow Log IAM role"
  value       = aws_iam_role.flow_log.name
}

output "iam_role_flow_log_arn" {
  description = "ARN of the VPC Flow Log IAM role"
  value       = aws_iam_role.flow_log.arn
}

output "iam_role_cloudtrail_name" {
  description = "Name of the CloudTrail IAM role"
  value       = aws_iam_role.cloudtrail.name
}

output "iam_role_cloudtrail_arn" {
  description = "ARN of the CloudTrail IAM role"
  value       = aws_iam_role.cloudtrail.arn
}

output "iam_group_mfa_users_name" {
  description = "Name of the MFA users IAM group"
  value       = aws_iam_group.mfa_users.name
}

output "iam_group_mfa_users_arn" {
  description = "ARN of the MFA users IAM group"
  value       = aws_iam_group.mfa_users.arn
}

output "iam_instance_profile_ec2_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.name
}

output "iam_instance_profile_ec2_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.arn
}

output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.vpc.id
}

output "cloudwatch_log_group_vpc_flow_log_name" {
  description = "Name of the VPC Flow Log CloudWatch log group"
  value       = aws_cloudwatch_log_group.vpc_flow_log.name
}

output "cloudwatch_log_group_vpc_flow_log_arn" {
  description = "ARN of the VPC Flow Log CloudWatch log group"
  value       = aws_cloudwatch_log_group.vpc_flow_log.arn
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "elasticache_subnet_group_name" {
  description = "Name of the ElastiCache subnet group"
  value       = aws_elasticache_subnet_group.main.name
}

output "nat_gateway_public_ips" {
  description = "Public IP addresses of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "elastic_ips" {
  description = "Elastic IP addresses for NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "availability_zones" {
  description = "Availability zones used for deployment"
  value       = var.availability_zones
}

output "region" {
  description = "AWS region used for deployment"
  value       = var.region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "random_suffix" {
  description = "Random suffix used for unique resource naming"
  value       = random_id.suffix.hex
}

output "db_username" {
  description = "Database master username"
  value       = random_string.db_username.result
}

output "cloudfront_origin_access_control_id" {
  description = "ID of the CloudFront Origin Access Control"
  value       = aws_cloudfront_origin_access_control.main.id
}

output "ami_id" {
  description = "AMI ID of the latest Amazon Linux 2"
  value       = data.aws_ami.amazon_linux.id
}

output "ami_name" {
  description = "AMI name of the latest Amazon Linux 2"
  value       = data.aws_ami.amazon_linux.name
}

output "ami_description" {
  description = "AMI description of the latest Amazon Linux 2"
  value       = data.aws_ami.amazon_linux.description
}

output "current_account_id" {
  description = "Current AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "current_region" {
  description = "Current AWS region"
  value       = data.aws_region.current.name
}
```

## Summary

This comprehensive Terraform configuration (`tap_stack.tf`) creates a secure, production-ready AWS infrastructure stack that meets all the specified requirements:

### **Key Features Implemented:**

1. **VPC Architecture**: Complete VPC setup in us-west-2 with public/private/database subnets across multiple AZs
2. **Security**: Comprehensive security groups, KMS encryption, WAF protection, and VPC Flow Logs
3. **Database**: RDS MySQL with encryption, random credentials, and private subnet deployment
4. **Compute**: EC2 instance with encrypted EBS in private subnet
5. **Caching**: ElastiCache Redis cluster for performance optimization
6. **Storage**: Private S3 bucket with CloudFront distribution and HTTPS enforcement
7. **Monitoring**: CloudTrail for API logging and VPC Flow Logs
8. **IAM**: Least privilege roles and MFA enforcement for users
9. **Networking**: NAT Gateways with Elastic IPs for outbound connectivity

### **Security Best Practices:**

- All data encrypted at rest using KMS
- Resources deployed in private subnets where appropriate
- Security groups with minimal required access
- MFA enforcement for IAM users
- CloudTrail logging for audit compliance
- WAF protection for web applications
- HTTPS-only CloudFront distribution

### **Deployment Notes:**

1. Ensure AWS provider is configured separately
2. Review and adjust variable defaults as needed
3. The configuration uses random passwords/usernames for security
4. All resources are tagged consistently for management
5. Outputs provide all essential resource identifiers for integration

The configuration is fully deployable and follows AWS Well-Architected Framework principles for security, reliability, and cost optimization.
