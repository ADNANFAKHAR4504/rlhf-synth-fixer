# Secure Cloud Infrastructure Setup

I need help setting up a secure AWS infrastructure using Terraform. Here are the requirements:

1. Create a VPC with both public and private subnets across two Availability Zones in us-east-1
2. Add a NAT Gateway so instances in the private subnet can access the internet for outbound traffic
3. Set up an S3 bucket that requires server-side encryption for all uploads
4. Create a security group that only allows SSH access from 192.168.1.0/24 IP range
5. Tag everything for Production environment

I'd also like to use some newer AWS features if possible - maybe CloudFront VPC Origins or enhanced S3 gateway endpoints for better security.

Can you provide the Terraform configuration files needed for this setup? Please put each resource in separate files if that makes sense for organization.