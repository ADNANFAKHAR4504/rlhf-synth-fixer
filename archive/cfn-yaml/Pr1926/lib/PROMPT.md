You are an AWS Cloud Security Architect. Write an **AWS CloudFormation template in YAML** that enforces security best practices and compliance for a production environment in **us-east-1**.

### Requirements

1. All resources must automatically terminate after **30 days of non-use**.
2. Encrypt all data at rest using **AWS KMS with customer-managed keys**.
3. Define **IAM roles** with the principle of least privilege.
4. Enable **logging for all services**, storing logs securely for audits.
5. Each **VPC** must span at least **two subnets across different AZs**.
6. Restrict **port 22 access** in Security Groups to a specific IP range.
7. Deny all **public access** to S3 buckets with bucket policies.
8. Ensure all **EC2 instances** run inside an **Auto Scaling Group**.
9. Configure **CloudWatch Alarms** for CPU and memory monitoring.
10. Implement **AWS SSO** for account access management.
11. Enforce **HTTPS-only traffic** through ALB listeners.
12. Enable **automated backups** for all RDS instances.
13. Use **AWS Config** for continuous compliance checks.

### Expected Output

A complete **YAML CloudFormation template** that:

- Implements the above requirements.
- Passes validation with **CloudFormation Linter**.
- Deploys successfully with **aws cloudformation deploy**.
- Demonstrates AWS best practices for **security, monitoring, and compliance**.
