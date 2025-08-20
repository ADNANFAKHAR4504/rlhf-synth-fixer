# VPC Network Infrastructure Setup

I need help setting up a basic VPC network infrastructure on AWS. Here are the requirements:

1. Create a VPC with CIDR block 10.0.0.0/16
2. Set up two public subnets in different availability zones within this VPC
3. Configure an Internet Gateway for internet access
4. Create appropriate route tables and associations

I'd like to incorporate some newer AWS features if possible - maybe VPC Lattice for future application connectivity and IPv6 support where appropriate since these are becoming more important. Also consider VPC endpoints as an alternative to NAT gateways for cost optimization.

Please provide infrastructure code that sets up this basic networking foundation. I prefer having one code block per file for easy implementation.