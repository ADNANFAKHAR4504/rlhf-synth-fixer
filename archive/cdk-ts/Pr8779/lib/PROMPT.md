# Secure Infrastructure for Customer Data

I need to set up secure AWS infrastructure for our company that handles sensitive customer data. We're using CDK with TypeScript.

Here's what we need:

We need a VPC with both public and private subnets spread across two availability zones. The private subnets should be completely isolated - no NAT gateways to keep costs down and reduce attack surface.

For compute, we'll have EC2 instances that need proper IAM roles attached. These instances should be able to write logs to CloudWatch and decrypt data using KMS. Don't use IAM users - everything should go through roles. Make sure the role doesn't have more than 5 policies attached total.

We need two S3 buckets - one for actual data storage and another for access logs. The data bucket should log all access to the logs bucket. Both buckets need KMS encryption with a customer-managed key, versioning enabled, and all public access blocked. Add lifecycle rules to the data bucket that moves objects to Standard-IA after 30 days. Both buckets should enforce SSL connections only.

Set up a security group that only allows HTTPS traffic from internal networks - specifically from the 10.0.0.0/8 range. For egress, disable the default allow-all rule since we want tight control over outbound connections.

Everything should be encrypted with a single KMS key that has automatic rotation enabled. CloudWatch can use this key for encrypting logs, and S3 uses it for bucket encryption.

For naming, use a pattern like secure-company-ENV-resource where ENV comes from either props or context, defaulting to dev if neither is provided.

Make sure to export the VPC ID, both bucket names, the EC2 role ARN, and KMS key ARN so other stacks can reference them.

Deploy this to us-east-1.
