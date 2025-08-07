✅ Refined CloudFormation Prompt
You are tasked with designing an AWS CloudFormation YAML template to provision a secure, scalable, and highly available web application architecture. This infrastructure will be deployed into an existing VPC and must comply with AWS best practices for security, availability, and operational excellence.

✅ Core Requirements
VPC & Subnet Configuration

Use existing VPC: vpc-123abcde.

Configure public and private subnets across multiple Availability Zones.

Allocate an Elastic IP and create a NAT Gateway in the public subnet for internet-bound traffic from private subnets.

EC2 Instances

Use Amazon Linux 2 AMI.

All instances must be of type t3.medium.

Place EC2 instances in Auto Scaling Groups across multiple AZs.

Attach an IAM role that provides the least privilege required, including SSM access for patching via AWS Systems Manager.

Add CloudWatch logging and alarms to monitor CPU utilization and instance status.

Restrict SSH access to a specific IP CIDR (e.g., 203.0.113.0/24).

Application Load Balancer (ALB)

Configure an internet-facing ALB.

ALB should distribute traffic evenly across EC2 instances in Auto Scaling Group.

Use listener rules to route traffic to the appropriate target group.

Amazon RDS (MySQL)

Use db.t3.medium instance class.

Enable Multi-AZ deployment for high availability.

Place RDS instances in private subnets only.

Create a security group that allows access to MySQL only from the EC2 security group on port 3306.

S3 Buckets

Create encrypted S3 buckets using AES-256 encryption.

Apply bucket policies to restrict access to specific IP ranges.

Ensure public access is blocked.

IAM & Security

Define IAM roles and instance profiles for EC2 with least privilege.

Enable AWS Systems Manager for automation and patch management.

Set up CloudTrail to log all API calls across the account.

Monitoring & Logging

Enable CloudWatch Alarms for EC2 (e.g., CPUUtilization > 80%).

Stream application logs from EC2 instances to CloudWatch Logs.

Enable CloudTrail for full auditability of the environment.

Tagging

Tag all resources with Environment: Production.

✅ Constraints & Compliance
Use only t3.medium for EC2 and RDS.

Use Amazon Linux 2 AMI.

Follow least privilege principle for IAM roles.

All S3 buckets must be encrypted and access controlled.

All EC2s must be managed via SSM, not directly accessed.

Ensure multi-AZ deployment for both EC2 and RDS.

SSH access must be restricted by IP CIDR.

ALB should be highly available and fault tolerant.

All outputs and resources must be audit-ready and follow AWS Well-Architected Framework principles.
