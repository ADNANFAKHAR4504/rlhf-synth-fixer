Create a production-grade AWS infrastructure in the us-east-1 region using CDKTF (TypeScript) with the following requirements:

Core Infrastructure:

- VPC with public and private subnets across 2 or more availability zones
- NAT Gateways for each availability zone for high availability
- Internet Gateway with proper routing

Compute & Networking:

- Bastion host in the public subnet for SSH access from trusted IPs only
- EC2 fleet in private subnets with an Application Load Balancer
- Application Load Balancer with health checks
- Security groups with least-privilege access 

Database & Storage:

- Multi-AZ RDS MySQL with encryption
- S3 buckets with versioning, KMS encryption, and access logging
- Bucket policies that require secure transport and encryption

Security & Compliance:

- Customer-managed KMS key with rotation
- IAM roles with least-privilege policies
- VPC Flow Logs sent to CloudWatch
- GuardDuty enabled
- VPC endpoints for S3, SSM, CloudWatch, and KMS
- IMDSv2 enforced on all EC2 instances

Monitoring & Observability:

- CloudWatch alarms for EC2 including CPU and status checks
- ALB alarms for unhealthy hosts, response time, and 5xx errors
- RDS alarms for CPU, storage, connections, and latency
- SNS topic for email notifications

Management:

- SSM Session Manager with VPC endpoints
- SSM documents for session preferences and patching
- CloudWatch Log Groups for flow logs and SSM

Requirements:

- Modular TypeScript code with separate functions for each component
- Type definitions for all resources
- Configuration validation
- Terraform outputs for key resource identifiers
- S3 backend with state locking
- Configurable environment and region