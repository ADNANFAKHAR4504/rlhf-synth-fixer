# AWS Infrastructure Challenge

Hey there!

I'm working on a project where I need to set up a complete AWS infrastructure for a web application, and I could really use your help. I've been trying to piece this together myself, but I keep running into issues with the networking setup and making sure everything follows security best practices.

## What I'm Looking For

I need someone with solid AWS experience like a Solutions Architect to create a CloudFormation YAML template that will build out a production-ready environment in us-east-1. This isn't just a lab exercise - it's going to be used for a real application, so security and reliability are top priorities.

## The Requirements

Here's what I need the infrastructure to include:

### 1. Networking Layer

- A fresh VPC with a CIDR that makes sense for the setup
- One public subnet and one private subnet spread across at least 2 AZs for redundancy
- Internet Gateway attached to the VPC so public subnets can reach the internet
- NAT Gateway in the public subnet so private subnet resources can make outbound connections
- Route tables configured so public subnets route through the Internet Gateway and private subnets route through the NAT Gateway

### 2. Compute Resources

- An Auto Scaling Group with EC2 instances that launch in the private subnets
- Security groups configured so EC2 instances can communicate with RDS on the database port
- IAM role attached to EC2 instances that grants permissions to write backup files to S3
- The instances should be distributed across both availability zones for fault tolerance
- Auto Scaling configured to scale up when CPU utilization is high and scale down when traffic drops

### 3. Database Setup

- An RDS instance deployed in the private subnets with encryption at rest enabled
- At least one read replica in a different availability zone for performance and backup purposes
- Security group rules allowing EC2 instances to connect to RDS on the database port
- I've had issues with database connectivity before, so please make sure the security groups and subnet routing are configured correctly

### 4. Storage

- An S3 bucket for application backups with server-side encryption enabled
- Bucket policy restricting access to only the IAM role attached to EC2 instances
- EC2 instances should be able to write backup files to this bucket using the IAM role permissions

### 5. Monitoring & Observability

- CloudWatch log groups for EC2 instances to stream application logs
- CloudWatch log groups for RDS to capture database audit logs
- CloudWatch alarms monitoring EC2 CPU utilization to trigger Auto Scaling
- CloudWatch alarms for RDS connection count and CPU utilization
- I want to be able to see what's happening when things go wrong, so make sure the logging is comprehensive

### 6. Security

- IAM roles and policies following the principle of least privilege
- EC2 instance role with only the S3 permissions needed for backup operations
- Encryption at rest enabled for EBS volumes, RDS database, and S3 bucket
- Security groups with minimal required ports open - only database port between EC2 and RDS
- No overly permissive policies - I've seen too many security breaches from wide-open access

### 7. Outputs

- Clear outputs for VPC ID, Public Subnet IDs, Private Subnet IDs, RDS endpoint, S3 bucket name, and other important resource IDs
- I need these for integration with other tools and for connecting applications to the database

## What I Need From You

Please create a CloudFormation YAML template that:

- Follows AWS best practices - I'm not cutting corners here
- Uses only AWS managed services - no third-party stuff
- Actually works when deployed - I've had templates that look good but fail at deployment time
- Includes proper validation and error handling

I'm planning to use this in a production environment, so it needs to be rock-solid. I've learned the hard way that infrastructure that works in dev doesn't always work in prod.

Thanks in advance for your help. I really appreciate it!
