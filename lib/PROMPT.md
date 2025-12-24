## Prompt

I need a CDK TypeScript stack that creates enterprise security infrastructure with networking, encryption, and monitoring.

Set up a VPC with at least two public and two private subnets across multiple availability zones. Private subnets need internet access through NAT Gateways in the public subnets. The VPC connects to the internet via an Internet Gateway attached to public subnets.

Create a KMS Customer Managed Key with automatic rotation enabled. This key encrypts data at rest for S3 buckets and RDS databases. S3 buckets use this KMS key for server-side encryption and have versioning enabled. The RDS database uses the same KMS key for storage encryption.

EC2 instances should use IAM roles instead of static access keys. The IAM role connects to EC2 instances through instance profiles, allowing the instances to access AWS services without hardcoded credentials.

Deploy an ECS cluster with auto-scaling based on CPU utilization. The ECS services run in the VPC subnets and can scale up or down based on CloudWatch metrics.

Create CloudTrail that logs management events across multiple regions. CloudTrail connects to S3 buckets to store trail logs and can capture S3 data events for sensitive buckets.

Set up CloudWatch alarms that monitor EC2 CPU and memory metrics. The alarms connect to CloudWatch to track EC2 instance performance. Create separate alarms for RDS that monitor CPU utilization, database connections, and latency metrics.

Security groups should follow least-privilege - only allow traffic from specific sources like other security groups or known IP ranges. Avoid using 0.0.0.0/0 for management ports.

Enforce RDS instance type restrictions programmatically - only allow db.m5.large or db.m5.xlarge instance types using CDK Aspects.

## Output

Create these files:
- bin/tap.ts - CDK app entry point
- lib/tap-stack.ts - stack with all resources
- cdk.json - project config

Just give me the code, no explanations needed.
