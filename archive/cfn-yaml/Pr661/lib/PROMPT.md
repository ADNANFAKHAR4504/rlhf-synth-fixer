Please find below a detailed prompt for creating an AWS CloudFormation YAML template to set up a highly available network.

Network Structure
VPC Definition:

Define a new Virtual Private Cloud (VPC) with a CIDR block of 10.0.0.0/16.
The VPC should be designed for high availability, spanning two distinct Availability Zones.

Subnets:
Create two public subnets, one in each of the two chosen Availability Zones.
Assign appropriate CIDR blocks, for example, 10.0.1.0/24 and 10.0.2.0/24.
Ensure MapPublicIpOnLaunch is set to true for these subnets.
Create two private subnets, one in each of the two chosen Availability Zones.
Assign appropriate CIDR blocks, for example, 10.0.101.0/24 and 10.0.102.0/24.
All subnets should be tagged appropriately (e.g., Environment: Development, Project: HighAvailabilityVPC).

Internet Connectivity:
Internet Gateway (IGW):
Create a single Internet Gateway and attach it to the defined VPC.
Establish a default route from the public subnets to the Internet Gateway.

NAT Gateways:
Set up two NAT Gateways, one in each of the public subnets, to ensure high availability for outbound internet connections from private subnets.
Each NAT Gateway must be associated with its own Elastic IP (EIP).
Configure route tables for the private subnets to route all outbound internet traffic (0.0.0.0/0) through their respective NAT Gateway.

Security Configuration

Security Groups:
Create a security group specifically for resources in the public subnets.
This public security group must allow inbound HTTP (port 80) and inbound HTTPS (port 443) traffic from anywhere (0.0.0.0/0).
Create a security group for resources in the private subnets.
This private security group should allow all outbound traffic and inbound traffic only from the public security group (for internal communication).

IAM Roles

EC2 S3 Access Role:
Define an IAM Role that EC2 instances can assume.
This role should grant permissions to read and write objects to S3 buckets. Specifically, include s3:GetObject, s3:PutObject, s3:DeleteObject, and s3:ListBucket actions.
Attach an instance profile to this role for easy association with EC2 instances.

Template Structure & Best Practices
Parameters: Include parameters for the VPC CIDR, public subnet CIDRs, private subnet CIDRs, and the two Availability Zones to make the template reusable.

Outputs: Define outputs for the created VPC ID, Public Subnet IDs, Private Subnet IDs, and the IAM Role ARN.
Descriptions: Add clear descriptions for each resource and parameter.
Naming Conventions: Use logical and consistent naming conventions for all resources (e.g., MyVPC, PublicSubnetA, PrivateSubnetB, PublicSecurityGroup).
Comments: Add comments to explain complex sections or design choices within the YAML.
Tags: Ensure all created resources (VPC, Subnets, IGW, NAT Gateways, EIPs, Security Groups, IAM Role) have appropriate tags (e.g., Name, Environment, Project).
Your final output should be a complete CloudFormation YAML template.
