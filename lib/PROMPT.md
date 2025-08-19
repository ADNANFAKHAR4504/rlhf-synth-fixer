
I want to use terraform to build a secure AWS environment for a web app. The setup should be production-grade, multi-region ready, and follow least-privilege and encryption-by-default.

**Requirements:**

* **VPC**: I want it to span 2 AZs with at least 2 public + 2 private subnets.
* **Compute**: EC2 app instances should only live in private subnets; access should only be allowed via a bastion in public subnets.

* **Networking/Security**:

  * Security groups that deny all inbound except from specific corporate CIDRs (we'll make this a variable).
  * NAT for private subnets.
* **IAM**: roles with least privilege for all services (especially Lambda - that's where things usually go wrong).
* **S3**: versioning + SSE-KMS enforced, block public access, require TLS.
* **Lambda**: triggered on S3 object uploads, uses env vars (from SSM/Secrets Manager), with strict memory/timeout, logging, and DLQ.
* **TLS**: ACM certificates for HTTPS.
* **Monitoring**: CloudWatch alarms on unauthorized API calls, EC2 spikes, and Lambda errors/throttles. CloudTrail enabled and encrypted.
* **Tagging**: every resource tagged (project, env, owner, cost center, compliance).
* **Encryption**: all data at rest (EBS, S3, RDS if used, CW logs) with KMS CMKs.

**Expectations:**

* Well written code that covers (VPC, bastion, EC2 app, S3, Lambda, KMS, alarms, ACM).
* Let's not use Modular terraform just yet, just a separation of `provider.tf` and `main.tf` would work.

* Multi-region via provider aliases.

* Variables for `project_name`, `environment`, `regions`, `corporate_cidrs`, `lambda_timeout/memory`, tags.

* Outputs: VPC IDs, subnet IDs, bastion public DNS, private instance IDs, S3 bucket ARN, Lambda ARN, alarm ARNs, ACM certs.
* Plan/apply/destroy works cleanly with no high-severity tfsec/checkov findings.





