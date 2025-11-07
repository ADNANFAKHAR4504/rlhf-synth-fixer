Hey team,

We need to build out a highly secure AWS environment using Terraform for our financial application. Since we're dealing with financial data, security and compliance are absolutely critical. The infrastructure needs to enforce least privilege everywhere, encrypt all data, and have comprehensive monitoring in place.

So what we need to implement - everything should go into a single main.tf file:

**IAM Access Control**

Set up IAM roles, policies, and attachments that follow least privilege principles. Make sure we're not giving out more permissions than necessary. We also need IAM users with MFA enforcement where it makes sense.

**Network Security**

Build out a VPC with proper subnets and security groups. Lock down ingress and egress rules to only allow traffic from approved IP ranges (like 10.0.0.0/16 or whatever we configure via variables). All data in transit must use TLS/HTTPS.

**Data Encryption**

Everything needs to be encrypted at rest using AWS KMS. That includes S3 buckets and EBS volumes - all using KMS-managed keys. Configure the keys to rotate automatically through Terraform.

**Logging and Monitoring**

Enable CloudTrail across all regions and set up AWS Config to track compliance and catch configuration drift. All logs go into encrypted S3 buckets. We need CloudWatch alarms hooked up to SNS for notifications when there are unauthorized access attempts.

**Application Protection**

Deploy AWS WAF and AWS Shield to protect against DDoS attacks. This needs to integrate with the application's load balancer or front-end.

**Compliance and Safety Controls**

Enforce least privilege for IAM across the board. Lock down S3 with proper bucket policies. Make absolutely sure databases, S3 buckets, and EBS volumes are not publicly accessible. One important thing - we need deletion protection disabled on all resources since this environment is for testing purposes.

Make sure everything is tagged properly for auditing and compliance (Environment, Compliance, Owner tags).

**Constraints**

- Everything in Terraform using the official AWS provider
- All code in a single main.tf file
- Follow AWS security best practices
- No deletion protection on any resources
- Configuration needs to be idempotent and reproducible
- No hardcoded credentials anywhere

**What We're Looking For**

A complete, production-ready Terraform file (main.tf) that:
- Implements the full secure AWS architecture
- Uses secure defaults throughout
- Has clear inline comments explaining the security decisions
- Is formatted as valid HCL code
- Can be deployed and torn down cleanly for testing

The output should be one complete Terraform file with all requirements implemented. No summaries or placeholders - the full working configuration with comments explaining the security best practices we're following.
