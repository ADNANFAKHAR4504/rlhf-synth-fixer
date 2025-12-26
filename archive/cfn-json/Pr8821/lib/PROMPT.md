Hey team, I need help setting up a basic VPC in AWS for our fintech app. We're using CloudFormation with JSON, and it has to be in ap-southeast-1.

Basically, I want a VPC with CIDR 10.0.0.0/16, with DNS enabled. Then 2 public subnets in different AZs: 10.0.1.0/24 and 10.0.2.0/24, and 2 private ones: 10.0.10.0/24 and 10.0.11.0/24.

Need an internet gateway attached, NAT gateways in each public subnet with EIPs, and proper route tables so private subnets can access internet through NATs.

Tag everything with Environment, Project, and ManagedBy.

Output the VPC ID, subnet IDs, and NAT IPs.

This is for PCI-DSS compliance, so make sure the network is properly segmented.

Oh, and use an EnvironmentSuffix parameter for naming resources, like in our other stacks.

Thanks!
