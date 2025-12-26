## Building a High-Availability AWS Network

Hey, we need to set up a solid, highly available network infrastructure using CloudFormation YAML.

Here's the setup:

Build a VPC network that spreads across two availability zones. Each zone gets one public subnet and one private subnet. Attach an Internet Gateway to the VPC so the public subnets can route traffic to the internet.

For the private subnets, set up NAT Gateways in each public subnet - this lets private subnet resources initiate outbound connections to the internet while staying protected. Route tables should direct private subnet traffic through the NAT Gateways.

Security group for public subnets needs to allow HTTP on port 80 and HTTPS on port 443 from anywhere. Private subnet security group should allow SSH on port 22 but only from specific internal IP ranges we provide as a parameter.

Add Network ACLs as an extra security layer. Public ACL allows HTTP/HTTPS inbound and all outbound. Private ACL allows SSH from the VPC CIDR and all outbound.

Deploy this in us-west-2 region. Tag all resources with Environment: Production. Make it production-ready with proper high-availability across zones.

Give me a complete CloudFormation YAML template that creates this whole network infrastructure.
