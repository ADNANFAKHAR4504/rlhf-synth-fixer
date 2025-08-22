# Task: Cloud Environment Setup with CloudFormation YAML

## Task ID: trainr956

## Problem Statement
You are tasked with setting up a basic AWS infrastructure using CloudFormation in YAML format. The main components should include VPC, subnets, an Internet Gateway, a Route Table, a Security Group, and an EC2 instance. The deployment should meet several specific constraints such as CIDR blocks, security rules, and naming conventions.

## Requirements
1. Define a new VPC with a CIDR block '10.0.0.0/16'
2. Create two public subnets within this VPC
3. Configure Internet access by attaching an Internet Gateway and associating a Route Table for external traffic routing
4. Set up a Security Group with rules for HTTP and SSH access
5. Launch a t2.micro EC2 instance in one of the subnets with Apache HTTP server installed
6. Ensure the infrastructure is compliant with provided constraints including naming conventions

## Environment Details
- Target Region: us-east-1
- VPC CIDR: 10.0.0.0/16
- Subnet CIDRs: 10.0.1.0/24 and 10.0.2.0/24
- Instance Type: t2.micro
- Key Pair: my-key (must exist)

## Constraints
1. Use AWS CloudFormation to define the infrastructure
2. The resources must be created within the 'us-east-1' region
3. Define a VPC with IPv4 CIDR block '10.0.0.0/16'
4. Create two public subnets with CIDR blocks '10.0.1.0/24' and '10.0.2.0/24'
5. Include an Internet Gateway and attach it to the VPC
6. Define a new Route Table and associate it with both subnets
7. Ensure the Route Table routes external traffic (0.0.0.0/0) to the Internet Gateway
8. Set up a Security Group allowing inbound HTTP (port 80) and SSH (port 22) access
9. Create an EC2 instance in one of the public subnets, using a t2.micro instance type
10. Use an existing KeyPair named 'my-key' for SSH access to the EC2 instance
11. Install a basic Apache HTTP server on the EC2 instance upon launch
12. Allocate an Elastic IP and associate it with the EC2 instance
13. Configure proper IAM roles and policies to allow the EC2 instance to describe instances
14. Ensure all resources have identifiers following the naming convention '<resource-type>-<project-name>-<unique-id>'

## Expected Output
A valid CloudFormation YAML template that can launch the described infrastructure with these configurations. The solution should reflect effective use of CloudFormation's capabilities and best practices.