IDEAL RESPONSE SPECIFICATION

This document defines the expected behavior and outputs for a successful Terraform infrastructure deployment.

INFRASTRUCTURE COMPONENTS:
The ideal deployment should create the following AWS resources:
- 1 VPC with CIDR 10.0.0.0/16
- 2 public subnets across different availability zones
- 2 private subnets across different availability zones
- 1 Internet Gateway
- 2 NAT Gateways with Elastic IPs
- 4 route tables with proper associations
- 1 security group with SSH access restrictions
- 1 S3 bucket with encryption and public access blocking
- 1 IAM role with least privilege access to S3
- 1 IAM instance profile
- 2 EC2 instances in private subnets
- 2 CloudWatch alarms for CPU monitoring

EXPECTED OUTPUTS:
vpc_id: Should return a valid VPC ID starting with "vpc-"
public_subnet_ids: Should return array of 2 subnet IDs starting with "subnet-"
private_subnet_ids: Should return array of 2 subnet IDs starting with "subnet-"
logs_bucket_name: Should return S3 bucket name with prefix "production-logs-"
instance_ids: Should return array of 2 instance IDs starting with "i-"

NETWORK CONFIGURATION:
- VPC should have DNS resolution and DNS hostnames enabled
- Public subnets should auto-assign public IPs
- Private subnets should route internet traffic through NAT Gateways
- Each availability zone should have both public and private subnet
- Security group should allow SSH from 203.0.113.0/24 only

SECURITY REQUIREMENTS:
- S3 bucket must have server-side encryption with AES256
- S3 bucket must block all public access
- S3 bucket policy must enforce HTTPS connections only
- IAM role must follow least privilege principle
- EC2 instances must be in private subnets only

MONITORING SETUP:
- CloudWatch alarms should monitor CPU utilization
- Alarm threshold set to 70% CPU usage
- Evaluation period of 5 minutes with 2 data points
- Alarms should be created for each EC2 instance

TAGGING STANDARDS:
- All resources should have Environment = "Production" tag
- Resources should have descriptive Name tags
- Consistent naming convention with "production-" prefix

DEPLOYMENT VALIDATION:
- terraform plan should complete without errors
- terraform apply should create all resources successfully
- All outputs should return valid AWS resource identifiers
- Resources should be created in us-east-1 region
- No manual intervention should be required post-deployment
