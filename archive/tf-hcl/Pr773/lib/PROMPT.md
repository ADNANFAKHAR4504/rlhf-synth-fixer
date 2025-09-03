Please generate a secure, multi-region Terraform config for a project named "Nova" in a single `main.tf` file (no modules). The response should be concise.

**Key Requirements:**
- **Regions:** `us-east-1` & `us-west-2`.
- **Network:** A VPC in each region with public/private subnets, NATs, and tight SGs, connected via VPC Peering.
- **Compute/DB:** In each private subnet, create a `t3.micro` EC2 and a Multi-AZ `t3.micro` PostgreSQL RDS.
- **Encryption:** Use a regional KMS key to encrypt everything (EBS, RDS). Also, create a primary S3 bucket (SSE-KMS) that replicates to a backup bucket.
- **IAM:** A single, least-privilege IAM Role for EC2s (for SSM, CloudWatch Logs, and S3 read).
- **Monitoring:** Enable VPC Flow Logs & CloudTrail, sending all logs to a central S3. Add basic EC2 CPU & RDS storage alarms.
- **Outputs:** Provide resource IDs only (no secrets).
