# AWS Multi-AZ Network Environment

Need to build a complete network environment in us-east-1 using CDKTF with Python. This should create a VPC that hosts EC2 instances across public and private subnets, with proper internet connectivity and secure remote state management.

## What I Need

Build a VPC with CIDR 10.0.0.0/16 that supports both public-facing and private application workloads. The VPC should span 2 availability zones like us-east-1a and us-east-1b for high availability.

For the public subnets, use 10.0.0.0/24 and 10.0.1.0/24 - these need to connect directly to the internet through an Internet Gateway so public instances can receive traffic. Deploy one t3.micro EC2 instance here for testing.

Private subnets should use 10.0.2.0/24 and 10.0.3.0/24. These instances can't have direct internet access, so set up a NAT Gateway with an Elastic IP in the first public subnet to provide egress for the private subnets. Put another t3.micro instance in a private subnet.

SSH access to all instances must be restricted to 203.0.113.0/24 only - configure security groups to enforce this.

For state management, configure S3 as the backend to store the Terraform state file, with DynamoDB providing state locking to prevent concurrent modifications.

Tag everything with Environment=Development so we can track resources.

## Implementation Notes

Put all the infrastructure code in `tap_stack.py` and wire it up through `tap.py` for synthesis. Need the basic VPC setup, subnets with route tables, internet gateway, NAT gateway, security groups, and the EC2 instances.

Make sure the outputs include VPC ID, subnet IDs, NAT gateway ID, and the public instance IP so we can access it after deployment.