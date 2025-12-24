Need a CloudFormation template for secure AWS infrastructure in us-east-1 that shows how security services integrate to protect the environment.

Build this as a connected system where:

EC2 instances run in private subnets inside a custom VPC and use IAM roles to access specific S3 bucket prefixes. Security groups allow only necessary traffic from specific sources. The instances send logs to CloudWatch through the VPC logging infrastructure and access Secrets Manager via VPC endpoints to retrieve RDS credentials without going over the internet.

S3 buckets are encrypted with KMS keys that IAM policies control for cross-service access. Enable bucket logging that sends access logs to a separate logging bucket. CloudTrail captures all API calls and writes encrypted audit logs to S3, with events flowing to CloudWatch for monitoring.

RDS database runs in private subnets with security groups allowing connections only from EC2 instances on port 3306. KMS encrypts the database at rest, with keys managed through IAM policies. Lambda functions in private subnets automatically rotate RDS credentials stored in Secrets Manager.

Lambda functions have IAM execution roles granting least-privilege access to read from Secrets Manager, write to CloudWatch logs, and update RDS credentials. Functions trigger when Secrets Manager schedules rotation, connecting to RDS through VPC endpoints.

VPC flow logs capture all network traffic and send to CloudWatch for security monitoring. CloudWatch metrics from EC2 and RDS connect to CloudWatch alarms that trigger on security events.

Isolate dev and prod environments with separate VPCs and encryption keys. Block default VPC creation. Tag all resources with env, owner, and project for tracking. Use Parameters for environment-specific config and Mappings for CIDR blocks per environment.
