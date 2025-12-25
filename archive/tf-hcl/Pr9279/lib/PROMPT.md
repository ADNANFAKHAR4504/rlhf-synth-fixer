I need to set up a complete VPC infrastructure in the us-west-2 region using Terraform for hosting a production web application.

Create a VPC with appropriate CIDR block that serves as the network foundation. The VPC connects to an Internet Gateway to enable public internet access for web-facing resources.

Set up two public subnets distributed across different availability zones within the VPC. These public subnets route outbound traffic through the Internet Gateway, allowing EC2 instances to receive inbound HTTP and HTTPS requests from users.

Set up two private subnets in different availability zones for backend services. Private subnets connect to a NAT Gateway deployed in the public subnet, enabling instances to download updates and patches from the internet while remaining inaccessible from external networks.

Configure route tables that define the traffic flow between subnets and gateways. Public route tables direct internet-bound traffic to the Internet Gateway, while private route tables forward outbound requests through the NAT Gateway.

Create security groups that control traffic between the VPC resources and external networks. The web tier security group allows inbound HTTP on port 80 and HTTPS on port 443 from any source. Implement restricted SSH access that only permits connections from the CIDR block 203.0.113.0/24 for administrative access.

The NAT Gateway requires an Elastic IP address that provides a static public IP for outbound connections from private subnets.

Use Terraform modules to organize the VPC and security group configurations in a clean and reusable structure. Tag all resources with Environment set to Production. Use AWS provider version 3.42.0 or later.

The infrastructure should follow AWS best practices for network isolation, high availability across multiple availability zones, and secure access patterns.
