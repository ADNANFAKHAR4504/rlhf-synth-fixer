Need CDKTF (TypeScript) code to build a multi-environment AWS setup deployed consistently across **us-east-1** and **us-west-2**. Infra must support high availability, security, and PCI DSS compliance.

Main goals:

- Custom VPC per region with proper subnet allocation for HA
- Deploy in both regions:
  - Amazon RDS PostgreSQL (with replication + automated backups enabled)
  - DynamoDB table.
  - S3 bucket (replication enabled across regions)

- CloudFront distribution:
  - Serves global traffic from S3
  - Latency-based routing for performance
  - Protected with AWS WAF.

- IAM: roles + policies must be consistent across regions, following least privilege
- Route 53: DNS management + failover configurations across the two regions

Constraints:

- Resources deployed identically in **both regions**
- RDS PostgreSQL: multi-AZ, replication across regions, automated backups
- DynamoDB: For real-time sync
- S3: versioning + replication between us-east-1 and eu-west-1
- CloudFront + Route 53 configured for latency-based routing + failover
- AWS WAF enabled for CloudFront distribution
- Infra must comply with **PCI DSS** (encryption, IAM best practices, monitoring, logging)
- Code must be valid CDKTF (TypeScript), pass `cdktf synth` and `terraform plan/apply` without errors
