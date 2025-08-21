# Terraform Task: Secure AWS Data Storage Infrastructure

Write a Terraform HCL configuration (single file) to set up a secure data storage environment in AWS. 
The script must follow these requirements:

## Requirements
1. **Region**
- Deploy everything in `us-west-2`.

2. **S3 Buckets**
- Create two buckets: one for application data (`primary`), one for logs (`logs`).
- Enable **AES-256 server-side encryption** (default encryption).
- Enable **versioning** on both buckets.
- Block all public access and enforce bucket owner control.
- Deny unencrypted uploads and enforce HTTPS (`aws:SecureTransport`).
- Restrict bucket access to a list of allowed IP CIDR ranges (variable `allowed_cidrs`).
- Enable **server access logging**: `primary` bucket should log into the `logs` bucket.

3. **IAM Roles**
- Create an **application IAM role** assumed by EC2 (`ec2.amazonaws.com` trust policy).
- Grant only the minimum permissions: `s3:GetObject`, `s3:PutObject`, and `s3:ListBucket` in the `primary` bucket under a specific path (e.g., `app/`).
- Do not create or use long-lived access keys.

4. **CloudTrail**
- Enable a CloudTrail trail for all management events.
- Log to the `logs` bucket.
- Protect CloudTrail logs against deletion by unauthorized principals.

5. **Monitoring & Alerts**
- Create a **CloudWatch metric filter** and **alarm** for IAM policy/role changes (e.g., `PutRolePolicy`, `AttachRolePolicy`).
- Send alarm notifications to an **SNS topic** called `security-alerts`.

6. **SNS Notifications**
- Create the `security-alerts` topic.
- Subscribe a list of security team emails (variable `security_team_emails`).

## Variables
- `allowed_cidrs` (list of CIDRs) restrict bucket access.
- `security_team_emails` (list of emails) default at least one.
- `region` (default = `us-west-2`).

## Outputs
- Primary bucket name
- Logs bucket name
- Application IAM role ARN
- Security alerts SNS topic ARN
