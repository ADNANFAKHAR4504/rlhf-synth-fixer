# Prompt
Use an existing VPC with specified CIDR block for the infrastructure setup.
Ensure that all resources are tagged with 'Environment: Dev' for development stage identification.
Create a security group allowing inbound SSH (port 22) and HTTP (port 80) access from any IP address.
Set up an EC2 instance using the latest Amazon Linux 2 AMI.
Attach an Elastic IP to the EC2 instance for static IP address allocation.
Provision an S3 bucket with block public access enabled and versioning configured for backups.
Deploy an RDS instance with MySQL engine, within the existing VPC subnet.
Ensure that the RDS subnet group correctly references two availability zones for high availability.
Configure an IAM role for the EC2 instance with S3 full access and RDS read-only access.
Allow user-data to initialize the EC2 instance with a simple HTTP server on launch.
Provision the infrastructure using aws cdk

**Instructions:**
The infrastructure is to be deployed in AWS region us-east-1. 
The existing VPC to be used for deployments has the CIDR block '10.0.0.0/16'.
Resources must be appropriately distributed across availability zones 'us-east-1a' and 'us-east-1b' for high availability.
