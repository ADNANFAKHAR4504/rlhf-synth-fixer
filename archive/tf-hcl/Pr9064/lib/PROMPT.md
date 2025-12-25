Prompt
Design a foundational AWS cloud environment using Terraform that establishes secure network connectivity for production workloads.

Requirements
Create a VPC with CIDR block 10.0.0.0/16 that serves as the network foundation. The VPC connects to an Internet Gateway to enable public subnet internet access.

Provision two public subnets and two private subnets distributed across two availability zones in us-east-1 for high availability. Public subnets connect to the Internet Gateway through a public route table that routes 0.0.0.0/0 traffic to the gateway. Private subnets remain isolated with their own route table for internal-only communication.

The Internet Gateway attaches to the VPC and enables outbound internet connectivity for resources in public subnets. Route table associations link each subnet to its appropriate route table to control traffic flow.

Security Standards
Only expose public resources where necessary and restrict network access appropriately for public and private subnets. Public subnets enable automatic public IP assignment for launched instances.

Tagging
All resources must include the tag key Environment with the value Production.

Compliance
Use only AWS services available in the us-east-1 region. The configuration must pass terraform validate and be suitable for deployment.

Output Format
Provide a single Terraform configuration file that is formatted, valid, and ready for deployment.
