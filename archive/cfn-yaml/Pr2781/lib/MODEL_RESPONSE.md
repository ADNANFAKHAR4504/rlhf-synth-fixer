Deliverable

A production-ready TapStack.yml that creates a fresh, secure, and highly available network + compute + storage foundation suitable for StackSets deployment across three AWS accounts. It requires no pre-existing resources.

What’s inside the template

VPC (10.0.0.0/16) with DNS support and hostnames.

Four subnets: 2 public + 2 private, split across AZs via GetAZs/Select.

Internet Gateway and public route table with default route to IGW.

NAT gateways (per-AZ toggle) with private route tables defaulting to NAT.

S3 bucket: unique name with account/region suffix, versioning, encryption (SSE-S3 or optional SSE-KMS), public access block, lifecycle (IA → Glacier, expiration, non-current cleanup).

IAM Role + Instance Profile for EC2 with least-privilege S3 access to the created bucket.

Two EC2 instances in private subnets, no public IPs, IMDSv2 required, encrypted gp3 root, simple bootstrap to ensure SSM agent.

Security Group: inbound SSH only from AllowedSSHRange, all egress allowed.

Parameters for naming, environment, SSH CIDR, instance type, optional key name, NAT per AZ toggle, lifecycle days, optional KMS key ARN.

Outputs for easy discovery (VPC, subnets, RTs, NATs, bucket, role/profile, instances, region, account).

