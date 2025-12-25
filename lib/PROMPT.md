# Task: Cloud Environment Setup with CloudFormation

## Objective
Design a CloudFormation template in YAML to set up a web application environment in AWS that satisfies the following requirements.

## Requirements

### Infrastructure Components

1. **Virtual Private Cloud - VPC**
   - CIDR block: 10.0.0.0/16

2. **Subnets**
   - Two public subnets in different availability zones, each with CIDR block 10.0.1.0/24
   - Two private subnets in different availability zones, each with CIDR block 10.0.2.0/24

3. **Networking**
   - Internet Gateway attached to the VPC for public subnet traffic
   - NAT Gateway in one of the public subnets for private subnet outbound access
   - Route Tables associated with each subnet with appropriate routing configurations

4. **Compute Resources**
   - Application Load Balancer that distributes traffic across two EC2 instances in the private subnets
   - EC2 instances using AMI ID: ami-0abcdef1234567890
   - Instance type: t2.micro
   - Termination protection enabled for all EC2 instances

5. **Security**
   - Security groups configured to:
     - Allow inbound HTTP traffic on port 80 to the load balancer
     - Allow SSH access on port 22 to EC2 instances from a provided IP range
   - Load balancer accessible only over HTTP on port 80

6. **IAM and Monitoring**
   - IAM roles for EC2 instances to interact with S3 and log to CloudWatch
   - CloudWatch configuration for logging all API gateway requests

7. **Outputs**
   - Stack should output the DNS name of the load balancer

## Deployment Region
us-west-2

## Expected Deliverable
A CloudFormation YAML template that defines the specified infrastructure, which when deployed in AWS, should produce an environment meeting all the listed requirements and constraints.