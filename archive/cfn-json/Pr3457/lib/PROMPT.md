Create a production-ready CloudFormation JSON template for a highly available web application infrastructure on AWS following security best practices.

Infrastructure Requirements: VPC with 10.0.0.0/16 CIDR across 2 AZs. Public subnets 10.0.1.0/24 and 10.0.2.0/24 for ALB and NAT Gateway. Private subnet 10.0.10.0/24 for EC2 instances. Database subnets 10.0.20.0/24 and 10.0.21.0/24 for RDS.

Compute Configuration: Auto Scaling Group with 2-4-10 instances using t3.medium Amazon Linux 2023 AMI in private subnets only. Launch Template with encrypted 20GB root and 100GB data volumes. CPU-based scaling at 70% target. ELB health checks with 300s grace period.

Load Balancer: Application Load Balancer in public subnets with HTTP/HTTPS listeners. Target group with /health endpoint and sticky sessions enabled.

Database: MySQL 8.0 RDS Multi-AZ with db.t3.medium, 100GB encrypted storage, auto-scaling to 500GB. 7-day backups during 03:00-04:00 UTC maintenance window.

Security: Three security groups with restricted access - ALB allows HTTP/HTTPS from internet, EC2 allows HTTP from ALB only and HTTPS egress, RDS allows MySQL from EC2 only. IAM role with SSM and CloudWatch permissions.

Parameters: EnvironmentName, KeyPairName, DatabaseUsername. Secrets Manager for database password.

Outputs: VPC ID, subnet IDs, ALB DNS, RDS endpoint, ASG name, security group ID, IAM role ARN for cross-stack references.
