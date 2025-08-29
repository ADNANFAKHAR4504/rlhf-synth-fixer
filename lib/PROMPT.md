# Pulumi TypeScript: Secure, Scalable Infrastructure

I need a Pulumi TypeScript implementation that sets up a secure, highly available cloud environment. The infrastructure must span two availability zones within a single AWS region and follow best practices for security, scalability, and operational compliance. Here's what it should include:

- A VPC with at least one public and one private subnet in each of two Availability Zones
- All outbound traffic from private subnets should be routed through a NAT Gateway
- An Application Load Balancer (ALB) in the public subnets to handle HTTP(S) traffic
- ALB access logging must be enabled and sent to a secure, encrypted S3 bucket
- A DynamoDB table (instead of RDS) with:
  - **Provisioned (warm) throughput** using specified read/write capacity units
  - Encryption at rest using AWS KMS
  - Point-in-Time Recovery (PITR) enabled
- Use AWS WAF in front of a CloudFront distribution for DDoS protection
- All logs (from CloudWatch, ALB, etc.) must be encrypted with AWS KMS, if possible
- All S3 buckets must:
  - Enforce SSL for data in transit
  - Block all public access
  - Be encrypted using KMS
- EC2 services must be configured with a desired count ≥ 2 for high availability
- Use AWS Secrets Manager to manage all sensitive configuration values
- Apply Pulumi AWS Providers explicitly per region to keep deployments configurable and deterministic

Use one code block per file so I can copy and paste it directly. If the response exceeds the output limit, continue seamlessly across multiple outputs until the entire task is fully completed. Make sure all the code is present in a single file which can be instantiated.
