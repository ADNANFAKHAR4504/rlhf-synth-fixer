Create AWS infrastructure using CDK TypeScript for a secure multi-region environment where web application servers connect to backend databases through isolated network tiers.

Deploy a VPC in us-east-1 with public and private subnets spread across 2 availability zones. NAT gateways in each public subnet provide outbound internet access for resources in the private subnets. Configure cross-region replication capabilities to us-west-2 for disaster recovery.

EC2 instances running in private subnets connect to RDS PostgreSQL databases through security group rules that only allow traffic on port 5432 from the application tier. The RDS instances sit in isolated database subnets with no direct internet access, and encryption at rest protects stored data.

Application servers retrieve database credentials from Secrets Manager through IAM roles attached to the EC2 instances. These roles follow least privilege principles, granting only the specific permissions needed for Secrets Manager access and S3 bucket operations. Parameter Store holds application configuration that EC2 instances fetch at startup.

S3 buckets store application assets and logs, with EC2 instances connecting through VPC endpoints to keep traffic within the AWS network. Enable versioning and server-side encryption on all buckets.

CloudWatch monitors the entire stack by collecting metrics from EC2 instances and RDS databases. VPC flow logs stream to CloudWatch Logs for network traffic analysis. Configure alarms that trigger when CPU utilization exceeds thresholds or database connections spike.

GuardDuty monitors VPC flow logs and CloudTrail events to detect threats like unauthorized access attempts or unusual API activity patterns across the environment.

Use naming convention: project-environment-resource
Include these tags on all resources: Environment, ProjectName, CostCenter

Generate infrastructure code with one code block per file. Focus on security best practices and cost optimization.
