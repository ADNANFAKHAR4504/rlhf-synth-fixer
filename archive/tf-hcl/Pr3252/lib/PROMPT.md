Generate production-ready Terraform configuration that provisions a secure, enterprise-grade AWS environment. Use only first-party Terraform AWS resources for the following requirements
- S3: All buckets must use SSE-S3 encryption at rest and have versioning enabled. Store all logs in a dedicated S3 bucket with a lifecycle policy to retain logs for at least 365 days.
- API Gateway: Any HTTP/REST API endpoints must require AWS IAM authorization (no public/anonymous access).
- CloudFront: Distributions must be protected by AWS Shield Advanced and log to the logging S3 bucket.
- EC2 + EBS + Scaling: Launch EC2 instances with encrypted EBS volumes, managed by an Auto Scaling Group behind an Application Load Balancer. Configure ALB health checks. Restrict SSH access via Security Groups (e.g., only from a specific CIDR variable).
- VPC + Peering: Create a primary VPC and configure VPC peering to a peer VPC in a different account using aliased providers. Ensure appropriate route table updates for cross-VPC communication.
- IAM: Apply least-privilege IAM roles and policies for EC2, Lambda, API Gateway, and any supporting services (only minimum required actions).
- RDS + Lambda: Provision an RDS instance with Multi-AZ enabled inside the VPC. Create a Lambda function that accesses RDS over VPC subnets/security groups Ensure all traffic is internal.
- Monitoring + WAF: Create CloudWatch alarms for unauthorized API calls. Attach AWS WAF to all public-facing ALBs with a sensible baseline ruleset.