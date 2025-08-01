You are an expert DevOps engineer tasked with building a secure, scalable, and compliant AWS infrastructure using Terraform 1.0.0+. The project is named "IaC - AWS Nova Model Breaking" and must strictly deploy all resources to the us-east-1 region.

✅ Requirements:
Your Terraform configuration must include and comply with the following:

☁️ Core Services to Use:
IAM (with least privilege roles/policies)

S3 (with KMS encryption + versioning)

RDS (multi-AZ with automated backups and retention)

EC2 (within Auto Scaling Groups only)

VPC (with subnets and Flow Logs enabled)

CloudFront (with SSL for CDN)

Route 53 (with failover routing policy)

Lambda (triggered by CloudWatch for compliance checks)

WAF (web protection)

GuardDuty (threat detection)

CloudWatch (monitoring/logging)

🔐 Security & Compliance Constraints:
All Terraform resources must be scoped to us-east-1 only.

All IAM policies must follow least privilege.

All S3 buckets must:

Be encrypted with SSE-KMS

Have versioning enabled

All EC2 instances must:

Be in Auto Scaling groups

Be secured by security groups allowing only HTTP/HTTPS

All subnets must have VPC Flow Logs enabled.

Enable AWS GuardDuty for the VPC.

Use AWS WAF to protect the app from web exploits.

Use CloudFront as CDN with an SSL certificate.

Use Route 53 with failover routing.

Configure RDS with multi-AZ and automated backups.

Create a Lambda function triggered by CloudWatch Events to scan for compliance issues.

📦 Best Practices:
Tag all resources with Environment and Owner.

Structure your code using a Terraform module for reuse and readability.

🎯 Objective:
Provide a complete and working main.tf file that provisions all required AWS resources securely and modularly while passing all listed constraints.

Difficulty: 🟥 Expert
Output: main.tf – fully functional and validated Terraform script