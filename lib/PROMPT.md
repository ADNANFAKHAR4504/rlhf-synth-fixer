Generate a production-ready Terraform configuration in HCL syntax that builds the following complete AWS infrastructure.
Output only one file named main.tf.
Do not create any separate files (variables.tf, outputs.tf, backend.tf, tfvars, etc.).
A default provider.tf is already provided for AWS configuration.
Use secure, reusable, and fully functional Terraform constructs.

Infrastructure Requirements
Region: Deploy all resources in us-west-2.

Networking (VPC & Subnets):
Create a custom VPC with public and private subnets across at least two Availability Zones.
Include Internet Gateway, NAT Gateways, and proper Route Tables for public/private traffic separation.
Configure Security Groups and Network ACLs using the principle of least privilege.

Compute Layer (Web Tier):
Deploy an Auto Scaling Group (ASG) with a Launch Template running the latest Amazon Linux 2 AMI.
Maintain at least 2 EC2 instances across AZs.
Attach an Application Load Balancer (ALB) that distributes traffic evenly.

Load Balancing & DNS:
Create an ALB in public subnets and attach target groups.
Integrate with Route 53 using a domain alias (A or CNAME record) that points to the ALB.

Database Layer:
Deploy a Multi-AZ Amazon RDS PostgreSQL instance in private subnets.
Enable automated backups with 7-day retention.
Encrypt data at rest using KMS-managed keys.

Security & Compliance:
Implement AWS WAF on the ALB with AWS Managed Rule Sets.
Enforce encryption (EBS, RDS, S3 if applicable).
Create IAM Roles and Instance Profiles with least-privilege policies for EC2 and RDS.
Configure VPC Flow Logs and CloudTrail for audit and monitoring.

Monitoring & Logging:
Enable CloudWatch Logs and CloudWatch Alarms for EC2, RDS, and ALB health checks.
Include optional SNS notifications for alarm alerts.
Configuration Management:
Manage all sensitive data (DB credentials, app configs) via SSM Parameter Store.
Include Parameter retrieval logic for EC2 bootstrapping.