Hey team,

We need to build out a VPC infrastructure in AWS using Terraform. The goal here is to create a secure, scalable network setup in us-west-2 that follows best practices. Everything should go into Terraform code so we can version control it and deploy consistently.

## What We're Building

So basically we need a full VPC setup with public and private subnets across multiple availability zones. The private subnets will house our EC2 instances, and they'll need to access an S3 bucket securely. Here's the breakdown:

### Network Layout

Start with a VPC using the 10.0.0.0/16 CIDR block in us-west-2. Make sure DNS hostnames and DNS support are enabled since we'll need that for internal service discovery.

For subnets, we need 3 public and 3 private subnets spread across three AZs (us-west-2a, us-west-2b, us-west-2c). Tag them clearly like PublicSubnet1, PrivateSubnet1, etc. so we can identify them easily.

### Internet Connectivity

Attach an Internet Gateway to the VPC for public subnet internet access. Then provision NAT Gateways in each public subnet with Elastic IPs. Each private subnet should route its outbound traffic through its corresponding NAT Gateway.

### Routing Setup

Create route tables to handle traffic properly. One route table for all public subnets that routes to the Internet Gateway. Separate route tables for private subnets that route through the NAT Gateways. Associate each subnet with the right route table.

### S3 Storage

Create an S3 bucket with these settings:
- Versioning enabled
- All public access blocked
- Server-side encryption using AES256
- Bucket policy that restricts access to only the VPC or our IAM role

### IAM Permissions

Set up an IAM role and policy that lets EC2 instances read and write to the S3 bucket. The instances shouldn't use access keys, just the IAM role. Attach this role to an IAM Instance Profile that we can assign to the EC2 instances.

### EC2 Instances

Launch t2.micro instances in each of the three private subnets. Attach the IAM Instance Profile for S3 access. Create a security group that:
- Allows SSH only from a specific IP address (we'll parameterize this)
- Allows internal VPC traffic as needed

Use the latest Amazon Linux 2 AMI from us-west-2.

## Configuration Variables

Make sure to parameterize these so we can reuse the code:
- region
- vpc_cidr
- public_subnet_cidrs
- private_subnet_cidrs
- allowed_ssh_ip
- instance_type
- bucket_name

Use sensible defaults where it makes sense.

## Outputs We Need

The Terraform should output:
- vpc_id
- public_subnet_ids
- private_subnet_ids
- nat_gateway_ids
- ec2_instance_ids
- s3_bucket_name

## Important Constraints

A few things to keep in mind:
- Everything deploys to us-west-2
- VPC CIDR must be exactly 10.0.0.0/16
- Exactly 3 public and 3 private subnets across 3 AZs
- NAT Gateways only in public subnets
- Private subnets should not have direct routes to the Internet Gateway
- S3 bucket must block all public access and have versioning on
- EC2 instances must use IAM roles for S3 access, not hardcoded keys
- Use Terraform AWS Provider version 5.0 or newer
- Put all code in a single Terraform file (main.tf)
- No external modules or separate files needed

## What You Should Deliver

Generate a single main.tf file that includes:
- All resource definitions (VPC, subnets, NATs, route tables, EC2, S3, IAM, etc.)
- Variable definitions and outputs in the same file
- Correct Terraform syntax that will actually work
- Comments explaining the major sections and any security best practices
- Something that's ready to deploy - running terraform init && terraform apply should just work

The code should be clean and readable. Add comments where they help, but don't go overboard. Just make it clear what each major block is doing and why.

Thanks!
