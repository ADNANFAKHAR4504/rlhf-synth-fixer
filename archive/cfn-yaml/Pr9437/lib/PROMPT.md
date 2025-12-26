I need help setting up a secure network infrastructure in AWS using CloudFormation YAML. I want to deploy this in the ap-south-1 region.

Here's what I need:

Create a VPC with CIDR 10.0.0.0/16. I need four subnets total - two public ones with 10.0.1.0/24 and 10.0.2.0/24, and two private ones with 10.0.3.0/24 and 10.0.4.0/24. Make sure to spread these across two different availability zones for better fault tolerance.

For internet connectivity, attach an Internet Gateway to the VPC. The public subnets should be able to reach the internet through this gateway. I also need a NAT Gateway in one of the public subnets so the private subnets can access the internet for updates and such.

On the security side, create a security group that only allows SSH access from my specific IP range 203.0.113.0/24. Don't open SSH to everyone - that's a security risk.

Can you output the IDs for all these resources? I need the VPC ID, both public subnet IDs, both private subnet IDs, the NAT Gateway ID, Internet Gateway ID, and the SSH security group ID. This helps me validate everything deployed correctly.

Just give me a clean CloudFormation template I can deploy directly - no extra parameters or complexity.
