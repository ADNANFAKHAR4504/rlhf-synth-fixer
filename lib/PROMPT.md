# Secure Multi-Tier AWS Infrastructure

I need a CloudFormation template that provisions a production-ready multi-tier architecture with comprehensive security controls in us-east-1.

## Network Layer

Set up a VPC with two public and two private subnets spread across different Availability Zones. The public subnets connect to an Internet Gateway for external access, while the private subnets route outbound traffic through NAT Gateways. EC2 instances in the private subnets receive traffic from the Application Load Balancer through security group rules that only allow HTTP on port 80.

## Compute and Database

Deploy EC2 instances in the private subnets with EBS volumes encrypted using a dedicated KMS key. The instances connect to a Multi-AZ RDS MySQL database through a security group that restricts traffic to the database port from the EC2 security group only. RDS stores automated backups in an S3 bucket that receives snapshots with server-side encryption enabled. The database uses a separate KMS key for storage encryption and retains backups for at least 7 days.

## Application Security

Place an Application Load Balancer in the public subnets that distributes incoming HTTPS traffic to the EC2 instances. Attach a WAF WebACL to the ALB that filters malicious requests before they reach the backend. Configure Lambda functions with environment variables encrypted using a dedicated KMS key, and attach IAM roles following least privilege that only grant access to the specific DynamoDB tables and S3 buckets the functions need.

## Monitoring and Alerts

Wire up CloudWatch alarms that monitor EC2 CPU utilization, RDS storage capacity, and Lambda error rates. When thresholds are exceeded, the alarms send notifications to an SNS topic that forwards alerts to the operations team. Enable CloudWatch Logs export from RDS so database activity flows to CloudWatch for analysis.

## Security Requirements

Every S3 bucket must block public access and enable versioning. Security groups should restrict SSH access to a defined IP whitelist rather than allowing traffic from anywhere. IAM roles must scope access to specific resource ARNs instead of using wildcards.
