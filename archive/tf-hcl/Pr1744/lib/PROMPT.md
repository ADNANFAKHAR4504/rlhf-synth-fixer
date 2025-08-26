I need your help putting together a comprehensive Terraform configuration for a new, secure AWS environment we're building out. Think enterprise-grade, locked down, and compliant from the get-go. We're calling the project 'IaC - AWS Nova Model,' and it's a top priority.

The entire setup must be exclusively in the **`us-east-1`** region for compliance reasons.

Here's a rundown of what I need to build with **Terraform**:

First, let's tackle **networking**. I need a solid VPC structure to isolate our resources properly. This should include strict network traffic control using both Security Groups and NACLs. For our web-facing applications, we absolutely need to have AWS WAF configured to block common attacks. Also, let's make sure we're using DNSSEC for our Route 53 zones to secure our DNS.

Next up is **identity and access**. All IAM roles must be created with the principle of least privilege in mind—no `*` permissions anywhere. We also need a policy that enforces Multi-Factor Authentication (MFA) for all IAM users.

For **data security**, everything needs to be encrypted at rest. I'm talking S3 buckets, EBS volumes, RDS databases, you name it. We'll use AWS KMS to manage all the encryption keys, so the configuration should include setting that up securely. A crucial point here: all S3 buckets must be private by default, no exceptions.

Finally, we need robust **logging, monitoring, and compliance**. I want to see comprehensive logging and monitoring set up for all critical systems. We also need to use AWS Config to continuously audit our resource configurations to make sure we're not drifting from our security baseline. The end goal is to have a setup that would pass compliance checks against frameworks like **NIST** and **CIS**.

Could you please generate a single-file Terraform configuration at `./lib/tap_stack.tf` that includes:

* All variable declarations (including variables that describe aws_region for provider.tf), locals, resources, and outputs.
* Build all resources directly (no external modules). This is a brand-new stack.
* Follow best practices: least-privilege IAM, encryption where applicable, secure security groups, consistent tagging.
* Emit useful outputs for CI/CD and tests (no secrets).

**Assumptions:**

* If multiple environments/regions are needed, provider aliases are defined in provider.tf and referenced in tap_stack.tf.
