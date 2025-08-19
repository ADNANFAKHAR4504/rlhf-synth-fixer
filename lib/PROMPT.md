We want Terraform code for a single file (./lib/main.tf). The idea is to spin up a secure, highly available web app infra in AWS, but keep everything in one place (no external modules).

Some key points we need to hit:

Backend / providers: The backend is S3 + DynamoDB for locking (already set up in provider.tf so don’t add provider blocks again). Should only work in us-west-2 or us-east-1. Let’s have an aws_region variable that ties into the provider.

IAM & security: Follow least privilege. All compute (EC2, etc.) should have IAM instance profiles with only what they need. Security groups and NACLs should block by default, then explicitly allow the necessary traffic.

Storage: S3 buckets for logs, app data, etc. need KMS encryption, no unencrypted uploads, and block public access. Everything should be tagged consistently: Environment, Project, Owner, and ManagedBy=terraform.

Networking: One VPC with public + private subnets across multiple AZs. EC2 and RDS stay in private subnets. NAT gateway for internet egress. Bastion host goes in public subnet for SSH access.

Compute: EC2s in private subnets, correct IAM roles, no wide-open SG rules (SSH must go only via bastion).

Monitoring/logging: CloudTrail enabled (make it conditional so we don’t break if account already has max trails). Logs go to encrypted S3. CloudWatch log groups need KMS and keep data 90 days.

Outputs: We need to output safe stuff for CI/CD pipelines: VPC ID, subnet IDs, bastion IP, bucket names, CloudTrail bucket ARN. Don’t expose secrets.

Constraints:

Must be a single file (main.tf).

Works with Terraform >= 0.15.

No external modules.

Must pass terraform validate and follow AWS security best practices.