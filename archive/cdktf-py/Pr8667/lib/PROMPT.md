# Python CDKTF for Production VPC Environment

Need to build a production VPC setup using Python CDKTF. The infrastructure should handle a multi-tier application with proper security and high availability.

## What I need

### Core networking

Set up a VPC with CIDR 10.0.0.0/16 across 2 availability zones in us-east-1. Need both public and private subnets:
- Public subnets for internet-facing resources - 10.0.1.0/24 and 10.0.2.0/24
- Private subnets for app servers - 10.0.10.0/24 and 10.0.11.0/24

Private subnets need outbound internet access through NAT gateways placed in the public subnets. Make sure each private subnet routes through its own NAT gateway for high availability.

### Application servers

Launch t2.micro EC2 instances in the private subnets. These will run the application tier and need to be isolated from direct internet access.

The instances must write application logs to an S3 bucket, so set up IAM roles with the right permissions for S3 read/write access to that specific bucket.

### Security

Create security groups that restrict SSH access to 203.0.113.0/24 only. Don't open up unnecessary ports - keep it locked down to what's actually needed.

Enable server-side encryption on the S3 logs bucket.

### Monitoring

Set up CloudWatch alarms that trigger when EC2 CPU usage goes over 70%. Need to know if the instances are getting overloaded.

### Tags and standards

Everything needs to be tagged with Environment: Production. Use AWS provider version 3.0 or higher.

## Project structure

- tap_stack.py - all the resource definitions go here
- tap.py - entrypoint that synthesizes the Terraform config

The synthesized output should pass terraform validate.
