Generate Terraform code in HCL that provisions a production-ready AWS environment with the following requirements. The solution must be split into only two files:

The provider.tf file defines the AWS provider configuration and includes the setup for a remote backend if needed. 

The main.tf file contains the definitions of all AWS resources used in the infrastructure.

Requirements:
Networking
Create a VPC with CIDR block 10.0.0.0/16 in region us-west-2.
Create public and private subnets across two availability zones.
Deploy an Internet Gateway and attach it to the VPC.
Configure route tables and associate them with subnets.

Compute & Scaling
Deploy EC2 instances in each private subnet.
Attach them to an Application Load Balancer (ALB).
Configure an Auto Scaling Group for EC2.
Set up CloudWatch Alarms to monitor CPU utilization.

Database
Create an RDS instance with Multi-AZ deployment.
Ensure daily automated backups using AWS Lambda.
Storage & Content Delivery
Deploy an S3 bucket with versioning enabled.
Configure a CloudFront distribution linked to the S3 bucket.

Security & Governance
Create IAM roles and policies needed for EC2, RDS, Lambda, and CloudWatch.
Define Security Groups with specific inbound/outbound rules.
Enable VPC Flow Logs.
Configure a VPN connection for secure access to the on-premises network.
Enable CloudTrail to log all API activity.
