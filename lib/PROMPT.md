We're migrating our webapp from on-prem to AWS and need terraform code. This is for our production environment so it needs to be solid.

Here's how the infrastructure should connect:

The webapp runs on EC2 instances in private subnets across 2 AZs in us-east-1. An Application Load Balancer in public subnets receives incoming HTTPS traffic and distributes it to the EC2 instances. The EC2 instances autoscale based on CPU usage and connect to an RDS database in private subnets that stores application data.

For secrets, the EC2 instances pull database credentials from Secrets Manager at startup. The RDS database uses KMS encryption and stores password hashes from Secrets Manager.

The EC2 instances in private subnets access the internet through NAT Gateways for updates and external API calls. They write application logs to CloudWatch Logs which then get archived to an S3 bucket for long-term storage. The same S3 bucket receives daily database backups with versioning enabled.

CloudWatch Alarms monitor CPU utilization on EC2 instances and trigger autoscaling actions. Additional alarms track RDS connection counts and ALB response times, sending notifications when thresholds are breached.

For security, the VPC has public subnets for the ALB and NAT Gateway, and private subnets for EC2 instances and RDS. A VPN Gateway connects to our office network allowing secure admin access. IAM roles grant EC2 instances minimal permissions to access only Secrets Manager, CloudWatch, and the backup S3 bucket.

Some EC2 instances get Elastic IPs for stable outbound connections to partner APIs that whitelist by IP.

The migration has to happen with minimal downtime so the infrastructure needs to be bulletproof. Need separate terraform files that I can deploy piece by piece.