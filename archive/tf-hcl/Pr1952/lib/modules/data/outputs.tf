output "amazon_linux_ami_id" {
  description = "ID of the latest Amazon Linux 2 AMI"
  value       = data.aws_ami.amazon_linux.id
}

output "ubuntu_ami_id" {
  description = "ID of the latest Ubuntu LTS AMI"
  value       = data.aws_ami.ubuntu.id
}

output "ec2_assume_role_policy" {
  description = "IAM policy document for EC2 assume role"
  value       = data.aws_iam_policy_document.ec2_assume_role.json
}

output "lambda_assume_role_policy" {
  description = "IAM policy document for Lambda assume role"
  value       = data.aws_iam_policy_document.lambda_assume_role.json
}

output "ec2_s3_access_policy" {
  description = "IAM policy document for S3 access from EC2"
  value       = data.aws_iam_policy_document.ec2_s3_access.json
}

output "availability_zones" {
  description = "List of available availability zones"
  value       = data.aws_availability_zones.available.names
}

output "partition" {
  description = "Current AWS partition"
  value       = data.aws_partition.current.partition
}

output "caller_identity_account_id" {
  description = "Current AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "elb_service_account_id" {
  description = "ID of the ELB service account"
  value       = data.aws_elb_service_account.main.id
}
