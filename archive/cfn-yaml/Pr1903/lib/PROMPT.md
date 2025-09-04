# AWS Infrastructure Challenge

Hey there!

I'm working on a project where I need to set up a complete AWS infrastructure for a web application, and I could really use your help. I've been trying to piece this together myself, but I keep running into issues with the networking setup and making sure everything follows security best practices.

## What I'm Looking For

I need someone with solid AWS experience (like a Solutions Architect) to create a CloudFormation YAML template that will build out a production-ready environment in us-east-1. This isn't just a lab exercise - it's going to be used for a real application, so security and reliability are top priorities.

## The Requirements

Here's what I need the infrastructure to include:

### 1. Networking Layer
- A fresh VPC (you can pick whatever CIDR makes sense)
- One public subnet and one private subnet
- These should be spread across at least 2 AZs for redundancy (you know how AWS can be with availability zones sometimes)

### 2. Compute Resources
- An Auto Scaling Group with EC2 instances
- The instances should be distributed across both subnets for fault tolerance
- Make sure it can scale up/down as needed

### 3. Database Setup
- An RDS instance as the main database
- At least one read replica (for performance and backup purposes)
- I've had issues with database connectivity before, so please make sure the networking is solid

### 4. Storage
- An S3 bucket for application backups
- Must have encryption enabled (I'm paranoid about data security)

### 5. Monitoring & Observability
- CloudWatch logging for EC2 and RDS
- Any other services that should be monitored
- I want to be able to see what's happening when things go wrong

### 6. Security (This is Critical!)
- IAM roles and policies following the principle of least privilege
- Encryption at rest everywhere possible (EBS, RDS, S3)
- No overly permissive policies - I've seen too many security breaches

### 7. Outputs
- Clear outputs for VPC ID, Public Subnet ID, and other important resource IDs
- I need these for integration with other tools

## What I Need From You

Please create a CloudFormation YAML template that:
- Follows AWS best practices (I'm not cutting corners here)
- Uses only AWS managed services (no third-party stuff)
- Actually works when deployed (I've had templates that look good but fail)
- Includes proper validation and error handling

I'm planning to use this in a production environment, so it needs to be rock-solid. I've learned the hard way that infrastructure that works in dev doesn't always work in prod!

Thanks in advance for your help. I really appreciate it!
