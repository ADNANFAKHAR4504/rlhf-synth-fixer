# Security-Focused AWS Infrastructure

Need to build a secure AWS setup for our new application. Security is the top priority here.

Requirements:
- IAM roles need proper trust policies
- Encrypt everything - EBS volumes and RDS with KMS
- S3 buckets need policies to block public PUT actions
- MFA required for all IAM users, rotate access keys every 90 days
- WAF protection for load balancers
- EC2 instances get read-only S3 access
- CloudTrail logs encrypted and stored securely
- SNS only accepts messages from authorized AWS services
- Security groups locked down - SSH only from specific IPs
- GuardDuty enabled globally
- Minimal ingress traffic, SSH restricted to known IPs
- Deploy in us-west-2 and us-east-2
- Resource naming: prod-<name> for production, dev-<name> for dev

Create a CDK stack called TapStack in tap-stack.ts