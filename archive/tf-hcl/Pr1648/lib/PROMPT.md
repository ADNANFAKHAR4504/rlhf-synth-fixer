
I need to set up a secure AWS environment for our web app using terraform. We're aiming for production-grade stuff here - multi-region ready and following least-privilege + encryption everywhere (you know how security audits go...).

Here's what I'm thinking:

The VPC should span 2 AZs with at least 2 public and 2 private subnets. Pretty standard setup.

For compute - EC2 app instances need to stay in private subnets only. Access should go through a bastion host in the public subnets (I know, bastions are a bit old school but security team insists).

Security-wise:
- Security groups that deny everything inbound except from our corporate CIDRs (we'll parameterize this)
- NAT gateways for the private subnets to get out

IAM roles need to be locked down tight - especially for Lambda since that's usually where we mess up permissions.

S3 bucket with versioning enabled, SSE-KMS, public access blocked, and TLS required. Standard security stuff.

Lambda function that triggers on S3 uploads, pulls config from SSM/Secrets Manager, has reasonable memory/timeout limits, proper logging, and a DLQ for failed executions.

ACM certificates for HTTPS termination.

Monitoring: CloudWatch alarms for unauthorized API calls, EC2 CPU spikes, Lambda errors and throttles. CloudTrail should be on and encrypted too.

Everything needs proper tagging - project, environment, owner, cost center, compliance tags. Finance gets cranky without cost center tags.

Encryption at rest for everything: EBS volumes, S3, CloudWatch logs, RDS if we add it later. Use KMS CMKs, not AWS managed keys.

What I want to end up with:
- Clean code covering VPC, bastion, EC2 instances, S3, Lambda, KMS, alarms, and ACM
- Keep it simple for now - just split into `provider.tf` and `tap_stack.tf`, no fancy modules yet
- Multi-region support using provider aliases
- Variables for project_name, environment, regions, corporate_cidrs, lambda timeout/memory settings, and tags
- Outputs for VPC IDs, subnet IDs, bastion public DNS, private instance IDs, S3 bucket ARN, Lambda ARN, alarm ARNs, and ACM cert ARNs

Oh and it should pass tfsec/checkov without any high-severity findings when we run plan/apply/destroy.
