Hey team,

We need to build a secure and production-ready network infrastructure for our AWS environment using Terraform. This is going to serve as the backbone for our production workloads, so security and scalability are critical. Let me break down what we need.

## Network Infrastructure Requirements

We need a VPC called prod-VPC with a proper multi-AZ setup. I want two Availability Zones with both public and private subnets in each:

- Public subnets: prod-subnet-public-a, prod-subnet-public-b  
- Private subnets: prod-subnet-private-a, prod-subnet-private-b

Make sure we have proper CIDR allocation and tag everything consistently.

## Internet Access & NAT Gateways

Set up NAT Gateways in each public subnet - we need high availability here, so one NAT per AZ. Each NAT should have its own Elastic IP. The private subnets need to route outbound traffic through these NAT Gateways for internet access.

Also need an Internet Gateway attached to the VPC with proper routing for the public subnets.

## Security Groups

Create two security groups with least privilege access:

**Web server security group:**
- SSH access (port 22) only from our office CIDR range - definitely not from 0.0.0.0/0!
- HTTP access (port 80) from anywhere for web traffic

**Private instance security group:**
- Only allow HTTPS outbound (port 443) 
- Restrict everything else - we want tight control here

## IAM Setup:

Need an IAM Role for our EC2 instances with read-only access to our S3 backup bucket. Set this up with proper IAM Policy and Instance Profile - no hardcoded credentials anywhere.

## Monitoring & VPN

Enable VPC Flow Logs and send them to CloudWatch Logs. Set up a CloudWatch Alarm to detect potential DDoS activity when traffic spikes above normal thresholds.

For secure remote access, implement a VPN Gateway and associate it with the VPC.

## Naming and Compliance

Follow our standard naming conventions:
- VPC: prod-VPC
- Subnets: prod-subnet-public-a, prod-subnet-private-b, etc.
- Use organization-approved secure AMIs only
- Tag everything consistently for environment and ownership

## Technical Constraints

Put everything in a single Terraform file (main.tf) - no modules for this one. The template needs to be valid and deployable. Keep security tight with least privilege IAM and minimal open ports.

Use variables and locals for AZs, CIDR ranges, and consistent naming. Make sure all the subnet routing and NAT Gateway dependencies are handled properly.

Keep the code organized with comments and logical grouping even though it's all in one file.

## What I Need

A single Terraform file that:
- Defines all the AWS resources listed above
- Implements secure network segmentation  
- Provides internet access via NAT Gateways for private subnets only
- Includes IAM roles, logging, monitoring, and VPN Gateway
- Follows Terraform best practices with proper tagging and dependencies
- Passes our security and compliance checks for production use

The output needs to be ready to deploy with `terraform apply` after initialization. Make sure the HCL syntax is correct and include inline comments explaining each resource.

This is going into production, so let's make sure it's solid!