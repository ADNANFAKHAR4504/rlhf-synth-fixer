# CloudFormation Template for Multi-Tier Web App

Need a production-ready CloudFormation template in YAML that sets up a complete web application infrastructure with high availability.

## What to Deploy

Core components:
- Application Load Balancer distributing traffic to EC2 instances
- Auto Scaling Group managing EC2 fleet - scales based on demand
- Multi-AZ RDS database that the EC2 instances connect to for MySQL or Postgres
- S3 bucket for application storage that EC2 instances can write to
- CloudWatch for logs from ALB, EC2, and RDS
- VPC with proper networking: public/private subnets, NAT, IGW
- Security Groups controlling traffic between ALB, EC2, RDS, and S3
- IAM roles letting EC2 access S3, RDS, and CloudWatch

## Service Connectivity

The ALB sits in public subnets and forwards traffic to EC2 instances in private subnets. EC2 instances connect to the RDS database in private subnets through security group rules. EC2 instances write logs to CloudWatch and store files in S3 using IAM role permissions. All database credentials stored in Secrets Manager and accessed by EC2 at runtime.

Internet traffic hits ALB on port 80 or 443, ALB forwards to EC2 target group, EC2 connects to RDS on port 3306 for MySQL or 5432 for Postgres, EC2 pushes logs to CloudWatch Logs, EC2 writes and reads from S3 bucket.

## Required Parameters

Must include an EnvironmentSuffix parameter that accepts only letters, numbers, and hyphens, defaulting to pr4056. This lets us run multiple copies of the stack in parallel for different PR numbers or environments.

Also need these parameters:
- ProjectName - name of the project
- Environment - choose from dev, test, or prod
- AllowedCidr - which IP ranges can access the ALB
- InstanceType - EC2 instance size
- DBName, DBUsername, DBPassword - database settings, with NoEcho on the password
- VpcCidrBlock - IP range for the VPC

## Naming Convention

Every resource name must follow this pattern - combine the stack name, region, environment suffix, and a resource type identifier.

Examples of what resource names should look like:
- VPC name would be stackname-region-pr4056-vpc
- Public subnet would be stackname-region-pr4056-public-subnet-1
- EC2 instance would be stackname-region-pr4056-ec2-instance
- ALB would be stackname-region-pr4056-alb

Use CloudFormation pseudo parameters for stack name and region so it works in any account. This naming is required for all resources.

## Security Requirements

- S3 buckets must use server-side encryption with AES256
- CloudWatch Logs for app logs, system logs, and database logs
- Security Groups restrict access to the AllowedCidr range only
- IAM roles grant minimum permissions needed - no wildcards
- RDS in private subnets only, accessible through security groups

## Architecture

Networking:
- VPC spanning 2 availability zones
- Public subnets for the ALB
- Private subnets for EC2 and RDS
- Internet Gateway and NAT Gateways
- Route tables for each subnet type

Compute:
- Launch Template with user data
- Auto Scaling Group with minimum 2 instances for HA
- ALB with target group health checks

Database:
- Multi-AZ RDS for automatic failover
- Encrypted storage
- Log exports to CloudWatch

Storage:
- S3 bucket with versioning enabled
- Server-side encryption

IAM:
- Instance profile for EC2
- Policy allowing S3 read and write
- Policy allowing CloudWatch Logs write
- Policy allowing RDS Describe for connections

## Output

Single YAML file that:
- Deploys without any manual steps
- Works in any AWS account or region using pseudo parameters
- Includes comments for each major section
- Passes aws cloudformation validate-template
- Uses proper CloudFormation intrinsic functions like Ref, Sub, and GetAtt

The stack should be production-ready - handle failures automatically, scale up and down based on load, log everything, and be secure by default.
