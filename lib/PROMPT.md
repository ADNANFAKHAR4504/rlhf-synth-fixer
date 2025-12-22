You are an expert cloud infrastructure engineer. Create a secure, scalable web application environment on AWS using CloudFormation YAML. Deploy in us-east-1.

I need a three-tier web application where an Application Load Balancer routes HTTPS traffic to EC2 instances running in private subnets on port 443. The EC2 instances connect to an RDS MySQL database through security group rules that only allow database traffic from the application tier. The database sits in isolated private subnets with no internet access.

For static content delivery, an S3 bucket stores frontend assets and CloudFront distribution caches and serves this content globally to users. EC2 instances assume an IAM role with least-privilege access to read application config from S3 and write logs to a separate logging bucket.

The Auto Scaling Group monitors CloudWatch CPU utilization alarms and automatically scales EC2 instances when average CPU exceeds 70%. CloudWatch also tracks RDS burst balance metrics to alert before database performance degrades.

All data at rest must be encrypted - S3 buckets use KMS-managed keys, and RDS storage encryption uses the same KMS key for consistent key management across the stack.

Set up VPC Peering to connect this new VPC 10.1.0.0/16 to an existing VPC 10.0.0.0/16, allowing the application to communicate with legacy services in the peer VPC through route table entries.

Tag all resources with Environment and Owner keys for cost allocation tracking.

Generate a complete, deployable CloudFormation YAML template with clear resource names and helpful comments.
