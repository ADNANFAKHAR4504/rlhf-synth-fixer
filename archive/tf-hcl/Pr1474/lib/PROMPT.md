I need a Terraform example for a secure, highly-available web app on AWS. Please don’t overthink it; I’m not trying to build the next Amazon, just something clean that I can read and adapt.

My must-haves:
- One VPC with both public and private subnets spread across at least two AZs.
- An ALB in front of a small Auto Scaling Group of EC2 instances. Scale off CPU and keep the security groups tight.
- Postgres on RDS in private subnets, reachable only from the app tier (no public access).
- An S3 bucket for application logs with encryption turned on and lifecycle rules to push old stuff to cheaper storage.
- Least-privilege IAM roles for EC2 and one for Lambda (I’ll plug a function in later).
- CloudFront in front so traffic is HTTPS and cached. Use a cert via ACM and wire up DNS in Route 53.
- Protect the app with WAF (the common managed rules are fine).
- Keep app config in SSM Parameter Store, nothing hardcoded.
- Some CloudWatch alarms for scale events and a simple cost/billing alarm.
- Add sensible tags to everything (Project, Environment, Owner, ManagedBy).

Style and constraints:
- Single file output (main.tf). No modules. Use variables/locals where it makes sense.
- Use data sources for AMIs.
- Encrypt things at rest (S3/KMS and RDS).
- Default-deny security posture.

That’s it. Plain Terraform HCL, nothing fancy. If there’s a gray area, pick the secure default and add a short comment. Thanks.
