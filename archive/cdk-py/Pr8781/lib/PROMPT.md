# PROMPT

I need to set up a basic AWS environment using CDK Python where an EC2 instance can be accessed via SSH from the internet. Everything should be deployed to us-east-1.

## Network Architecture
Create a VPC with CIDR 10.0.0.0/16 that connects to the internet through an Internet Gateway. The VPC needs two public subnets in different availability zones, each with route tables configured to send traffic to the Internet Gateway for outbound connectivity.

## EC2 Instance with Internet Access
Deploy a t3.micro EC2 instance running Amazon Linux 2023 in one of the public subnets. The instance should be assigned a public IP so it's reachable from the internet. The instance connects to the internet through the VPC's Internet Gateway via the subnet's route table.

## Security Group for SSH Access
Create a security group attached to the EC2 instance that allows inbound SSH connections on port 22. This security group controls which traffic can reach the EC2 instance - for now allow SSH from anywhere since this is a dev environment.

## How it all connects
The flow is: Internet -> Internet Gateway -> VPC Route Table -> Public Subnet -> Security Group -> EC2 Instance. The security group acts as a firewall filtering traffic before it reaches the instance.

## Tagging and Naming
Tag all resources with Project=CdkSetup for cost tracking. Use cdk- prefix for resource names so they're easy to identify in the AWS console.
