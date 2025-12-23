# PROMPT

I need to set up a basic AWS environment using CDK Python for our development team. Everything should be deployed to us-east-1.

Here's what I need:

## VPC Setup
Create a new VPC with CIDR 10.0.0.0/16. I need two public subnets spread across different availability zones for redundancy. Make sure DNS hostnames and DNS support are enabled.

## Internet Access
Attach an Internet Gateway to the VPC so instances can reach the internet. Set up the route tables properly.

## EC2 Instance
Spin up a t3.micro EC2 instance in one of the public subnets. It needs:
- A public IP address
- Amazon Linux 2023 AMI
- Placed in the public subnet

## Security Group
Create a security group that allows SSH access on port 22 from anywhere. I know this is open, but it's just for dev testing. We can lock it down later.

## Tagging
Tag everything with Project=CdkSetup so we can track costs and identify resources easily.

## Naming
Use a cdk- prefix for all resource names to keep things consistent and easy to find in the console.
