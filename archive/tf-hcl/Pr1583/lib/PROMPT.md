# AWS Secure Web Application Infrastructure

We need to build a secure AWS environment using Terraform to host a web application. The goal is to create a production-ready setup that follows AWS security best practices while keeping things modular and readable.

## What we need to build

**VPC Setup:**

- VPC named `secure-network` in us-west-2 region
- Public subnets for web tier
- Internet gateway for public access
- Route tables to connect everything

**Network Security:**

- Security groups allowing only HTTP (80) and HTTPS (443) inbound
- All outbound traffic allowed for updates and API calls
- Network ACLs for additional subnet-level protection
- Follow AWS networking best practices

**Compute Resources:**

- EC2 instance in the public subnet
- Attach security group created above
- Public internet access through IGW (no NAT needed)
- Minimal IAM permissions - only what's actually needed

**Storage (S3):**

- S3 bucket for web application logs
- Server-side encryption enabled (AES-256 or KMS)
- Restrict write access to just the EC2 instance
- Follow least privilege principle

**IAM Security:**

- IAM role for the EC2 instance
- IAM policy with minimal permissions
- Only s3:PutObject access to the log bucket

## Technical requirements

All resources need this tag:
Environment = "Production"

## Important notes

- Don't touch the provider.tf - it already has the AWS provider and S3 backend configured
- The aws_region variable must be declared in tap_stack.tf (provider.tf uses it)
- Integration tests read from cfn-outputs/all-outputs.json that CI/CD creates
- Tests shouldn't run terraform commands during the test phase

Keep security tight but don't over-engineer it.
