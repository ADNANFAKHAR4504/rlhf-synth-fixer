I need to set up a complete VPC infrastructure in the us-west-2 region using Terraform. Here are the specific requirements:

1. Create a VPC with appropriate CIDR block in the us-west-2 region
2. Set up at least two public subnets in different availability zones within the VPC 
3. Set up at least two private subnets in different availability zones within the VPC
4. Configure proper route tables - public subnets should route to internet gateway, private subnets should route to NAT gateway
5. Associate the subnets with their respective route tables
6. Create security groups that allow HTTP (port 80) and HTTPS (port 443) traffic from anywhere
7. Implement restricted SSH access - only allow SSH (port 22) from CIDR block 203.0.113.0/24
8. Use Terraform modules to organize the code in a clean and reusable way
9. Tag all resources with 'Environment: Production'
10. Use AWS provider version 3.42.0 or later
11. Include AWS VPC Lattice service mesh for modern microservices communication
12. Add AWS VPC Reachability Analyzer for network troubleshooting capabilities

The infrastructure should be production-ready and follow AWS best practices. Please provide the complete Terraform HCL code with proper module structure. Each file should be in a separate code block.