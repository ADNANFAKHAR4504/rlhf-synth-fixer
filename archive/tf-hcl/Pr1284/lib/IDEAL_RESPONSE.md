```hcl
# lib/tap_stack.tf – Ideal Response (with toggles and auto-discovery)
# Copy this content into lib/tap_stack.tf

########################
# Variables
########################
variable "vpc_id" { description = "Target VPC ID" type = string }
variable "subnet_id" { description = "Target subnet ID for the EC2 instance" type = string }
variable "allowed_cidr" { description = "CIDR allowed to access ports 22 and 443" type = string }
variable "s3_kms_key_arn" { description = "KMS key ARN used for S3 server-side encryption" type = string }
variable "data_bucket_name" { description = "S3 bucket name for application data" type = string }
variable "trail_bucket_name" { description = "S3 bucket name for CloudTrail logs" type = string }
variable "instance_ami" { description = "AMI ID for the EC2 instance (if not provided, AL2023 is used)" type = string default = null }
variable "instance_type" { description = "EC2 instance type" type = string default = "t3.micro" }
variable "aws_region" { description = "AWS region for the provider" type = string default = "us-west-2" }
variable "enable_ec2" { description = "Whether to create EC2-related resources (security group and instance)" type = bool default = true }
variable "enable_cloudtrail" { description = "Whether to create CloudTrail and its trail bucket/policy" type = bool default = true }

########################
# Data & Region Guard
########################
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_ami" "al2023" { most_recent = true owners = ["amazon"] filter { name = "name" values = ["al2023-ami-*-x86_64"] } filter { name = "architecture" values = ["x86_64"] } filter { name = "state" values = ["available"] } }
data "aws_vpc" "default" { default = true }
data "aws_subnets" "default" { filter { name = "vpc-id" values = [data.aws_vpc.default.id] } filter { name = "default-for-az" values = ["true"] } }
data "aws_kms_alias" "s3_managed" { name = "alias/aws/s3" }

resource "null_resource" "region_guard" { lifecycle { precondition { condition = data.aws_region.current.name == "us-west-2" error_message = "This stack must be deployed in us-west-2" } } }

########################
# Locals
########################
locals {
  effective_kms_key = coalesce(var.s3_kms_key_arn, data.aws_kms_alias.s3_managed.target_key_arn)
  effective_vpc_id  = var.vpc_id != "" ? var.vpc_id : try(data.aws_vpc.default.id, null)
  effective_subnet  = var.subnet_id != "" ? var.subnet_id : try(data.aws_subnets.default.ids[0], null)
  effective_ami     = coalesce(var.instance_ami, data.aws_ami.al2023.id)
}

########################
# S3 – Data bucket with TLS + SSE-KMS
########################
resource "aws_s3_bucket" "data" { bucket = var.data_bucket_name tags = { Environment = "Production" "data:classification" = "confidential" } }
resource "aws_s3_bucket_versioning" "data" { bucket = aws_s3_bucket.data.id versioning_configuration { status = "Enabled" } }
resource "aws_s3_bucket_server_side_encryption_configuration" "data" { bucket = aws_s3_bucket.data.id rule { apply_server_side_encryption_by_default { sse_algorithm = "aws:kms" kms_master_key_id = local.effective_kms_key } bucket_key_enabled = true } }
resource "aws_s3_bucket_public_access_block" "data" { bucket = aws_s3_bucket.data.id block_public_acls = true block_public_policy = true ignore_public_acls = true restrict_public_buckets = true }
resource "aws_s3_bucket_policy" "data_bucket_policy" { bucket = aws_s3_bucket.data.id policy = jsonencode({ Version = "2012-10-17" Statement = [ { Sid = "DenyInsecureTransport", Effect = "Deny", Principal = "*", Action = "s3:*", Resource = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"], Condition = { Bool = { "aws:SecureTransport" = false } } }, { Sid = "RequireKmsForPut", Effect = "Deny", Principal = "*", Action = "s3:PutObject", Resource = "${aws_s3_bucket.data.arn}/*", Condition = { StringNotEquals = { "s3:x-amz-server-side-encryption" = "aws:kms", "s3:x-amz-server-side-encryption-aws-kms-key-id" = local.effective_kms_key } } } ] }) }

########################
# IAM – Role with tag-based S3 access
########################
resource "aws_iam_role" "s3_tag_access" { name = "s3-tag-access-role" assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = "sts:AssumeRole", Principal = { Service = "ec2.amazonaws.com" } }] }) tags = { Environment = "Production" } }
resource "aws_iam_role_policy" "s3_tag_policy" { name = "s3-tag-access-policy" role = aws_iam_role.s3_tag_access.id policy = jsonencode({ Version = "2012-10-17" Statement = [ { Sid = "ListBucketIfBucketTagged", Effect = "Allow", Action = ["s3:ListBucket"], Resource = aws_s3_bucket.data.arn, Condition = { StringEquals = { "aws:ResourceTag/data:classification" = "confidential" } } }, { Sid = "GetObjectIfObjectTagged", Effect = "Allow", Action = ["s3:GetObject"], Resource = "${aws_s3_bucket.data.arn}/*", Condition = { StringEquals = { "s3:ExistingObjectTag/data:classification" = "confidential" } } }, { Sid = "DenyNonTLS", Effect = "Deny", Action = "s3:*", Resource = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"], Condition = { Bool = { "aws:SecureTransport" = false } } } ] }) }

########################
# Networking + EC2 (conditional + auto-discovery)
########################
resource "aws_security_group" "secure_sg" { count = var.enable_ec2 && local.effective_vpc_id != null ? 1 : 0 name_prefix = "secure-sg-" vpc_id = local.effective_vpc_id ingress { description = "SSH" from_port = 22 to_port = 22 protocol = "tcp" cidr_blocks = [var.allowed_cidr] } ingress { description = "HTTPS" from_port = 443 to_port = 443 protocol = "tcp" cidr_blocks = [var.allowed_cidr] } egress { description = "All outbound" from_port = 0 to_port = 0 protocol = "-1" cidr_blocks = ["0.0.0.0/0"] } tags = { Environment = "Production" } }
resource "aws_instance" "secure" { count = var.enable_ec2 && local.effective_subnet != null && local.effective_vpc_id != null ? 1 : 0 ami = local.effective_ami instance_type = var.instance_type subnet_id = local.effective_subnet vpc_security_group_ids = [aws_security_group.secure_sg[0].id] metadata_options { http_endpoint = "enabled" http_tokens = "required" http_put_response_hop_limit = 1 } root_block_device { encrypted = true } tags = { Environment = "Production" } }

########################
# CloudTrail – logs to trail bucket (conditional)
########################
resource "aws_s3_bucket" "trail" { count = var.enable_cloudtrail ? 1 : 0 bucket = var.trail_bucket_name tags = { Environment = "Production" } }
resource "aws_s3_bucket_versioning" "trail" { count = var.enable_cloudtrail ? 1 : 0 bucket = aws_s3_bucket.trail[0].id versioning_configuration { status = "Enabled" } }
resource "aws_s3_bucket_public_access_block" "trail" { count = var.enable_cloudtrail ? 1 : 0 bucket = aws_s3_bucket.trail[0].id block_public_acls = true block_public_policy = true ignore_public_acls = true restrict_public_buckets = true }
resource "aws_s3_bucket_policy" "trail_delivery" { count = var.enable_cloudtrail ? 1 : 0 bucket = aws_s3_bucket.trail[0].id policy = jsonencode({ Version = "2012-10-17", Statement = [ { Sid = "AWSCloudTrailAclCheck", Effect = "Allow", Principal = { Service = "cloudtrail.amazonaws.com" }, Action = "s3:GetBucketAcl", Resource = aws_s3_bucket.trail[0].arn }, { Sid = "AWSCloudTrailWrite", Effect = "Allow", Principal = { Service = "cloudtrail.amazonaws.com" }, Action = "s3:PutObject", Resource = "${aws_s3_bucket.trail[0].arn}/*", Condition = { StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" } } } ] }) }
resource "aws_cloudtrail" "audit" { count = var.enable_cloudtrail ? 1 : 0 name = "tap-audit-trail" s3_bucket_name = aws_s3_bucket.trail[0].id include_global_service_events = true is_multi_region_trail = false enable_logging = true event_selector { read_write_type = "All" include_management_events = true } tags = { Environment = "Production" } depends_on = [aws_s3_bucket_policy.trail_delivery] }

########################
# IAM user for deployment
########################
resource "aws_iam_user" "deploy" { name = "terraform-deploy-user" tags = { Environment = "Production" } }
resource "aws_iam_user_policy" "deploy" { name = "terraform-deploy-policy" user = aws_iam_user.deploy.name policy = jsonencode({ Version = "2012-10-17" Statement = [ { Sid = "S3ManageDataAndTrailBuckets", Effect = "Allow", Action = ["s3:CreateBucket","s3:DeleteBucket","s3:GetBucket*","s3:ListBucket","s3:PutBucket*","s3:DeleteBucketPolicy","s3:PutEncryptionConfiguration","s3:PutBucketVersioning","s3:GetObject","s3:PutObject","s3:DeleteObject"], Resource = [aws_s3_bucket.data.arn, (var.enable_cloudtrail && length(aws_s3_bucket.trail) > 0 ? aws_s3_bucket.trail[0].arn : "arn:aws:s3:::dummy"), "${aws_s3_bucket.data.arn}/*", (var.enable_cloudtrail && length(aws_s3_bucket.trail) > 0 ? "${aws_s3_bucket.trail[0].arn}/*" : "arn:aws:s3:::dummy/*") ] }, { Sid = "EC2RunAndManageInstance", Effect = "Allow", Action = ["ec2:RunInstances","ec2:TerminateInstances","ec2:Describe*","ec2:CreateSecurityGroup","ec2:DeleteSecurityGroup","ec2:AuthorizeSecurityGroupIngress","ec2:AuthorizeSecurityGroupEgress","ec2:RevokeSecurityGroupIngress","ec2:RevokeSecurityGroupEgress","ec2:CreateTags","ec2:DeleteTags"], Resource = "*" }, { Sid = "IAMManageStackPrincipals", Effect = "Allow", Action = ["iam:CreateRole","iam:DeleteRole","iam:GetRole","iam:PutRolePolicy","iam:DeleteRolePolicy","iam:CreateUser","iam:DeleteUser","iam:GetUser","iam:PutUserPolicy","iam:DeleteUserPolicy","iam:TagRole","iam:UntagRole","iam:TagUser","iam:UntagUser"], Resource = [aws_iam_role.s3_tag_access.arn, aws_iam_user.deploy.arn] }, { Sid = "CloudTrailOps", Effect = "Allow", Action = ["cloudtrail:CreateTrail","cloudtrail:DeleteTrail","cloudtrail:DescribeTrails","cloudtrail:GetTrailStatus","cloudtrail:StartLogging","cloudtrail:StopLogging","cloudtrail:PutEventSelectors","cloudtrail:GetEventSelectors"], Resource = var.enable_cloudtrail && length(aws_cloudtrail.audit) > 0 ? aws_cloudtrail.audit[0].arn : "*" }, { Sid = "ReadIdentity", Effect = "Allow", Action = ["sts:GetCallerIdentity"], Resource = "*" } ] }) }

########################
# Outputs
########################
output "data_bucket_name" { value = aws_s3_bucket.data.id }
output "trail_bucket_name" { value = var.enable_cloudtrail && length(aws_s3_bucket.trail) > 0 ? aws_s3_bucket.trail[0].id : "" }
output "cloudtrail_arn" { value = var.enable_cloudtrail && length(aws_cloudtrail.audit) > 0 ? aws_cloudtrail.audit[0].arn : "" }
output "ec2_instance_id" { value = var.enable_ec2 && length(aws_instance.secure) > 0 ? aws_instance.secure[0].id : "" }
output "security_group_id" { value = var.enable_ec2 && length(aws_security_group.secure_sg) > 0 ? aws_security_group.secure_sg[0].id : "" }
output "iam_role_name" { value = aws_iam_role.s3_tag_access.name }
output "iam_user_name" { value = aws_iam_user.deploy.name }
```
