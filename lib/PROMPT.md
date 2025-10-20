Hey team,

I need a Terraform configuration that sets up a complete web application infrastructure on AWS. The goal is to have a production-ready, secure baseline that we can deploy in us-east-1. Everything should be consolidated into a single main.tf file to keep things simple and maintainable.

Here's what we need:

S3 Storage
- Create an S3 bucket with versioning turned on
- Make sure public access is completely blocked - we don't want any accidental exposures

IAM Setup
- Set up an IAM role that gives our EC2 instances read/write access to the S3 bucket
- Keep it least-privilege, only what's needed

VPC and Network Configuration
- Build out a new VPC from scratch
- Need two public subnets and two private subnets spread across two different Availability Zones
- Set up an Internet Gateway for the public subnets
- Configure NAT Gateway(s) so private subnets can reach the internet when needed

EC2 Instances:
- Deploy one EC2 instance in each public subnet (so two total)
- Use t2.micro instance type
- AMI ID should be configurable via a variable
- Each instance needs an Elastic IP attached
- Allow HTTP traffic on port 80

Auto Scaling
- Create an Auto Scaling Group to maintain at least one instance per public subnet
- Use a Launch Template or Launch Configuration for this

Security Groups
- Define a security group that allows HTTP (port 80) from anywhere
- Lock down everything else

Load Balancer
- Set up an Application Load Balancer
- Attach it to both public subnets
- Configure target groups and listeners to distribute traffic across both EC2 instances

Outputs
- Export the Load Balancer DNS name
- Export the S3 bucket name

Some key constraints:
- Use the latest stable AWS provider
- Everything in one file (main.tf) - no modules or separate files
- Must pass terraform validate and terraform plan
- Region should be us-east-1
- Follow AWS security best practices
- Use descriptive names for resources
- Public subnets route through the Internet Gateway
- Private subnets route through the NAT Gateway

The end result should be a single Terraform file that's ready to deploy. Make sure it's well-commented and organized logically so the team can easily understand and maintain it.