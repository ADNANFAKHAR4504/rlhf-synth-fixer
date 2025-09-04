Create a single-file Terraform configuration named main.tf for AWS that provisions a brand-new stack with these requirements:

All code (variables, locals, data sources, resources, and outputs) MUST live in one file: main.tf.

Use variable aws_region (declared in main.tf) which is referenced by provider.tf.

Multi-environment: dev, staging, prod. Use a validated environment variable and feature toggles:

Detailed monitoring for EC2 only in staging and prod.

NAT Gateway only in staging and prod (save cost in dev).

In dev, the EC2 instance lives in a public subnet with a public IP; in staging/prod, the instance lives in a private subnet with no public IP (egress via NAT).

Provision:

1 VPC (/16)

2 public and 2 private subnets across the first two AZs

Internet Gateway, route tables and associations

Conditional NAT (EIP + NAT GW + private default routes when enabled)

1 EC2 instance (Amazon Linux 2023), t3.micro by default

1 S3 bucket with blocking public access, SSE-S3, and versioning only in staging/prod

Networking/security:

Security Group for the instance; allow SSH (22) only from allowed_ssh_cidrs (list). If empty, create no SSH ingress rule. Allow all egress.

Variables:

project (used to namespace names), environment (dev|staging|prod), aws_region, vpc_cidr, public_subnet_cidrs, private_subnet_cidrs, instance_type, bucket_name (optional override), allowed_ssh_cidrs (list). Provide safe, sensible defaults for all except bucket_name.

Use locals for name prefixing, AZ selection, and feature toggles.

Outputs: VPC ID, subnet IDs, security group ID, instance ID, instance private/public IP (public only for dev), S3 bucket name, NAT GW ID (empty in dev).

No external modules; declare native AWS resources only.